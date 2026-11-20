import { Prisma } from "@dayshift/db";
import { COMMERCE } from "@dayshift/config";

export const orderInclude = {
  items: { orderBy: { id: "asc" as const } },
  payments: { orderBy: { createdAt: "desc" as const } },
  refunds: { orderBy: { createdAt: "desc" as const } },
  statusHistory: { orderBy: { createdAt: "asc" as const } },
  shipments: {
    orderBy: { createdAt: "desc" as const },
    include: { events: { orderBy: { occurredAt: "asc" as const } } },
  },
  returnRequests: {
    orderBy: { requestedAt: "desc" as const },
    include: { items: true },
  },
} satisfies Prisma.OrderInclude;

export type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

const money = (value: Prisma.Decimal | null | undefined) =>
  value === null || value === undefined ? "0.00" : Number(value.toString()).toFixed(2);

export function deliveredAt(order: OrderWithRelations): Date | null {
  const delivered = order.shipments.find((shipment) => shipment.status === "DELIVERED");
  return delivered?.deliveredAt ?? delivered?.updatedAt ?? order.completedAt ?? null;
}

export function returnEligibility(order: OrderWithRelations) {
  const eligibleStatuses = ["DELIVERED", "COMPLETED", "PARTIALLY_RETURNED"];
  const at = deliveredAt(order);
  const windowEnds = at
    ? new Date(at.getTime() + COMMERCE.returnWindowDays * 86_400_000)
    : null;
  const returnableItems = order.items.filter(
    (item) => item.returnedQuantity + item.refundedQuantity < item.quantity,
  );
  const canReturn =
    eligibleStatuses.includes(order.status) &&
    !!windowEnds &&
    windowEnds > new Date() &&
    returnableItems.length > 0 &&
    !order.returnRequests.some((request) =>
      ["REQUESTED", "UNDER_REVIEW", "APPROVED", "RETURN_SHIPPED", "RECEIVED", "INSPECTED"].includes(
        request.status,
      ),
    );
  return {
    canReturn,
    returnWindowEndsAt: windowEnds,
    returnableItems: returnableItems.map((item) => ({
      id: item.id,
      productName: item.productName,
      size: item.size,
      color: item.color,
      imageUrl: item.imageUrl,
      quantity: item.quantity,
      returnableQuantity: item.quantity - item.returnedQuantity - item.refundedQuantity,
      unitPrice: money(item.unitPrice),
      discountAllocated: money(item.discountAllocated),
    })),
  };
}

export function toOrderSummary(order: OrderWithRelations) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    grandTotal: money(order.grandTotal),
    currency: order.currency,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    createdAt: order.createdAt,
    placedAt: order.placedAt,
    thumbnail: order.items[0]?.imageUrl ?? null,
    email: order.email,
    trackingNumber:
      order.shipments.find((shipment) => shipment.trackingNumber)?.trackingNumber ?? null,
  };
}

export function toOrderDetail(order: OrderWithRelations) {
  const eligibility = returnEligibility(order);
  return {
    ...toOrderSummary(order),
    subtotal: money(order.subtotal),
    discountTotal: money(order.discountTotal),
    shippingTotal: money(order.shippingTotal),
    taxTotal: money(order.taxTotal),
    couponCode: order.couponCode,
    customerNote: order.customerNote,
    shippingAddress: order.shippingAddress,
    billingAddress: order.billingAddress,
    shippingMethod: order.shippingMethod,
    paidAt: order.paidAt,
    cancelledAt: order.cancelledAt,
    items: order.items.map((item) => ({
      id: item.id,
      variantId: item.variantId,
      productId: item.productId,
      productName: item.productName,
      productSlug: item.productSlug,
      variantSku: item.variantSku,
      size: item.size,
      color: item.color,
      imageUrl: item.imageUrl,
      quantity: item.quantity,
      unitPrice: money(item.unitPrice),
      lineTotal: money(item.lineTotal),
      discountAllocated: money(item.discountAllocated),
      refundedQuantity: item.refundedQuantity,
      returnedQuantity: item.returnedQuantity,
    })),
    statusHistory: order.statusHistory.map((entry) => ({
      id: entry.id,
      fromStatus: entry.fromStatus,
      toStatus: entry.toStatus,
      actorType: entry.actorType,
      reason: entry.reason,
      createdAt: entry.createdAt,
    })),
    shipments: order.shipments.map((shipment) => ({
      id: shipment.id,
      carrier: shipment.carrier,
      service: shipment.service,
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
      shippedAt: shipment.shippedAt,
      deliveredAt: shipment.deliveredAt,
      estimatedDelivery: shipment.estimatedDelivery,
      events: shipment.events.map((event) => ({
        id: event.id,
        status: event.status,
        description: event.description,
        location: event.location,
        occurredAt: event.occurredAt,
      })),
    })),
    payments: order.payments.map((payment) => ({
      id: payment.id,
      status: payment.status,
      method: payment.method,
      amount: money(payment.amount),
      provider: payment.provider,
      providerRef: payment.providerRef,
      createdAt: payment.createdAt,
    })),
    refunds: order.refunds.map((refund) => ({
      id: refund.id,
      amount: money(refund.amount),
      reason: refund.reason,
      status: refund.status,
      createdAt: refund.createdAt,
    })),
    returns: order.returnRequests.map((request) => ({
      id: request.id,
      returnNumber: request.returnNumber,
      status: request.status,
      resolution: request.resolution,
      reason: request.reason,
      requestedAt: request.requestedAt,
      items: request.items.map((item) => ({
        id: item.id,
        orderItemId: item.orderItemId,
        quantity: item.quantity,
      })),
    })),
    ...eligibility,
  };
}
