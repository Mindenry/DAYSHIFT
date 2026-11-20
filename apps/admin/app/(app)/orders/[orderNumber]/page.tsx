import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Badge } from "@/components/ui";
import { apiGet, money, dateTime } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";
import { OrderOperations } from "@/components/order-operations";

interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  email: string;
  customerNote: string | null;
  internalNotes: string | null;
  subtotal: string;
  discountTotal: string;
  shippingTotal: string;
  taxTotal: string;
  grandTotal: string;
  couponCode: string | null;
  shippingMethod: string | null;
  createdAt: string;
  paidAt: string | null;
  shippingAddress: Record<string, string | null>;
  items: Array<{ id: string; productName: string; productSlug: string; variantSku: string; size: string | null; color: string | null; quantity: number; unitPrice: string; lineTotal: string; imageUrl: string | null; returnedQuantity: number; refundedQuantity: number }>;
  statusHistory: Array<{ id: string; toStatus: string; createdAt: string; reason: string | null; actorType: string }>;
  payments: Array<{ id: string; status: string; method: string; amount: string; providerRef: string; createdAt: string }>;
  refunds: Array<{ id: string; amount: string; reason: string; status: string; createdAt: string }>;
  shipments: Array<{ id: string; carrier: string; service: string; trackingNumber: string | null; status: string; shippedAt: string | null; deliveredAt: string | null; events: Array<{ id: string; status: string; description: string; location: string | null; occurredAt: string }> }>;
  returns: Array<{ id: string; returnNumber: string; status: string; resolution: string }>;
  canReturn: boolean;
  returnWindowEndsAt: string | null;
}

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  await requireStaff();
  const { orderNumber } = await params;
  const cookie = await getCookieHeader();
  const order = await apiGet<AdminOrder>(`/admin/orders/${orderNumber}`, { cookie });
  if (!order) notFound();
  const address = order.shippingAddress;

  return (
    <div>
      <PageHeader
        eyebrow="Order"
        title={order.orderNumber}
        description={`Placed ${dateTime(order.createdAt)} · ${order.email}`}
        back={{ href: "/orders", label: "Orders" }}
        actions={
          <div className="flex items-center gap-2">
            <Badge status={order.status} />
            <Badge status={order.paymentStatus} />
            <Link href={`http://localhost:3000/account/orders/${order.orderNumber}`} target="_blank" className="a-btn a-btn-outline a-btn-sm">Customer view</Link>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <div className="space-y-4">
          <section className="panel overflow-hidden">
            <div className="border-b border-line px-4 py-3"><h2 className="text-xs font-medium uppercase tracking-[0.08em]">Items</h2></div>
            <div className="overflow-x-auto">
              <table>
                <thead><tr><th>Product</th><th>SKU</th><th>Qty</th><th className="text-right">Unit</th><th className="text-right">Line</th><th>Returned</th></tr></thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-8 shrink-0 overflow-hidden border border-line bg-white">
                            {item.imageUrl && (
                               
                              <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                            )}
                          </div>
                          <div>
                            <Link href={`/products`} className="text-xs font-medium">{item.productName}</Link>
                            <p className="text-[10px] text-muted">{item.color} {item.size ? `· ${item.size}` : ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-[10px] text-muted">{item.variantSku}</td>
                      <td>{item.quantity}</td>
                      <td className="text-right">{money(item.unitPrice)}</td>
                      <td className="text-right">{money(item.lineTotal)}</td>
                      <td className="text-[10px] text-muted">{item.returnedQuantity}/{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-line p-4">
              <dl className="ml-auto max-w-xs space-y-1.5 text-xs">
                <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
                {Number(order.discountTotal) > 0 && <div className="flex justify-between text-accent"><dt>Discount {order.couponCode ? `(${order.couponCode})` : ""}</dt><dd>−{money(order.discountTotal)}</dd></div>}
                <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{Number(order.shippingTotal) === 0 ? "Free" : money(order.shippingTotal)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Tax</dt><dd>{money(order.taxTotal)}</dd></div>
                <div className="flex justify-between border-t border-line pt-2 text-sm font-medium"><dt>Total</dt><dd>{money(order.grandTotal)}</dd></div>
              </dl>
            </div>
          </section>

          <section className="panel">
            <div className="border-b border-line px-4 py-3"><h2 className="text-xs font-medium uppercase tracking-[0.08em]">Order journey</h2></div>
            <ol className="px-4 py-3">
              {order.statusHistory.map((entry) => (
                <li key={entry.id} className="flex gap-3 border-b border-line py-2.5 last:border-0">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
                  <div className="flex-1">
                    <p className="text-xs font-medium">{entry.toStatus.replace(/_/g, " ").toLowerCase()}</p>
                    <p className="text-[10px] text-muted">{dateTime(entry.createdAt)} · {entry.actorType.toLowerCase()}{entry.reason ? ` · ${entry.reason}` : ""}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {order.returns.length > 0 && (
            <section className="panel p-4">
              <h2 className="text-xs font-medium uppercase tracking-[0.08em]">Returns</h2>
              <ul className="mt-3 space-y-2">
                {order.returns.map((request) => (
                  <li key={request.id} className="flex items-center justify-between border border-line px-3 py-2 text-xs">
                    <Link href={`/returns/${request.id}`} className="font-medium underline">{request.returnNumber}</Link>
                    <span className="text-muted">{request.resolution.toLowerCase()}</span>
                    <Badge status={request.status} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="space-y-4">
          <section className="panel p-4">
            <h2 className="text-xs font-medium uppercase tracking-[0.08em]">Customer & delivery</h2>
            <p className="mt-3 text-xs">{address.firstName} {address.lastName}</p>
            <p className="mt-1 text-[11px] text-muted">{order.email}</p>
            <address className="mt-3 text-[11px] not-italic leading-relaxed text-muted">
              {address.line1}<br />
              {address.line2 && <>{address.line2}<br /></>}
              {address.city}{address.state ? `, ${address.state}` : ""} {address.postalCode}<br />
              {address.country}
              {address.phone && <><br />{address.phone}</>}
            </address>
            {order.customerNote && <div className="mt-3 border-t border-line pt-3"><p className="label">Customer note</p><p className="text-[11px] text-muted">{order.customerNote}</p></div>}
          </section>

          <section className="panel p-4">
            <h2 className="text-xs font-medium uppercase tracking-[0.08em]">Payments</h2>
            <ul className="mt-3 space-y-2">
              {order.payments.map((payment) => (
                <li key={payment.id} className="border border-line p-2.5 text-[11px]">
                  <div className="flex items-center justify-between"><span>{payment.method.replace(/_/g, " ").toLowerCase()}</span><Badge status={payment.status} /></div>
                  <p className="mt-1 text-muted">{money(payment.amount)} · <span className="font-mono text-[9px]">{payment.providerRef}</span></p>
                  <p className="text-[10px] text-muted">{dateTime(payment.createdAt)}</p>
                </li>
              ))}
            </ul>
            {order.refunds.length > 0 && (
              <div className="mt-3 border-t border-line pt-3">
                <p className="label">Refunds</p>
                {order.refunds.map((refund) => (
                  <p key={refund.id} className="text-[11px] text-muted">{money(refund.amount)} · {refund.status.toLowerCase()} · {refund.reason}</p>
                ))}
              </div>
            )}
          </section>

          {order.shipments.length > 0 && (
            <section className="panel p-4">
              <h2 className="text-xs font-medium uppercase tracking-[0.08em]">Shipments</h2>
              {order.shipments.map((shipment) => (
                <div key={shipment.id} className="mt-3 border border-line p-2.5 text-[11px]">
                  <div className="flex items-center justify-between"><span>{shipment.carrier} · {shipment.service}</span><Badge status={shipment.status} /></div>
                  <p className="mt-1 text-muted">Tracking: {shipment.trackingNumber ?? "—"}</p>
                  <ol className="mt-2 space-y-1.5">
                    {shipment.events.map((event) => (
                      <li key={event.id} className="text-[10px] text-muted">
                        <span className="text-ink">{event.description}</span> · {dateTime(event.occurredAt)}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </section>
          )}

          <OrderOperations
            orderNumber={order.orderNumber}
            status={order.status}
            internalNotes={order.internalNotes}
            shipments={order.shipments.map((shipment) => ({ id: shipment.id, status: shipment.status, carrier: shipment.carrier, trackingNumber: shipment.trackingNumber }))}
          />
        </div>
      </div>
    </div>
  );
}
