import "dotenv/config";
import { PrismaClient } from "@dayshift/db";
import { Queue, Worker, Job } from "bullmq";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();
const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6380";
const parsed = new URL(redisUrl);
const connection = {
  host: parsed.hostname || "localhost",
  port: Number(parsed.port || 6379),
  ...(parsed.username ? { username: decodeURIComponent(parsed.username) } : {}),
  ...(parsed.password ? { password: decodeURIComponent(parsed.password) } : {}),
  db: Number(parsed.pathname.replace("/", "") || 0),
  maxRetriesPerRequest: null as null,
};
const QUEUE_NAME = "dayshift";

const log = (message: string, extra?: unknown) => {
  const line = `[worker] ${new Date().toISOString()} ${message}`;
  if (extra !== undefined) console.log(line, extra);
  else console.log(line);
};

// ── Email transport ────────────────────────────────────────────────────
const mailMode = process.env.MAIL_MODE ?? "file";
const mailFrom = process.env.MAIL_FROM ?? "DAYSHIFT <hello@dayshift.example>";
const smtpTransport =
  mailMode === "smtp"
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASSWORD
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
            : undefined,
      })
    : null;

async function deliver(message: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  if (smtpTransport) {
    await smtpTransport.sendMail({
      from: mailFrom,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
    return { mode: "smtp" };
  }
  const dir = join(process.cwd(), ".mail");
  await mkdir(dir, { recursive: true });
  const safe = message.to.replace(/[^a-z0-9@._-]/gi, "_");
  const file = join(dir, `${Date.now()}-${safe}.eml`);
  const eml = [
    `From: ${mailFrom}`,
    `To: ${message.to}`,
    `Subject: ${message.subject}`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="utf-8"',
    "",
    message.html,
  ].join("\r\n");
  await writeFile(file, eml, "utf8");
  return { mode: "file", file };
}

async function sendNotification(notificationId: string) {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification) {
    log(`notification ${notificationId} not found, skipping`);
    return;
  }
  if (notification.status === "SENT" || notification.status === "READ") return;
  if (!notification.email) {
    await prisma.notification.update({
      where: { id: notification.id },
      data: { status: "FAILED", error: "No recipient email" },
    });
    return;
  }
  const text = notification.body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  try {
    const result = await deliver({
      to: notification.email,
      subject: notification.subject,
      html: notification.body,
      text,
    });
    await prisma.notification.update({
      where: { id: notification.id },
      data: { status: "SENT", sentAt: new Date(), error: null },
    });
    log(`email sent ${notification.template} -> ${notification.email}`, result);
  } catch (error) {
    await prisma.notification.update({
      where: { id: notification.id },
      data: { status: "FAILED", error: (error as Error).message.slice(0, 500) },
    });
    throw error;
  }
}

// ── Jobs ────────────────────────────────────────────────────────────────
async function processJob(job: Job) {
  switch (job.name) {
    case "email.send":
      await sendNotification(String(job.data.notificationId));
      break;
    case "email.retry": {
      const pending = await prisma.notification.findMany({
        where: {
          channel: "EMAIL",
          status: { in: ["PENDING", "FAILED"] },
          createdAt: { lt: new Date(Date.now() - 2 * 60_000) },
        },
        take: 25,
        orderBy: { createdAt: "asc" },
      });
      for (const notification of pending) {
        try {
          await sendNotification(notification.id);
        } catch (error) {
          log(`retry failed for ${notification.id}`, (error as Error).message);
        }
      }
      if (pending.length) log(`retried ${pending.length} notifications`);
      break;
    }
    case "reservation.expire": {
      const { expireStaleReservations } = await import("@dayshift/db");
      const count = await expireStaleReservations(prisma);
      if (count) log(`expired ${count} stock reservations`);
      break;
    }
    case "payment.reconcile": {
      const orders = await prisma.order.findMany({
        where: {
          updatedAt: { gte: new Date(Date.now() - 7 * 86_400_000) },
          payments: { some: {} },
        },
        include: { payments: true, refunds: true },
        take: 200,
      });
      let corrected = 0;
      for (const order of orders) {
        const paid = order.payments.filter((p) => p.status === "PAID").reduce((s, p) => s + Number(p.amount), 0);
        const refunded = order.refunds
          .filter((r) => r.status === "PROCESSED")
          .reduce((s, r) => s + Number(r.amount), 0);
        const expected =
          paid === 0 ? order.paymentStatus : refunded === 0 ? "PAID" : refunded >= paid ? "REFUNDED" : "PARTIALLY_REFUNDED";
        if (expected !== order.paymentStatus) {
          await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: expected as never } });
          corrected += 1;
        }
      }
      if (corrected) log(`reconciled ${corrected} orders`);
      break;
    }
    default:
      log(`unknown job ${job.name}`);
  }
}

// ── Bootstrap ───────────────────────────────────────────────────────────
const queue = new Queue(QUEUE_NAME, { connection });
const worker = new Worker(QUEUE_NAME, processJob, {
  connection,
  concurrency: 5,
  limiter: { max: 20, duration: 1000 },
});

worker.on("completed", (job) => log(`completed ${job.name}#${job.id}`));
worker.on("failed", (job, error) =>
  log(`failed ${job?.name}#${job?.id}: ${error.message}`),
);
worker.on("error", (error) => log(`worker error: ${error.message}`));

async function schedule() {
  await queue.add("reservation.expire", {}, {
    repeat: { every: 60_000 },
    jobId: "reservation-expire",
    removeOnComplete: true,
  });
  await queue.add("email.retry", {}, {
    repeat: { every: 5 * 60_000 },
    jobId: "email-retry",
    removeOnComplete: true,
  });
  await queue.add("payment.reconcile", {}, {
    repeat: { every: 24 * 60 * 60_000 },
    jobId: "payment-reconcile",
    removeOnComplete: true,
  });
  log("repeatable jobs scheduled");
}

async function shutdown(signal: string) {
  log(`received ${signal}, shutting down`);
  await worker.close();
  await queue.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

async function main() {
  await schedule();
  // Recover any notifications left pending by a previous outage.
  await queue.add("email.retry", {}, { removeOnComplete: true });
  log(`DAYSHIFT worker ready (mail mode: ${mailMode})`);
}

main().catch(async (error) => {
  console.error("[worker] failed to start", error);
  await prisma.$disconnect();
  process.exit(1);
});
