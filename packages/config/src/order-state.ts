export const ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "PICKING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "COMPLETED",
  "PAYMENT_FAILED",
  "CANCELLED",
  "ON_HOLD",
  "RETURN_REQUESTED",
  "PARTIALLY_RETURNED",
  "RETURNED",
  "REFUND_PENDING",
  "REFUNDED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/**
 * Controlled order state machine. Any transition not listed here is rejected
 * by the application service. Terminal states have no outgoing transitions.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["PAID", "PAYMENT_FAILED", "CANCELLED", "ON_HOLD"],
  PAID: ["PROCESSING", "ON_HOLD", "CANCELLED"],
  PROCESSING: ["PICKING", "ON_HOLD", "CANCELLED"],
  PICKING: ["PACKED", "ON_HOLD"],
  PACKED: ["SHIPPED", "ON_HOLD"],
  SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: ["COMPLETED", "RETURN_REQUESTED"],
  COMPLETED: ["RETURN_REQUESTED", "PARTIALLY_RETURNED"],
  PAYMENT_FAILED: ["PENDING_PAYMENT", "CANCELLED"],
  CANCELLED: [],
  ON_HOLD: ["PAID", "PROCESSING", "CANCELLED"],
  RETURN_REQUESTED: ["PARTIALLY_RETURNED", "RETURNED", "REFUND_PENDING", "COMPLETED"],
  PARTIALLY_RETURNED: ["REFUND_PENDING", "REFUNDED", "COMPLETED"],
  RETURNED: ["REFUND_PENDING", "REFUNDED"],
  REFUND_PENDING: ["REFUNDED"],
  REFUNDED: [],
};

export const FULFILMENT_STATUSES: OrderStatus[] = [
  "PAID",
  "PROCESSING",
  "PICKING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "COMPLETED",
];

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isTerminalStatus(status: OrderStatus): boolean {
  return ORDER_TRANSITIONS[status].length === 0;
}

/** Statuses in which inventory is held for the customer. */
export const INVENTORY_COMMITTED_STATUSES: OrderStatus[] = [
  "PAID",
  "PROCESSING",
  "PICKING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "COMPLETED",
  "RETURN_REQUESTED",
  "PARTIALLY_RETURNED",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Pending payment",
  PAID: "Paid",
  PROCESSING: "Processing",
  PICKING: "Picking",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  PAYMENT_FAILED: "Payment failed",
  CANCELLED: "Cancelled",
  ON_HOLD: "On hold",
  RETURN_REQUESTED: "Return requested",
  PARTIALLY_RETURNED: "Partially returned",
  RETURNED: "Returned",
  REFUND_PENDING: "Refund pending",
  REFUNDED: "Refunded",
};
