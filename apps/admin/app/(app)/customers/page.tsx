import Link from "next/link";
import { PageHeader, Badge, Pagination, EmptyState } from "@/components/ui";
import { apiGet, money, date } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";
import { getI18n } from "@/lib/i18n";

interface CustomersResponse {
  items: Array<{
    id: string; email: string; name: string; status: string; segment: string | null; tags: string[];
    orderCount: number; totalSpent: string; loyalty: { pointsBalance: number; tier: string } | null;
    createdAt: string; lastLoginAt: string | null;
  }>;
  meta: { page: number; total: number; totalPages: number };
}

export default async function CustomersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireStaff();
  const { t } = await getI18n();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const segment = typeof params.segment === "string" ? params.segment : "";
  const page = typeof params.page === "string" ? params.page : "1";
  const cookie = await getCookieHeader();
  const query = new URLSearchParams({ page, pageSize: "25" });
  if (q) query.set("q", q);
  if (segment) query.set("segment", segment);
  const customers = await apiGet<CustomersResponse>(`/admin/customers?${query.toString()}`, { cookie });

  return (
    <div>
      <PageHeader eyebrow="Customers" title="Customers" description={t("{count} customer accounts. Spend is calculated from paid orders only.", { count: customers?.meta.total ?? 0 })} />
      <div className="panel">
        <form method="get" className="flex flex-wrap items-end gap-2 border-b border-line p-3">
          <div className="min-w-56 flex-1">
            <label htmlFor="q" className="label">{t("Search")}</label>
            <input id="q" name="q" defaultValue={q} placeholder={t("Name or email")} className="field" />
          </div>
          <div>
            <label htmlFor="segment" className="label">{t("Segment")}</label>
            <select id="segment" name="segment" defaultValue={segment} className="field">
              <option value="">{t("All segments")}</option>
              {["New", "Returning", "High-value"].map((value) => <option key={value} value={value}>{t(value)}</option>)}
            </select>
          </div>
          <button type="submit" className="a-btn a-btn-outline">{t("Filter")}</button>
        </form>
        {!customers?.items.length ? (
          <EmptyState title="No customers found" />
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead><tr><th>{t("Customer")}</th><th>{t("Segment")}</th><th>{t("Orders")}</th><th className="text-right">{t("Spent")}</th><th>{t("Loyalty")}</th><th>{t("Status")}</th><th>{t("Joined")}</th><th>{t("Last seen")}</th></tr></thead>
                <tbody>
                  {customers.items.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <Link href={`/customers/${customer.id}`} className="font-medium hover:underline">{customer.name}</Link>
                        <p className="text-[10px] text-muted">{customer.email}</p>
                      </td>
                      <td className="text-[11px]">{customer.segment ?? "—"}</td>
                      <td>{customer.orderCount}</td>
                      <td className="text-right">{money(customer.totalSpent)}</td>
                      <td className="text-[11px]">{customer.loyalty ? `${customer.loyalty.tier} · ${customer.loyalty.pointsBalance} pts` : "—"}</td>
                      <td><Badge status={customer.status} /></td>
                      <td className="text-[11px] text-muted">{date(customer.createdAt)}</td>
                      <td className="text-[11px] text-muted">{date(customer.lastLoginAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={customers.meta.page} totalPages={customers.meta.totalPages} basePath="/customers" params={{ q, segment }} />
          </>
        )}
      </div>
    </div>
  );
}
