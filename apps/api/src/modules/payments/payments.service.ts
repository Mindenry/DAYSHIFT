import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@dayshift/db";
import { toCents } from "@dayshift/config";
import { PrismaService } from "../../prisma/prisma.module";
import { InventoryService } from "../inventory/inventory.service";
import { NotificationsService } from "../notifications/notifications.service";
import { LoyaltyService } from "../loyalty/loyalty.service";
import { AuditService } from "../audit/audit.service";
import { AppError } from "../../common/app-error";

interface SandboxEvent {
  eventId: string;
  type: "payment.succeeded" | "payment.failed";
  reference: string;
  amountCents: number;
  currency: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger("Payments");
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly inventory: InventoryService,
    private readonly notifications: NotificationsService,
    private readonly loyalty: LoyaltyService,
    private readonly audit: AuditService,
  ) {}

  private secret() {
    return this.config.get<string>("PAYMENT_SANDBOX_SECRET") ?? "dev-secret";
  }

  async processSandboxEvent(event: SandboxEvent) {
    const record = await this.prisma.paymentEvent.findUnique({ where: { eventId: event.eventId } });
    if (record?.processedAt) {
      return { duplicate: true, processed: true };
    }
    if (record && !record.processedAt) {
      // A previous attempt recorded the event but failed mid-processing; retry
      // is allowed because all state transitions below are idempotent.
    } else {
      await this.prisma.paymentEvent.create({
        data: {
          provider: "sandbox",
          eventId: event.eventId,
          type: event.type,
          payload: event as unknown as Prisma.InputJsonValue,
          signatureValid: true,
        },
      });
    }

    const payment = await this.prisma.payment.findUnique({
      where: { providerRef: event.reference },
      include: { order: { include: { items: true } } },
    });
    if (!payment) throw AppError.notFound("Payment not found");
    if (toCents(payment.amount) !== event.amountCents) {
      throw AppError.validation("Payment amount does not match the order.");
    }

    if (event.type === "payment.succeeded") {
      await this.succeed(payment.id, event.eventId);
    } else {
      await this.fail(payment.id, event.eventId, "Sandbox payment declined");
    }

    await this.prisma.paymentEvent.update({
      where: { eventId: event.eventId },
      data: { paymentId: payment.id, processedAt: new Date() },
    });
    return { duplicate: false, processed: true };
  }

  private async succeed(paymentId: string, eventId: string) {
    const outcome = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { order: true },
      });
      if (!payment) throw AppError.notFound("Payment not found");
      if (payment.status === "PAID") return { alreadyPaid: true, order: payment.order };

      if (payment.order.status !== "PENDING_PAYMENT" && payment.order.status !== "PAYMENT_FAILED") {
        // Late success for an order that has already been cancelled or handled.
        this.logger.warn(`Ignoring payment success for order in state ${payment.order.status}`);
        return { alreadyPaid: false, order: payment.order, ignored: true };
      }

      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "PAID", capturedAt: new Date(), failureReason: null },
      });
      const order = await tx.order.update({
        where: { id: payment.orderId },
        data: { status: "PAID", paymentStatus: "PAID", paidAt: new Date() },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: payment.order.status,
          toStatus: "PAID",
          actorType: "SYSTEM",
          reason: "Payment captured",
          metadata: { eventId },
        },
      });
      await this.inventory.commitForOrder(tx, order.id);

      if (order.couponCode && order.userId) {
        const coupon = await tx.coupon.findUnique({ where: { code: order.couponCode } });
        if (coupon) {
          await tx.couponRedemption
            .create({
              data: { couponId: coupon.id, userId: order.userId, orderId: order.id },
            })
            .catch(() => undefined);
        }
      }

      let loyalty: Awaited<ReturnType<LoyaltyService["awardForOrder"]>> = null;
      if (order.userId) {
        const merchandise = toCents(order.subtotal) - toCents(order.discountTotal);
        loyalty = await this.loyalty.awardForOrder(tx, order.userId, order.id, merchandise);
      }
      return { alreadyPaid: false, order, loyalty };
    });

    if (!outcome.alreadyPaid && !("ignored" in outcome)) {
      const order = outcome.order;
      const email = order.email;
      await this.notifications.email({
        userId: order.userId ?? undefined,
        to: email,
        template: "order-confirmation",
        data: {
          firstName: order.email.split("@")[0],
          orderNumber: order.orderNumber,
          totalCents: toCents(order.grandTotal),
          currency: order.currency,
          url: `${this.config.get("APP_URL") ?? "http://localhost:3000"}/account/orders/${order.orderNumber}`,
        },
        dedupeKey: `order-confirmation:${order.id}`,
      });
      if (order.userId) {
        await this.notifications.inApp({
          userId: order.userId,
          template: "order.paid",
          subject: `Order ${order.orderNumber} confirmed`,
          body: `We've received your payment. We'll let you know as soon as your order ships.`,
          dedupeKey: `inapp-order-paid:${order.id}`,
        });
      }
      await this.audit.log({
        actorType: "SYSTEM",
        action: "payment.succeeded",
        entityType: "Payment",
        entityId: paymentId,
        after: { eventId, orderId: order.id },
      });
    }
  }

  private async fail(paymentId: string, eventId: string, reason: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });
    if (!payment) throw AppError.notFound("Payment not found");
    if (payment.status === "PAID" || payment.status === "REFUNDED") return;

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED", failedAt: new Date(), failureReason: reason },
      });
      if (payment.order.status === "PENDING_PAYMENT") {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: "PAYMENT_FAILED", paymentStatus: "FAILED" },
        });
        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.orderId,
            fromStatus: "PENDING_PAYMENT",
            toStatus: "PAYMENT_FAILED",
            actorType: "SYSTEM",
            reason,
            metadata: { eventId },
          },
        });
      }
    });
    await this.inventory.releaseForOrder(payment.orderId, "Payment failed");
    await this.notifications.email({
      userId: payment.order.userId ?? undefined,
      to: payment.order.email,
      template: "payment-failed",
      data: {
        orderNumber: payment.order.orderNumber,
        url: `${this.config.get("APP_URL") ?? "http://localhost:3000"}/account/orders/${payment.order.orderNumber}`,
      },
      dedupeKey: `payment-failed:${payment.id}`,
    });
    await this.audit.log({
      actorType: "SYSTEM",
      action: "payment.failed",
      entityType: "Payment",
      entityId: paymentId,
      after: { eventId, reason },
    });
  }

  /** Issues a sandbox refund. Only authorised staff reach this method. */
  async refund(input: {
    orderId: string;
    amountCents: number;
    reason: string;
    returnRequestId?: string | null;
    items?: Array<{ orderItemId: string; quantity: number; amountCents: number }>;
    actorId?: string;
    actorEmail?: string;
  }) {
    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
      include: { payments: true, refunds: true },
    });
    if (!order) throw AppError.notFound("Order not found");
    const paid = order.payments
      .filter((p) => ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"].includes(p.status))
      .reduce((sum, p) => sum + toCents(p.amount), 0);
    const alreadyRefunded = order.refunds
      .filter((r) => r.status === "PROCESSED")
      .reduce((sum, r) => sum + toCents(r.amount), 0);
    if (input.amountCents <= 0) throw AppError.validation("Refund amount must be greater than zero.");
    if (input.amountCents > paid - alreadyRefunded) {
      throw AppError.validation("Refund exceeds the amount available to refund.");
    }
    if (order.paymentStatus === "PENDING") {
      throw AppError.validation("This order has not been paid.");
    }

    const payment = order.payments.find((p) => ["PAID", "PARTIALLY_REFUNDED"].includes(p.status));
    const refund = await this.prisma.$transaction(async (tx) => {
      const refund = await tx.refund.create({
        data: {
          orderId: order.id,
          paymentId: payment?.id ?? null,
          returnRequestId: input.returnRequestId ?? null,
          amount: new Prisma.Decimal((input.amountCents / 100).toFixed(2)),
          reason: input.reason,
          status: "PROCESSED",
          providerRef: `sbxrefund_${Date.now()}`,
          processedById: input.actorId ?? null,
          processedAt: new Date(),
          items: input.items?.length
            ? {
                create: input.items.map((item) => ({
                  orderItemId: item.orderItemId,
                  quantity: item.quantity,
                  amount: new Prisma.Decimal((item.amountCents / 100).toFixed(2)),
                })),
              }
            : undefined,
        },
      });
      const totalRefunded = alreadyRefunded + input.amountCents;
      const fully = totalRefunded >= paid;
      if (payment) {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: fully ? "REFUNDED" : "PARTIALLY_REFUNDED" },
        });
      }
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: fully ? "REFUNDED" : "PARTIALLY_REFUNDED",
          ...(fully ? { status: "REFUNDED" } : {}),
        },
      });
      if (fully) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: order.status,
            toStatus: "REFUNDED",
            actorType: "STAFF",
            actorId: input.actorId,
            reason: input.reason,
          },
        });
      }
      return refund;
    });

    await this.notifications.email({
      userId: order.userId ?? undefined,
      to: order.email,
      template: "refund-processed",
      data: {
        orderNumber: order.orderNumber,
        amountCents: input.amountCents,
        currency: order.currency,
      },
      dedupeKey: `refund-processed:${refund.id}`,
    });
    await this.audit.log({
      actorType: "STAFF",
      actorId: input.actorId,
      actorEmail: input.actorEmail,
      action: "refund.processed",
      entityType: "Refund",
      entityId: refund.id,
      after: { orderId: order.id, amountCents: input.amountCents, reason: input.reason },
    });
    return refund;
  }

  async reconcile(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true, refunds: true },
    });
    if (!order) throw AppError.notFound("Order not found");
    const paid = order.payments.filter((p) => p.status === "PAID").reduce((s, p) => s + toCents(p.amount), 0);
    const refunded = order.refunds.filter((r) => r.status === "PROCESSED").reduce((s, r) => s + toCents(r.amount), 0);
    const expected =
      paid === 0 ? "PENDING" : refunded === 0 ? "PAID" : refunded >= paid ? "REFUNDED" : "PARTIALLY_REFUNDED";
    if (order.paymentStatus !== expected) {
      await this.prisma.order.update({ where: { id: orderId }, data: { paymentStatus: expected } });
      await this.audit.log({
        action: "payment.reconciled",
        entityType: "Order",
        entityId: orderId,
        before: { paymentStatus: order.paymentStatus },
        after: { paymentStatus: expected },
      });
    }
    return { paymentStatus: expected, paid, refunded };
  }

  sandboxSecret() {
    return this.secret();
  }
}
