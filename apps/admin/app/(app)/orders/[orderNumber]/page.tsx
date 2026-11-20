import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Badge } from "@/components/ui";
import { apiGet, money, dateTime } from "@/lib/api";
import { STOREFRONT_URL } from "@/lib/site";
import { getCookieHeader, requireStaff } from "@/lib/session";
import { getI18n } from "@/lib/i18n";
import { enumLabel } from "@/lib/messages";
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
  const { t, locale } = await getI18n();
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
        description={t("Placed {when} · {email}", { when: dateTime(order.createdAt), email: order.email })}
        back={{ href: "/orders", label: "Orders" }}
        actions={
          <div className="flex items-center gap-2">
            <Badge status={order.status} />
            <Badge status={order.paymentStatus} />
            <Link href={`${STOREFRONT_URL}/account/orders/${order.orderNumber}`} target="_blank" className="a-btn a-btn-outline a-btn-sm">{t("Customer view")}</Link>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <div className="space-y-4">
          <section className="panel overflow-hidden">
            <div className="panel-header"><h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("Items")}</h2></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>{t("Product")}</th><th>{t("SKU")}</th><th>{t("Qty")}</th><th className="text-right">{t("Unit")}</th><th className="text-right">{t("Line")}</th><th>{t("Returned")}</th></tr></thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-8 shrink-0 overflow-hidden rounded border border-line bg-surface-2">
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
                      <td className="mono">{item.quantity}</td>
                      <td className="text-right">{money(item.unitPrice)}</td>
                      <td className="text-right font-medium">{money(item.lineTotal)}</td>
                      <td className="text-[10px] text-muted">{item.returnedQuantity}/{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-line p-4">
              <dl className="ml-auto max-w-xs space-y-1.5 text-xs">
                <div className="flex justify-between"><dt className="text-muted">{t("Subtotal")}</dt><dd>{money(order.subtotal)}</dd></div>
                {Number(order.discountTotal) > 0 && <div className="flex justify-between text-accent"><dt>{t("Discount")} {order.couponCode ? `(${order.couponCode})` : ""}</dt><dd>−{money(order.discountTotal)}</dd></div>}
                <div className="flex justify-between"><dt className="text-muted">{t("Shipping")}</dt><dd>{Number(order.shippingTotal) === 0 ? t("Free") : money(order.shippingTotal)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">{t("Tax")}</dt><dd>{money(order.taxTotal)}</dd></div>
                <div className="flex justify-between border-t border-line pt-2 text-sm font-semibold"><dt>{t("Total")}</dt><dd>{money(order.grandTotal)}</dd></div>
              </dl>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header"><h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("Order journey")}</h2></div>
            <ol className="px-4 py-3">
              {order.statusHistory.map((entry) => (
                <li key={entry.id} className="flex gap-3 border-b border-line py-2.5 last:border-0">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
                  <div className="flex-1">
                    <p className="text-xs font-medium">{enumLabel(locale, entry.toStatus)}</p>
                    <p className="text-[10px] text-muted">{dateTime(entry.createdAt)} · {enumLabel(locale, entry.actorType)}{entry.reason ? ` · ${entry.reason}` : ""}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {order.returns.length > 0 && (
            <section className="panel p-5">
              <h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("Returns")}</h2>
              <ul className="mt-3 space-y-2">
                {order.returns.map((request) => (
                  <li key={request.id} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2 text-xs">
                    <Link href={`/returns/${request.id}`} className="font-medium underline">{request.returnNumber}</Link>
                    <span className="text-muted">{enumLabel(locale, request.resolution)}</span>
                    <Badge status={request.status} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="space-y-4">
          <section className="panel p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("Customer & delivery")}</h2>
            <p className="mt-3 text-xs">{address.firstName} {address.lastName}</p>
            <p className="mt-1 text-[11px] text-muted">{order.email}</p>
            <address className="mt-3 text-[11px] not-italic leading-relaxed text-muted">
              {address.line1}<br />
              {address.line2 && <>{address.line2}<br /></>}
              {address.city}{address.state ? `, ${address.state}` : ""} {address.postalCode}<br />
              {address.country}
              {address.phone && <><br />{address.phone}</>}
            </address>
            {order.customerNote && <div className="mt-3 border-t border-line pt-3"><p className="label">{t("Customer note")}</p><p className="text-[11px] text-muted">{order.customerNote}</p></div>}
          </section>

          <section className="panel p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("Payments")}</h2>
            <ul className="mt-3 space-y-2">
              {order.payments.map((payment) => (
                <li key={payment.id} className="rounded-lg border border-line p-2.5 text-[11px]">
                  <div className="flex items-center justify-between"><span>{enumLabel(locale, payment.method)}</span><Badge status={payment.status} /></div>
                  <p className="mt-1 text-muted">{money(payment.amount)} · <span className="font-mono text-[9px]">{payment.providerRef}</span></p>
                  <p className="text-[10px] text-muted">{dateTime(payment.createdAt)}</p>
                </li>
              ))}
            </ul>
            {order.refunds.length > 0 && (
              <div className="mt-3 border-t border-line pt-3">
                <p className="label">{t("Refunds")}</p>
                {order.refunds.map((refund) => (
                  <p key={refund.id} className="text-[11px] text-muted">{money(refund.amount)} · {enumLabel(locale, refund.status)} · {refund.reason}</p>
                ))}
              </div>
            )}
          </section>

          {order.shipments.length > 0 && (
            <section className="panel p-5">
              <h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("Shipments")}</h2>
              {order.shipments.map((shipment) => (
                <div key={shipment.id} className="mt-3 rounded-lg border border-line p-2.5 text-[11px]">
                  <div className="flex items-center justify-between"><span>{shipment.carrier} · {shipment.service}</span><Badge status={shipment.status} /></div>
                  <p className="mt-1 text-muted">{t("Tracking")}: {shipment.trackingNumber ?? "—"}</p>
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
