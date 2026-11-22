export const ORDER_STATUS_LABELS: Record<string, string> = {
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

export function statusLabel(status: string) {
  return ORDER_STATUS_LABELS[status] ?? status.replace(/_/g, " ").toLowerCase();
}
