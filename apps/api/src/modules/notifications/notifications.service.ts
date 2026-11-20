import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.module";
import { JobService } from "../../queue/queue.module";
import { renderEmail } from "./email-templates";

export interface EmailRequest {
  userId?: string | null;
  to: string;
  template: string;
  data: Record<string, unknown>;
  dedupeKey?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger("Notifications");
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobs: JobService,
  ) {}

  async email(request: EmailRequest) {
    const rendered = renderEmail(request.template, request.data);
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId: request.userId ?? null,
          email: request.to,
          channel: "EMAIL",
          template: request.template,
          subject: rendered.subject,
          body: rendered.html,
          status: "PENDING",
          dedupeKey: request.dedupeKey ?? null,
        },
      });
      await this.jobs.add(
        "email.send",
        {
          notificationId: notification.id,
          to: request.to,
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
        },
        { jobId: request.dedupeKey ? `email-${request.dedupeKey}` : undefined },
      );
      return notification;
    } catch (error) {
      if ((error as { code?: string }).code === "P2002") {
        // Duplicate notification (same dedupe key) is a no-op.
        return null;
      }
      this.logger.error(`Could not queue email ${request.template}: ${(error as Error).message}`);
      return null;
    }
  }

  async inApp(input: {
    userId: string;
    template: string;
    subject: string;
    body: string;
    dedupeKey?: string;
  }) {
    try {
      return await this.prisma.notification.create({
        data: {
          userId: input.userId,
          channel: "IN_APP",
          template: input.template,
          subject: input.subject,
          body: input.body,
          status: "SENT",
          sentAt: new Date(),
          dedupeKey: input.dedupeKey ?? null,
        },
      });
    } catch (error) {
      if ((error as { code?: string }).code !== "P2002") {
        this.logger.warn(`Could not create in-app notification: ${(error as Error).message}`);
      }
      return null;
    }
  }

  async listForUser(userId: string, page = 1, pageSize = 20) {
    const where = { userId, channel: "IN_APP" as const };
    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.notification.count({ where }),
    ]);
    return { items, total };
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { status: "READ", readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, channel: "IN_APP", readAt: null },
      data: { status: "READ", readAt: new Date() },
    });
  }

  async unreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, channel: "IN_APP", readAt: null },
    });
  }
}
