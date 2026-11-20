import Link from "next/link";
import { PageHeader, Badge, Pagination, EmptyState } from "@/components/ui";
import { apiGet, money, date } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";
import { getI18n } from "@/lib/i18n";
import { enumLabel } from "@/lib/messages";

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
  const { t, locale } = await getI18n();
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "";
  const page = typeof params.page === "string" ? params.page : "1";
  const cookie = await getCookieHeader();
  const query = new URLSearchParams({ page, pageSize: "25" });
  if (status) query.set("status", status);
  const returns = await apiGet<ReturnsResponse>(`/admin/returns?${query.toString()}`, { cookie });

  return (
    <div>
      <PageHeader eyebrow="Sales" title="Returns & refunds" description="Process returns, inspections, refunds and exchanges." />
      <div className="panel">
        <nav className="flex gap-1 overflow-x-auto border-b border-line px-3">
          {TABS.map((tab) => (
            <Link key={tab.label} href={`/returns${tab.value ? `?status=${tab.value}` : ""}`}
              className={`shrink-0 border-b-2 px-3 py-3 text-[11px] ${status === tab.value ? "border-ink font-medium text-ink" : "border-transparent text-muted hover:text-ink"}`}>
              {tab.value ? enumLabel(locale, tab.value) : t("All")}
            </Link>
          ))}
        </nav>
        {!returns?.items.length ? (
          <EmptyState title="No returns found" body="Nothing matches this stage." />
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead><tr><th>{t("Return")}</th><th>{t("Order")}</th><th>{t("Customer")}</th><th>{t("Resolution")}</th><th>{t("Reason")}</th><th className="text-right">{t("Qty")}</th><th className="text-right">{t("Refund")}</th><th>{t("Status")}</th><th>{t("Requested")}</th></tr></thead>
                <tbody>
                  {returns.items.map((request) => (
                    <tr key={request.id}>
                      <td><Link href={`/returns/${request.id}`} className="font-medium hover:underline">{request.returnNumber}</Link></td>
                      <td><Link href={`/orders/${request.orderNumber}`} className="a-link">{request.orderNumber}</Link></td>
                      <td><p className="text-xs">{request.customerName}</p><p className="text-[10px] text-muted">{request.email}</p></td>
                      <td className="text-[11px] capitalize">{enumLabel(locale, request.resolution)}</td>
                      <td className="text-[11px] text-muted">{enumLabel(locale, request.reason)}</td>
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
