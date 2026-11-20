import Link from "next/link";
import { PageHeader, Badge, Pagination, EmptyState } from "@/components/ui";
import { apiGet, money, date } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";

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
      <PageHeader eyebrow="Customers" title="Customers" description={`${customers?.meta.total ?? 0} customer accounts. Spend is calculated from paid orders only.`} />
      <div className="panel">
        <form method="get" className="flex flex-wrap items-end gap-2 border-b border-line p-3">
          <div className="min-w-56 flex-1">
            <label htmlFor="q" className="label">Search</label>
            <input id="q" name="q" defaultValue={q} placeholder="Name or email" className="field" />
          </div>
          <div>
            <label htmlFor="segment" className="label">Segment</label>
            <select id="segment" name="segment" defaultValue={segment} className="field">
              <option value="">All segments</option>
              {["New", "Returning", "High-value"].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
          <button type="submit" className="a-btn a-btn-outline">Filter</button>
        </form>
        {!customers?.items.length ? (
          <EmptyState title="No customers found" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table>
                <thead><tr><th>Customer</th><th>Segment</th><th>Orders</th><th className="text-right">Spent</th><th>Loyalty</th><th>Status</th><th>Joined</th><th>Last seen</th></tr></thead>
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
