import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { apiGet, money } from "@/lib/api";
import { getCookieHeader } from "@/lib/session";

export const metadata: Metadata = { title: "Return details — DAYSHIFT", robots: { index: false } };

interface ReturnDetail {
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
  order: { orderNumber: string };
  items: Array<{
    id: string;
    productName: string;
    variantSku: string;
    size: string | null;
    color: string | null;
    imageUrl: string | null;
    quantity: number;
    exchangeVariant: { size: string | null; color: string | null } | null;
  }>;
}

const label = (value: string) => value.replace(/_/g, " ").toLowerCase();

export default async function ReturnDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookie = await getCookieHeader();
  const request = await apiGet<ReturnDetail>(`/returns/${id}`, { cookie, revalidate: 0 });
  if (!request) notFound();

  const steps = [
    { key: "REQUESTED", label: "Requested", at: request.requestedAt },
    { key: "APPROVED", label: "Approved", at: request.approvedAt },
    { key: "RECEIVED", label: "Received", at: request.receivedAt },
    { key: "INSPECTED", label: "Inspected", at: request.inspectedAt },
    { key: "CLOSED", label: "Closed", at: request.closedAt },
  ];
  const currentIndex = steps.findIndex((step) => step.key === request.status);

  return (
    <div>
      <Link href="/account/returns" className="overline link-underline text-muted">Back to returns</Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="overline text-muted">Return</p>
          <h1 className="mt-2 font-display text-4xl">{request.returnNumber}</h1>
          <p className="mt-1 text-xs text-muted">Order {request.order.orderNumber}</p>
        </div>
        <span className="border border-line px-3 py-1.5 text-[10px] uppercase tracking-[0.12em]">{label(request.status)}</span>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <ul className="divide-y divide-line border-y border-line">
            {request.items.map((item) => (
              <li key={item.id} className="flex gap-4 py-5">
                <div className="h-24 w-20 shrink-0 overflow-hidden bg-sand">
                  {item.imageUrl && (
                     
                    <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div>
                  <p className="font-display text-lg">{item.productName}</p>
                  <p className="mt-1 text-xs text-muted">{item.color} {item.size && `· ${item.size}`} · Qty {item.quantity}</p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-muted/70">{item.variantSku}</p>
                  {item.exchangeVariant && (
                    <p className="mt-2 text-xs">Exchange for {item.exchangeVariant.color} {item.exchangeVariant.size}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <p className="overline text-muted">Progress</p>
            <ol className="mt-4 space-y-4 border-l border-line pl-5">
              {steps.map((step, index) => {
                const complete = step.at || (currentIndex >= 0 && index <= currentIndex);
                return (
                  <li key={step.key} className="relative text-sm">
                    <span className={`absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full ${complete ? "bg-ink" : "bg-line"}`} aria-hidden />
                    <p className={complete ? "text-ink" : "text-muted"}>{step.label}</p>
                    {step.at && <p className="text-[11px] text-muted">{new Date(step.at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>}
                  </li>
                );
              })}
            </ol>
          </div>

          {request.customerNote && (
            <div className="mt-8 border border-line p-5">
              <p className="overline text-muted">Your note</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{request.customerNote}</p>
            </div>
          )}
        </div>

        <aside>
          <div className="border border-line p-6">
            <p className="overline">Summary</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Resolution</dt><dd className="capitalize">{label(request.resolution)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Reason</dt><dd className="capitalize">{label(request.reason)}</dd></div>
              {request.refundAmount && (
                <div className="flex justify-between border-t border-line pt-3"><dt>Refund</dt><dd>{money(request.refundAmount)}</dd></div>
              )}
            </dl>
            <div className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-muted">
              <p>Returns are free. Keep the original packaging until your return is complete.</p>
              <p className="mt-2">Questions? <Link href="/account/support" className="underline">Contact customer care</Link>.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
