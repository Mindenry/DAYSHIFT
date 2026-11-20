import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Badge } from "@/components/ui";
import { apiGet, money, dateTime } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";
import { ReturnActions } from "@/components/return-actions";

interface AdminReturn {
  id: string;
  returnNumber: string;
  status: string;
  resolution: string;
  reason: string;
  customerNote: string | null;
  adminNote: string | null;
  refundAmount: string | null;
  requestedAt: string;
  approvedAt: string | null;
  receivedAt: string | null;
  inspectedAt: string | null;
  closedAt: string | null;
  order: { id: string; orderNumber: string; email: string; status: string };
  items: Array<{
    id: string; productName: string; variantSku: string; size: string | null; color: string | null;
    imageUrl: string | null; quantity: number; conditionNotes: string | null;
    exchangeVariant: { size: string | null; color: string | null } | null;
  }>;
}

export default async function AdminReturnDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const cookie = await getCookieHeader();
  const request = await apiGet<AdminReturn>(`/admin/returns/${id}`, { cookie });
  if (!request) notFound();

  return (
    <div>
      <PageHeader
        eyebrow="Return"
        title={request.returnNumber}
        description={`Order ${request.order.orderNumber} · ${request.order.email} · requested ${dateTime(request.requestedAt)}`}
        back={{ href: "/returns", label: "Returns" }}
        actions={<div className="flex items-center gap-2"><Badge status={request.status} /><Badge status={request.resolution} /></div>}
      />

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <div className="space-y-4">
          <section className="panel overflow-hidden">
            <div className="border-b border-line px-4 py-3"><h2 className="text-xs font-medium uppercase tracking-[0.08em]">Returned items</h2></div>
            <table>
              <thead><tr><th>Product</th><th>SKU</th><th>Qty</th><th>Condition</th><th>Exchange for</th></tr></thead>
              <tbody>
                {request.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-8 shrink-0 overflow-hidden border border-line bg-white">
                          {item.imageUrl && (
                             
                            <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-medium">{item.productName}</p>
                          <p className="text-[10px] text-muted">{item.color} {item.size ? `· ${item.size}` : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-[10px] text-muted">{item.variantSku}</td>
                    <td>{item.quantity}</td>
                    <td className="text-[11px] text-muted">{item.conditionNotes ?? "—"}</td>
                    <td className="text-[11px]">{item.exchangeVariant ? `${item.exchangeVariant.color} ${item.exchangeVariant.size}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="panel p-4">
            <h2 className="text-xs font-medium uppercase tracking-[0.08em]">Customer note</h2>
            <p className="mt-2 text-xs leading-relaxed text-muted">{request.customerNote || "No note provided."}</p>
          </section>

          <section className="panel p-4">
            <h2 className="text-xs font-medium uppercase tracking-[0.08em]">Workflow</h2>
            <dl className="mt-3 grid gap-2 text-[11px] sm:grid-cols-2">
              <div><dt className="text-muted">Requested</dt><dd>{dateTime(request.requestedAt)}</dd></div>
              <div><dt className="text-muted">Approved</dt><dd>{dateTime(request.approvedAt)}</dd></div>
              <div><dt className="text-muted">Received</dt><dd>{dateTime(request.receivedAt)}</dd></div>
              <div><dt className="text-muted">Inspected</dt><dd>{dateTime(request.inspectedAt)}</dd></div>
              <div><dt className="text-muted">Closed</dt><dd>{dateTime(request.closedAt)}</dd></div>
              <div><dt className="text-muted">Resolution</dt><dd className="capitalize">{request.resolution.toLowerCase()}</dd></div>
            </dl>
          </section>
        </div>

        <div className="space-y-4">
          <section className="panel p-4">
            <h2 className="text-xs font-medium uppercase tracking-[0.08em]">Order</h2>
            <Link href={`/orders/${request.order.orderNumber}`} className="mt-3 block text-xs font-medium underline">{request.order.orderNumber}</Link>
            <p className="mt-1 text-[11px] text-muted">Order status: {request.order.status.replace(/_/g, " ").toLowerCase()}</p>
            <p className="mt-3 border-t border-line pt-3 text-sm font-medium">Refund value {request.refundAmount ? money(request.refundAmount) : "—"}</p>
            <p className="mt-1 text-[10px] leading-relaxed text-muted">Calculated from the paid line value including allocated tax and discount. Shipping is not refunded unless the item was faulty.</p>
          </section>
          <ReturnActions
            id={request.id}
            status={request.status}
            adminNote={request.adminNote}
            refundAmount={request.refundAmount ? money(request.refundAmount) : null}
            hasRefund={request.status === "REFUNDED"}
          />
        </div>
      </div>
    </div>
  );
}
