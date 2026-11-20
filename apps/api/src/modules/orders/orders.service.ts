import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@dayshift/db";
import {
  canTransition,
  generateReturnNumber,
  ORDER_STATUS_LABELS,
  toCents,
  type OrderStatus,
} from "@dayshift/config";
import { PrismaService } from "../../prisma/prisma.module";
import { InventoryService } from "../inventory/inventory.service";
import { PaymentsService } from "../payments/payments.service";
import { NotificationsService } from "../notifications/notifications.service";
import { AuditService } from "../audit/audit.service";
import { CartService } from "../cart/cart.service";
import { AppError } from "../../common/app-error";
import { getPaging, paged } from "../../common/pagination";
import { AuthUser } from "../../common/types";
import {
  CancelOrderDto,
  CreateReturnDto,
  CreateShipmentDto,
  GuestLookupDto,
  OrderListQueryDto,
  ReturnListQueryDto,
  ShipmentEventDto,
  UpdateReturnDto,
} from "./orders.dto";
import {
  orderInclude,
  returnEligibility,
  toOrderDetail,
  toOrderSummary,
} from "./orders.mapper";

const RETURN_TRANSITIONS: Record<string, string[]> = {
  REQUESTED: ["UNDER_REVIEW", "APPROVED", "REJECTED", "CANCELLED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["RETURN_SHIPPED", "RECEIVED", "CANCELLED"],
  RETURN_SHIPPED: ["RECEIVED", "CANCELLED"],
  RECEIVED: ["INSPECTED", "CANCELLED"],
  INSPECTED: ["REFUND_PENDING", "REFUNDED", "CLOSED"],
  REFUND_PENDING: ["REFUNDED", "CLOSED"],
  REFUNDED: ["CLOSED"],
  REJECTED: ["CLOSED"],
  CLOSED: [],
  CANCELLED: [],
};

const SHIPMENT_TRANSITIONS: Record<string, string[]> = {
  READY_TO_SHIP: ["PICKED_UP", "IN_TRANSIT", "CANCELLED"],
  PICKED_UP: ["IN_TRANSIT", "FAILED_DELIVERY", "RETURN_TO_SENDER"],
  IN_TRANSIT: ["OUT_FOR_DELIVERY", "DELIVERED", "FAILED_DELIVERY", "RETURN_TO_SENDER"],
  OUT_FOR_DELIVERY: ["DELIVERED", "FAILED_DELIVERY"],
  DELIVERED: [],
  FAILED_DELIVERY: ["OUT_FOR_DELIVERY", "RETURN_TO_SENDER", "CANCELLED"],
  RETURN_TO_SENDER: ["DELIVERED"],
  CANCELLED: [],
};

const ACTIVE_RETURN_STATUSES = [
  "REQUESTED",
  "UNDER_REVIEW",
  "APPROVED",
  "RETURN_SHIPPED",
  "RECEIVED",
  "INSPECTED",
  "REFUND_PENDING",
];

export interface StaffActor {
  id: string;
  email: string;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger("Orders");
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly inventory: InventoryService,
    private readonly payments: PaymentsService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
    private readonly cart: CartService,
  ) {}

  private appUrl() {
    return this.config.get<string>("APP_URL") ?? "http://localhost:3000";
  }

  private async orderByNumber(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: orderInclude,
    });
    if (!order) throw AppError.notFound("Order not found");
    return order;
  }

  async listForUser(user: AuthUser, query: OrderListQueryDto) {
    const { page, pageSize, skip, take } = getPaging(query);
    const where: Prisma.OrderWhereInput = {
      userId: user.id,
      ...(query.status ? { status: query.status as OrderStatus } : {}),
    };
    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
    ]);
    return paged(orders.map(toOrderSummary), total, page, pageSize);
  }

  async detailForUser(user: AuthUser, orderNumber: string) {
    const order = await this.prisma.order.findFirst({
      where: { orderNumber, userId: user.id },
      include: orderInclude,
    });
    if (!order) throw AppError.notFound("Order not found");
    return toOrderDetail(order);
  }

  async guestLookup(dto: GuestLookupDto) {
    const order = await this.prisma.order.findFirst({
      where: { orderNumber: dto.orderNumber.trim(), email: dto.email.trim().toLowerCase() },
      include: orderInclude,
    });
    if (!order) throw AppError.notFound("No order matches those details.");
    return toOrderDetail(order);
  }

  async cancelForUser(user: AuthUser, orderNumber: string, dto: CancelOrderDto) {
    const order = await this.prisma.order.findFirst({
      where: { orderNumber, userId: user.id },
      include: orderInclude,
    });
    if (!order) throw AppError.notFound("Order not found");
    return this.cancelOrder(order, { id: user.id, email: user.email, type: "CUSTOMER" }, dto.reason);
  }

  async cancelOrder(
    order: Prisma.OrderGetPayload<{ include: typeof orderInclude }>,
    actor: { id?: string; email?: string; type: "CUSTOMER" | "STAFF" | "SYSTEM" },
    reason?: string,
  ) {
    const cancellable = ["PENDING_PAYMENT", "PAYMENT_FAILED", "PAID", "PROCESSING", "ON_HOLD"];
    if (!cancellable.includes(order.status)) {
      throw AppError.conflict(
        `Orders in ${ORDER_STATUS_LABELS[order.status as OrderStatus]} cannot be cancelled online. Contact support.`,
      );
    }
    if (order.paymentStatus === "PAID" && toCents(order.grandTotal) > 0) {
      const refunded = order.refunds
        .filter((refund) => refund.status === "PROCESSED")
        .reduce((sum, refund) => sum + toCents(refund.amount), 0);
      const refundable = toCents(order.grandTotal) - refunded;
      if (refundable > 0) {
        await this.payments.refund({
          orderId: order.id,
          amountCents: refundable,
          reason: reason ?? "Order cancelled",
          actorId: actor.id,
          actorEmail: actor.email,
        });
      }
      await this.inventory.restockCancelledOrder(order.id, "Order cancelled after payment");
    }

    await this.inventory.releaseForOrder(order.id, "Order cancelled");

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          paymentStatus:
            order.paymentStatus === "PAID" ? "REFUNDED" : order.paymentStatus === "PENDING" ? "CANCELLED" : order.paymentStatus,
        },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: "CANCELLED",
          actorType: actor.type,
          actorId: actor.id,
          reason: reason ?? "Cancelled",
        },
      });
    });
    if (order.userId) {
      await this.notifications.inApp({
        userId: order.userId,
        template: "order.cancelled",
        subject: `Order ${order.orderNumber} cancelled`,
        body: "Your order has been cancelled. Any payment will be refunded to the original method.",
        dedupeKey: `order-cancelled:${order.id}`,
      });
    }
    await this.audit.log({
      actorType: actor.type,
      actorId: actor.id,
      actorEmail: actor.email,
      action: "order.cancelled",
      entityType: "Order",
      entityId: order.id,
      after: { reason },
    });
    return { cancelled: true };
  }

  async updateStatus(
    orderId: string,
    status: string,
    actor: StaffActor,
    reason?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: orderInclude,
    });
    if (!order) throw AppError.notFound("Order not found");
    if (status === "CANCELLED") {
      return this.cancelOrder(order, { id: actor.id, email: actor.email, type: "STAFF" }, reason);
    }
    const target = status as OrderStatus;
    if (!canTransition(order.status, target)) {
      throw AppError.conflict(
        `Cannot move an order from ${ORDER_STATUS_LABELS[order.status]} to ${ORDER_STATUS_LABELS[target] ?? status}.`,
      );
    }
    if (target === "SHIPPED" && !order.shipments.some((shipment) => shipment.status !== "CANCELLED")) {
      throw AppError.validation("Create a shipment with tracking before marking the order shipped.");
    }
    if (target === "REFUNDED" || target === "REFUND_PENDING") {
      throw AppError.validation("Refunds are processed from the returns workflow.");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: target,
          ...(target === "COMPLETED" ? { completedAt: new Date() } : {}),
        },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: target,
          actorType: "STAFF",
          actorId: actor.id,
          reason: reason ?? null,
        },
      });
    });

    if (order.userId) {
      await this.notifications.inApp({
        userId: order.userId,
        template: `order.${target.toLowerCase()}`,
        subject: `Order ${order.orderNumber}: ${ORDER_STATUS_LABELS[target]}`,
        body: `Your order is now ${ORDER_STATUS_LABELS[target].toLowerCase()}.`,
        dedupeKey: `order-status:${order.id}:${target}`,
      });
    }
    await this.audit.log({
      actorType: "STAFF",
      actorId: actor.id,
      actorEmail: actor.email,
      action: "order.status_changed",
      entityType: "Order",
      entityId: order.id,
      before: { status: order.status },
      after: { status: target, reason },
    });
    return { status: target };
  }

  async reorder(user: AuthUser, orderNumber: string) {
    const order = await this.prisma.order.findFirst({
      where: { orderNumber, userId: user.id },
      include: { items: true },
    });
    if (!order) throw AppError.notFound("Order not found");
    let added = 0;
    let skipped = 0;
    for (const item of order.items) {
      if (!item.variantId) {
        skipped += 1;
        continue;
      }
      try {
        await this.cart.addItem({ user }, item.variantId, Math.min(item.quantity, 10));
        added += 1;
      } catch {
        skipped += 1;
      }
    }
    return { added, skipped };
  }

  // ── Shipments ────────────────────────────────────────────────────────
  async createShipment(orderId: string, dto: CreateShipmentDto, actor: StaffActor) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw AppError.notFound("Order not found");
    if (!["PACKED", "SHIPPED"].includes(order.status)) {
      throw AppError.conflict("Pack the order before creating a shipment.");
    }
    const shipment = await this.prisma.shipment.create({
      data: {
        orderId,
        carrier: dto.carrier,
        service: dto.service,
        trackingNumber: dto.trackingNumber ?? `NLE-${Date.now().toString().slice(-10)}`,
        status: "READY_TO_SHIP",
        estimatedDelivery: dto.estimatedDelivery ? new Date(dto.estimatedDelivery) : null,
        events: {
          create: {
            status: "READY_TO_SHIP",
            description: "Shipment created",
            location: "Brooklyn, NY",
          },
        },
      },
    });
    await this.audit.log({
      actorType: "STAFF",
      actorId: actor.id,
      actorEmail: actor.email,
      action: "shipment.created",
      entityType: "Shipment",
      entityId: shipment.id,
      after: { orderId, carrier: dto.carrier, trackingNumber: shipment.trackingNumber },
    });
    return shipment;
  }

  async updateShipment(shipmentId: string, dto: ShipmentEventDto, actor: StaffActor) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { order: true },
    });
    if (!shipment) throw AppError.notFound("Shipment not found");
    const target = dto.status;
    if (!SHIPMENT_TRANSITIONS[shipment.status]?.includes(target)) {
      throw AppError.conflict(`Cannot move shipment from ${shipment.status} to ${target}.`);
    }
    const orderStatusMap: Record<string, OrderStatus | null> = {
      PICKED_UP: "SHIPPED",
      IN_TRANSIT: "SHIPPED",
      OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
      DELIVERED: "DELIVERED",
    };
    const orderTarget = orderStatusMap[target] ?? null;

    await this.prisma.$transaction(async (tx) => {
      await tx.shipment.update({
        where: { id: shipment.id },
        data: {
          status: target as never,
          ...(target === "IN_TRANSIT" || target === "PICKED_UP" ? { shippedAt: shipment.shippedAt ?? new Date() } : {}),
          ...(target === "DELIVERED" ? { deliveredAt: new Date() } : {}),
        },
      });
      await tx.shipmentEvent.create({
        data: {
          shipmentId: shipment.id,
          status: target as never,
          description: dto.description,
          location: dto.location,
          occurredAt: new Date(),
        },
      });
      if (orderTarget) {
        const current = shipment.order.status;
        if (canTransition(current, orderTarget)) {
          await tx.order.update({
            where: { id: shipment.orderId },
            data: {
              status: orderTarget,
              ...(orderTarget === "DELIVERED" ? {} : {}),
            },
          });
          await tx.orderStatusHistory.create({
            data: {
              orderId: shipment.orderId,
              fromStatus: current,
              toStatus: orderTarget,
              actorType: "STAFF",
              actorId: actor.id,
              reason: `Shipment ${target.toLowerCase().replace(/_/g, " ")}`,
            },
          });
        } else if (current !== orderTarget) {
          this.logger.warn(
            `Shipment ${shipment.id} ${target} did not change order ${shipment.orderId} (state ${current})`,
          );
        }
      }
    });

    const order = shipment.order;
    if (target === "IN_TRANSIT" || target === "PICKED_UP") {
      await this.notifications.email({
        userId: order.userId ?? undefined,
        to: order.email,
        template: "order-shipped",
        data: {
          orderNumber: order.orderNumber,
          trackingNumber: shipment.trackingNumber,
          url: `${this.appUrl()}/account/orders/${order.orderNumber}`,
        },
        dedupeKey: `order-shipped:${shipment.id}`,
      });
    }
    if (target === "DELIVERED" && order.userId) {
      await this.notifications.inApp({
        userId: order.userId,
        template: "order.delivered",
        subject: `Order ${order.orderNumber} delivered`,
        body: "Your order has been delivered. We hope you love it.",
        dedupeKey: `order-delivered:${shipment.id}`,
      });
    }
    await this.audit.log({
      actorType: "STAFF",
      actorId: actor.id,
      actorEmail: actor.email,
      action: "shipment.updated",
      entityType: "Shipment",
      entityId: shipment.id,
      after: { status: target, description: dto.description },
    });
    return { status: target };
  }

  async shipmentTracking(orderNumber: string, user?: AuthUser, email?: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: { shipments: { include: { events: { orderBy: { occurredAt: "asc" } } } } },
    });
    if (!order) throw AppError.notFound("Order not found");
    if (user && order.userId !== user.id) throw AppError.notFound("Order not found");
    if (!user && (!email || order.email !== email.toLowerCase())) {
      throw AppError.unauthorized("Provide the email used for this order.");
    }
    return {
      orderNumber: order.orderNumber,
      status: order.status,
      shipments: order.shipments.map((shipment) => ({
        carrier: shipment.carrier,
        service: shipment.service,
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        estimatedDelivery: shipment.estimatedDelivery,
        events: shipment.events,
      })),
    };
  }

  // ── Returns ──────────────────────────────────────────────────────────
  async createReturn(user: AuthUser, dto: CreateReturnDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: orderInclude,
    });
    if (!order || order.userId !== user.id) throw AppError.notFound("Order not found");
    const eligibility = returnEligibility(order);
    if (!eligibility.canReturn) {
      throw AppError.conflict(
        "This order is not eligible for a return. Returns are accepted within 30 days of delivery.",
      );
    }
    if (!dto.items.length) throw AppError.validation("Select at least one item to return.");

    const active = order.returnRequests.filter((request) =>
      ACTIVE_RETURN_STATUSES.includes(request.status),
    );
    if (active.length) throw AppError.conflict("You already have an open return for this order.");

    const items: Array<{
      orderItemId: string;
      quantity: number;
      conditionNotes?: string;
      exchangeVariantId?: string;
      refundCents: number;
    }> = [];

    for (const input of dto.items) {
      const orderItem = order.items.find((item) => item.id === input.orderItemId);
      if (!orderItem) throw AppError.validation("One of the selected items is not part of this order.");
      const returnable = orderItem.quantity - orderItem.returnedQuantity - orderItem.refundedQuantity;
      if (input.quantity > returnable) {
        throw AppError.validation(
          `You can return at most ${returnable} of ${orderItem.productName}.`,
        );
      }
      if (dto.resolution === "EXCHANGE") {
        if (!input.exchangeVariantId) {
          throw AppError.validation(`Choose a replacement size for ${orderItem.productName}.`);
        }
        const variant = await this.prisma.variant.findFirst({
          where: { id: input.exchangeVariantId, productId: orderItem.productId ?? "__none__", isActive: true },
          include: { inventory: true },
        });
        if (!variant) throw AppError.validation("The replacement variant is not available.");
        const available = variant.inventory.reduce(
          (sum, row) => sum + Math.max(0, row.onHand - row.reserved - row.damaged),
          0,
        );
        if (available < input.quantity) {
          throw AppError.conflict("The replacement size is out of stock.");
        }
      }
      const perUnit = Math.round(
        (toCents(orderItem.lineTotal) - toCents(orderItem.discountAllocated) + toCents(orderItem.taxAmount)) /
          orderItem.quantity,
      );
      items.push({
        orderItemId: orderItem.id,
        quantity: input.quantity,
        conditionNotes: input.conditionNotes,
        exchangeVariantId: input.exchangeVariantId,
        refundCents: perUnit * input.quantity,
      });
    }

    const refundAmount = items.reduce((sum, item) => sum + item.refundCents, 0);
    const returnRequest = await this.prisma.$transaction(async (tx) => {
      const created = await tx.returnRequest.create({
        data: {
          returnNumber: generateReturnNumber(),
          orderId: order.id,
          userId: user.id,
          status: "REQUESTED",
          resolution: dto.resolution,
          reason: dto.reason as never,
          customerNote: dto.customerNote,
          refundAmount: new Prisma.Decimal((refundAmount / 100).toFixed(2)),
          items: {
            create: items.map((item) => ({
              orderItemId: item.orderItemId,
              quantity: item.quantity,
              reason: dto.reason as never,
              conditionNotes: item.conditionNotes,
              exchangeVariantId: item.exchangeVariantId,
            })),
          },
        },
      });
      if (order.status === "DELIVERED" || order.status === "COMPLETED") {
        await tx.order.update({ where: { id: order.id }, data: { status: "RETURN_REQUESTED" } });
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: order.status,
            toStatus: "RETURN_REQUESTED",
            actorType: "CUSTOMER",
            actorId: user.id,
            reason: `Return ${created.returnNumber} requested`,
          },
        });
      }
      return created;
    });

    await this.notifications.email({
      userId: user.id,
      to: order.email,
      template: "return-updated",
      data: {
        returnNumber: returnRequest.returnNumber,
        status: "REQUESTED",
        statusLabel: "requested",
        message: "We've received your request and will review it within one business day.",
        url: `${this.appUrl()}/account/returns`,
      },
      dedupeKey: `return-requested:${returnRequest.id}`,
    });
    await this.audit.log({
      actorType: "CUSTOMER",
      actorId: user.id,
      actorEmail: user.email,
      action: "return.requested",
      entityType: "ReturnRequest",
      entityId: returnRequest.id,
      after: { orderId: order.id, resolution: dto.resolution, items },
    });
    return this.returnDetail(returnRequest.id);
  }

  async returnsForUser(userId: string) {
    const requests = await this.prisma.returnRequest.findMany({
      where: { userId },
      include: { items: true, order: { select: { orderNumber: true, grandTotal: true } } },
      orderBy: { requestedAt: "desc" },
    });
    return requests.map((request) => ({
      id: request.id,
      returnNumber: request.returnNumber,
      orderNumber: request.order.orderNumber,
      status: request.status,
      resolution: request.resolution,
      reason: request.reason,
      refundAmount: request.refundAmount ? Number(request.refundAmount.toString()).toFixed(2) : null,
      itemCount: request.items.reduce((sum, item) => sum + item.quantity, 0),
      requestedAt: request.requestedAt,
      customerNote: request.customerNote,
    }));
  }

  async returnDetail(id: string) {
    const request = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: {
        items: { include: { orderItem: true, exchangeVariant: { include: { product: true } } } },
        order: { select: { id: true, orderNumber: true, email: true, userId: true, status: true } },
      },
    });
    if (!request) throw AppError.notFound("Return not found");
    return {
      id: request.id,
      returnNumber: request.returnNumber,
      status: request.status,
      resolution: request.resolution,
      reason: request.reason,
      customerNote: request.customerNote,
      adminNote: request.adminNote,
      refundAmount: request.refundAmount ? Number(request.refundAmount.toString()).toFixed(2) : null,
      requestedAt: request.requestedAt,
      approvedAt: request.approvedAt,
      receivedAt: request.receivedAt,
      inspectedAt: request.inspectedAt,
      closedAt: request.closedAt,
      order: request.order,
      items: request.items.map((item) => ({
        id: item.id,
        orderItemId: item.orderItemId,
        productName: item.orderItem.productName,
        variantSku: item.orderItem.variantSku,
        size: item.orderItem.size,
        color: item.orderItem.color,
        imageUrl: item.orderItem.imageUrl,
        quantity: item.quantity,
        conditionNotes: item.conditionNotes,
        restockApproved: item.restockApproved,
        exchangeVariant: item.exchangeVariant
          ? {
              id: item.exchangeVariant.id,
              size: item.exchangeVariant.size,
              color: item.exchangeVariant.color,
              sku: item.exchangeVariant.sku,
            }
          : null,
      })),
    };
  }

  async returnForUser(userId: string, id: string) {
    const request = await this.prisma.returnRequest.findFirst({ where: { id, userId } });
    if (!request) throw AppError.notFound("Return not found");
    return this.returnDetail(id);
  }

  async updateReturnStatus(id: string, dto: UpdateReturnDto, actor: StaffActor) {
    const request = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: {
        items: { include: { orderItem: true } },
        order: true,
        refunds: true,
      },
    });
    if (!request) throw AppError.notFound("Return not found");
    if (!RETURN_TRANSITIONS[request.status]?.includes(dto.status)) {
      throw AppError.conflict(`Cannot move this return from ${request.status} to ${dto.status}.`);
    }

    if (dto.status === "APPROVED" && request.resolution === "EXCHANGE") {
      for (const item of request.items) {
        if (!item.exchangeVariantId) continue;
        const available = await this.inventory.availableForVariant(item.exchangeVariantId);
        if (available < item.quantity) {
          throw AppError.conflict("Replacement stock is no longer available for this exchange.");
        }
      }
    }

    let exchangeFulfilled = false;
    await this.prisma.$transaction(async (tx) => {
      await tx.returnRequest.update({
        where: { id: request.id },
        data: {
          status: dto.status as never,
          adminNote: dto.adminNote ?? request.adminNote,
          ...(dto.status === "APPROVED" ? { approvedAt: new Date() } : {}),
          ...(dto.status === "RECEIVED" ? { receivedAt: new Date() } : {}),
          ...(dto.status === "INSPECTED" ? { inspectedAt: new Date() } : {}),
          ...(dto.status === "CLOSED" ? { closedAt: new Date() } : {}),
        },
      });
      if (dto.status === "INSPECTED") {
        for (const item of request.items) {
          await tx.returnItem.update({
            where: { id: item.id },
            data: { restockApproved: true },
          });
          await tx.orderItem.update({
            where: { id: item.orderItemId },
            data: { returnedQuantity: { increment: item.quantity } },
          });
        }
        const totalReturned = await tx.orderItem.aggregate({
          where: { orderId: request.orderId },
          _sum: { returnedQuantity: true, quantity: true },
        });
        const allReturned =
          (totalReturned._sum.returnedQuantity ?? 0) >= (totalReturned._sum.quantity ?? 0);
        await tx.order.update({
          where: { id: request.orderId },
          data: { status: allReturned ? "RETURNED" : "PARTIALLY_RETURNED" },
        });
        await tx.orderStatusHistory.create({
          data: {
            orderId: request.orderId,
            toStatus: allReturned ? "RETURNED" : "PARTIALLY_RETURNED",
            actorType: "STAFF",
            actorId: actor.id,
            reason: `Return ${request.returnNumber} inspected`,
          },
        });
      }
      if (dto.status === "REJECTED" && request.order.status === "RETURN_REQUESTED") {
        await tx.order.update({ where: { id: request.orderId }, data: { status: "COMPLETED" } });
        await tx.orderStatusHistory.create({
          data: {
            orderId: request.orderId,
            fromStatus: "RETURN_REQUESTED",
            toStatus: "COMPLETED",
            actorType: "STAFF",
            actorId: actor.id,
            reason: "Return rejected",
          },
        });
      }
    });

    if (dto.status === "INSPECTED") {
      await this.inventory.restockReturn(
        request.id,
        request.items.map((item) => ({
          variantId: item.orderItem.variantId ?? "",
          quantity: item.quantity,
        })).filter((item) => !!item.variantId),
      );
      if (request.resolution === "EXCHANGE") {
        const exchanges = request.items
          .filter((item) => item.exchangeVariantId)
          .map((item) => ({ variantId: item.exchangeVariantId!, quantity: item.quantity }));
        if (exchanges.length) {
          await this.inventory.fulfilExchange(request.id, exchanges);
          exchangeFulfilled = true;
        }
      }
    }

    if (request.order.userId) {
      await this.notifications.email({
        userId: request.order.userId,
        to: request.order.email,
        template: "return-updated",
        data: {
          returnNumber: request.returnNumber,
          status: dto.status,
          statusLabel: dto.status.toLowerCase().replace(/_/g, " "),
          message: dto.message,
          url: `${this.appUrl()}/account/returns`,
        },
        dedupeKey: `return-status:${request.id}:${dto.status}`,
      });
    }
    await this.audit.log({
      actorType: "STAFF",
      actorId: actor.id,
      actorEmail: actor.email,
      action: "return.status_changed",
      entityType: "ReturnRequest",
      entityId: request.id,
      before: { status: request.status },
      after: { status: dto.status, exchangeFulfilled },
    });
    return this.returnDetail(request.id);
  }

  async refundReturn(id: string, actor: StaffActor) {
    const request = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: { order: true, items: { include: { orderItem: true } }, refunds: true },
    });
    if (!request) throw AppError.notFound("Return not found");
    if (!["INSPECTED", "REFUND_PENDING"].includes(request.status)) {
      throw AppError.conflict("Inspect the returned items before issuing a refund.");
    }
    if (request.refunds.some((refund) => refund.status === "PROCESSED")) {
      throw AppError.conflict("A refund has already been processed for this return.");
    }
    const amount = request.refundAmount
      ? toCents(request.refundAmount)
      : request.items.reduce(
          (sum, item) => sum + Math.round(toCents(item.orderItem.lineTotal) * (item.quantity / item.orderItem.quantity)),
          0,
        );
    await this.payments.refund({
      orderId: request.orderId,
      amountCents: amount,
      reason: `Return ${request.returnNumber}`,
      returnRequestId: request.id,
      items: request.items.map((item) => ({
        orderItemId: item.orderItemId,
        quantity: item.quantity,
        amountCents: Math.round(amount * (item.quantity / request.items.reduce((s, i) => s + i.quantity, 0))),
      })),
      actorId: actor.id,
      actorEmail: actor.email,
    });
    await this.prisma.returnRequest.update({
      where: { id: request.id },
      data: { status: "REFUNDED" },
    });
    return this.returnDetail(request.id);
  }

  // ── Admin listings ──────────────────────────────────────────────────
  async adminList(query: OrderListQueryDto) {
    const { page, pageSize, skip, take } = getPaging(query, 25);
    const where: Prisma.OrderWhereInput = {
      ...(query.status ? { status: query.status as OrderStatus } : {}),
      ...(query.q
        ? {
            OR: [
              { orderNumber: { contains: query.q, mode: "insensitive" } },
              { email: { contains: query.q, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
    ]);
    return paged(
      orders.map((order) => ({
        ...toOrderSummary(order),
        customerName: order.shippingAddress
          ? `${(order.shippingAddress as { firstName?: string }).firstName ?? ""} ${(order.shippingAddress as { lastName?: string }).lastName ?? ""}`.trim()
          : null,
        paymentMethod: order.payments[0]?.method ?? null,
      })),
      total,
      page,
      pageSize,
    );
  }

  async adminDetail(orderNumberOrId: string) {
    const order = await this.prisma.order.findFirst({
      where: { OR: [{ id: orderNumberOrId }, { orderNumber: orderNumberOrId }] },
      include: orderInclude,
    });
    if (!order) throw AppError.notFound("Order not found");
    return toOrderDetail(order);
  }

  async adminReturns(query: ReturnListQueryDto) {
    const { page, pageSize, skip, take } = getPaging(query, 25);
    const where: Prisma.ReturnRequestWhereInput = {
      ...(query.status ? { status: query.status as never } : {}),
      ...(query.q
        ? {
            OR: [
              { returnNumber: { contains: query.q, mode: "insensitive" } },
              { order: { orderNumber: { contains: query.q, mode: "insensitive" } } },
            ],
          }
        : {}),
    };
    const [total, requests] = await Promise.all([
      this.prisma.returnRequest.count({ where }),
      this.prisma.returnRequest.findMany({
        where,
        include: {
          items: true,
          order: { select: { orderNumber: true, email: true, grandTotal: true } },
          user: { select: { firstName: true, lastName: true } },
        },
        orderBy: { requestedAt: "desc" },
        skip,
        take,
      }),
    ]);
    return paged(
      requests.map((request) => ({
        id: request.id,
        returnNumber: request.returnNumber,
        orderNumber: request.order.orderNumber,
        customerName: request.user ? `${request.user.firstName} ${request.user.lastName}` : "Guest",
        email: request.order.email,
        status: request.status,
        resolution: request.resolution,
        reason: request.reason,
        itemCount: request.items.reduce((sum, item) => sum + item.quantity, 0),
        refundAmount: request.refundAmount ? Number(request.refundAmount.toString()).toFixed(2) : null,
        requestedAt: request.requestedAt,
      })),
      total,
      page,
      pageSize,
    );
  }
}
