import Link from "next/link";
import { money } from "@/lib/api";

const STATUS_LABELS: Record<string, string> = {
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

export interface OrderView {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  placedAt?: string;
  subtotal: string;
  discountTotal: string;
  shippingTotal: string;
  taxTotal: string;
  grandTotal: string;
  currency: string;
  couponCode: string | null;
  shippingAddress: {
    firstName?: string;
    lastName?: string;
    line1?: string;
    line2?: string | null;
    city?: string;
    state?: string | null;
    postalCode?: string;
    country?: string;
    phone?: string | null;
  };
  items: Array<{
    id: string;
    productName: string;
    productSlug: string;
    variantSku: string;
    size: string | null;
    color: string | null;
    imageUrl: string | null;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
  }>;
  statusHistory: Array<{ id: string; toStatus: string; createdAt: string; reason: string | null }>;
  shipments: Array<{
    id: string;
    carrier: string;
    trackingNumber: string | null;
    status: string;
    estimatedDelivery: string | null;
    events: Array<{ id: string; status: string; description: string; location: string | null; occurredAt: string }>;
  }>;
  payments: Array<{ id: string; status: string; method: string; amount: string }>;
  returns?: Array<{ id: string; returnNumber: string; status: string; resolution: string }>;
  canReturn?: boolean;
  returnWindowEndsAt?: string | null;
}

export function statusLabel(status: string) {
  return STATUS_LABELS[status] ?? status.replace(/_/g, " ").toLowerCase();
}

export function OrderDetailView({ order }: { order: OrderView }) {
  return (
    <div className="grid gap-10 lg:grid-cols-[1.4fr_0.6fr]">
      <div>
        <ul className="divide-y divide-line border-y border-line">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-4 py-5">
              <Link href={`/products/${item.productSlug}`} className="block w-20 shrink-0">
                <div className="aspect-[3/4] overflow-hidden bg-sand">
                  {item.imageUrl && (
                     
                    <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                  )}
                </div>
              </Link>
              <div className="flex flex-1 items-start justify-between gap-4">
                <div>
                  <Link href={`/products/${item.productSlug}`} className="font-display text-lg hover:underline">{item.productName}</Link>
                  <p className="mt-1 text-xs text-muted">{item.color} {item.size && `· ${item.size}`} · Qty {item.quantity}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.08em] text-muted/70">{item.variantSku}</p>
                </div>
                <p className="text-sm">{money(item.lineTotal)}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <div>
            <p className="overline text-muted">Delivering to</p>
            <address className="mt-3 text-sm not-italic leading-relaxed">
              {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
              {order.shippingAddress.line1}<br />
              {order.shippingAddress.line2 && <>{order.shippingAddress.line2}<br /></>}
              {order.shippingAddress.city}{order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""} {order.shippingAddress.postalCode}<br />
              {order.shippingAddress.country}
              {order.shippingAddress.phone && <><br />{order.shippingAddress.phone}</>}
            </address>
          </div>
          <div>
            <p className="overline text-muted">Payment</p>
            <p className="mt-3 text-sm">{order.payments[0]?.method === "CASH_ON_DELIVERY" ? "Cash on delivery" : "Card (sandbox)"}</p>
            <p className="mt-1 text-xs text-muted">Status: {statusLabel(order.payments[0]?.status ?? order.paymentStatus)}</p>
            <p className="mt-4 overline text-muted">Need help?</p>
            <p className="mt-2 text-sm"><Link href="/support" className="underline">Contact customer care</Link></p>
          </div>
        </div>

        {order.shipments.length > 0 && (
          <div className="mt-10 border-t border-line pt-6">
            <p className="overline text-muted">Tracking</p>
            {order.shipments.map((shipment) => (
              <div key={shipment.id} className="mt-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <p>{shipment.carrier} · {shipment.trackingNumber ?? "Tracking pending"}</p>
                  <p className="text-xs uppercase tracking-[0.1em] text-muted">{statusLabel(shipment.status)}</p>
                </div>
                <ol className="mt-4 space-y-3 border-l border-line pl-4">
                  {shipment.events.map((event) => (
                    <li key={event.id} className="relative text-sm">
                      <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-ink" aria-hidden />
                      <p>{event.description}{event.location ? ` · ${event.location}` : ""}</p>
                      <p className="text-xs text-muted">{new Date(event.occurredAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}
      </div>

      <aside>
        <div className="border border-line p-6">
          <p className="overline">Summary</p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
            {Number(order.discountTotal) > 0 && (
              <div className="flex justify-between text-sale"><dt>Discount {order.couponCode ? `(${order.couponCode})` : ""}</dt><dd>−{money(order.discountTotal)}</dd></div>
            )}
            <div className="flex justify-between"><dt>Delivery</dt><dd>{Number(order.shippingTotal) === 0 ? "Free" : money(order.shippingTotal)}</dd></div>
            <div className="flex justify-between"><dt>Tax</dt><dd>{money(order.taxTotal)}</dd></div>
            <div className="flex justify-between border-t border-line pt-3 text-base"><dt>Total</dt><dd>{money(order.grandTotal)}</dd></div>
          </dl>
          <div className="mt-5 border-t border-line pt-4">
            <p className="overline text-muted">Status</p>
            <p className="mt-2 text-sm">{statusLabel(order.status)}</p>
            {order.canReturn && (
              <p className="mt-3 text-xs text-muted">Eligible for return until {order.returnWindowEndsAt ? new Date(order.returnWindowEndsAt).toLocaleDateString() : "—"}</p>
            )}
          </div>
        </div>

        {order.statusHistory.length > 0 && (
          <div className="mt-4 border border-line p-6">
            <p className="overline text-muted">Order journey</p>
            <ol className="mt-4 space-y-3">
              {order.statusHistory.slice(-6).map((entry) => (
                <li key={entry.id} className="text-xs">
                  <p className="uppercase tracking-[0.08em]">{statusLabel(entry.toStatus)}</p>
                  <p className="text-muted">{new Date(entry.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </aside>
    </div>
  );
}
