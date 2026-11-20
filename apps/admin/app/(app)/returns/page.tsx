import Link from "next/link";
import { PageHeader, Badge, Pagination, EmptyState } from "@/components/ui";
import { apiGet, money, date } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";

interface ReturnsResponse {
  items: Array<{
    id: string; returnNumber: string; orderNumber: string; customerName: string; email: string;
    status: string; resolution: string; reason: string; itemCount: number; refundAmount: string | null; requestedAt: string;
  }>;
  meta: { page: number; total: number; totalPages: number };
}

const TABS = [
  { label: "All", value: "" },
  { label: "Requested", value: "REQUESTED" },
  { label: "Approved", value: "APPROVED" },
  { label: "Received", value: "RECEIVED" },
  { label: "Inspected", value: "INSPECTED" },
  { label: "Refunded", value: "REFUNDED" },
  { label: "Rejected", value: "REJECTED" },
];

export default async function ReturnsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireStaff();
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "";
  const page = typeof params.page === "string" ? params.page : "1";
  const cookie = await getCookieHeader();
  const query = new URLSearchParams({ page, pageSize: "25" });
  if (status) query.set("status", status);
  const returns = await apiGet<ReturnsResponse>(`/admin/returns?${query.toString()}`, { cookie });

  return (
    <div>
      <PageHeader eyebrow="Sales" title="Returns & refunds" description="Review, receive and inspect returns. Stock is only returned to sellable inventory after inspection." />
      <div className="panel">
        <nav className="flex gap-1 overflow-x-auto border-b border-line px-3">
          {TABS.map((tab) => (
            <Link key={tab.label} href={`/returns${tab.value ? `?status=${tab.value}` : ""}`}
              className={`shrink-0 border-b-2 px-3 py-3 text-[11px] ${status === tab.value ? "border-ink font-medium text-ink" : "border-transparent text-muted hover:text-ink"}`}>
              {tab.label}
            </Link>
          ))}
        </nav>
        {!returns?.items.length ? (
          <EmptyState title="No returns found" body="Nothing matches this stage." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table>
                <thead><tr><th>Return</th><th>Order</th><th>Customer</th><th>Resolution</th><th>Reason</th><th className="text-right">Qty</th><th className="text-right">Refund</th><th>Status</th><th>Requested</th></tr></thead>
                <tbody>
                  {returns.items.map((request) => (
                    <tr key={request.id}>
                      <td><Link href={`/returns/${request.id}`} className="font-medium hover:underline">{request.returnNumber}</Link></td>
                      <td><Link href={`/orders/${request.orderNumber}`} className="text-[11px] underline">{request.orderNumber}</Link></td>
                      <td><p className="text-xs">{request.customerName}</p><p className="text-[10px] text-muted">{request.email}</p></td>
                      <td className="text-[11px] capitalize">{request.resolution.toLowerCase()}</td>
                      <td className="text-[11px] text-muted">{request.reason.replace(/_/g, " ").toLowerCase()}</td>
                      <td className="text-right">{request.itemCount}</td>
                      <td className="text-right">{request.refundAmount ? money(request.refundAmount) : "—"}</td>
                      <td><Badge status={request.status} /></td>
                      <td className="text-[11px] text-muted">{date(request.requestedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={returns.meta.page} totalPages={returns.meta.totalPages} basePath="/returns" params={{ status }} />
          </>
        )}
      </div>
    </div>
  );
}
