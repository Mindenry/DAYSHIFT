import { PageHeader, Stat } from "@/components/ui";
import { apiGet, money, date } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";

interface Metrics {
  range: { from: string; to: string };
  grossSales: string; netSales: string; refunds: string; orders: number; paidOrders: number;
  averageOrderValue: string; unitsSold: number; newCustomers: number;
  topProducts: Array<{ productId: string | null; name: string; units: number; revenue: string }>;
  topCategories: Array<{ name: string; units: number; revenue: string }>;
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireStaff();
  const params = await searchParams;
  const from = typeof params.from === "string" ? params.from : "";
  const to = typeof params.to === "string" ? params.to : "";
  const cookie = await getCookieHeader();
  const query = new URLSearchParams();
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  const metrics = await apiGet<Metrics>(`/admin/reports/sales${query.toString() ? `?${query.toString()}` : ""}`, { cookie });
  if (!metrics) return <PageHeader title="Reports" description="Report data unavailable." />;

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title="Reports"
        description={`Commercial reporting for ${date(metrics.range.from)} to ${date(metrics.range.to)}. Export includes daily paid sales.`}
        actions={
          <div className="flex flex-wrap items-end gap-2">
            <form method="get" className="flex items-end gap-2">
              <div><label htmlFor="from" className="label">From</label><input id="from" name="from" type="date" defaultValue={from || metrics.range.from.slice(0, 10)} className="field !min-h-0 !py-1.5 text-xs" /></div>
              <div><label htmlFor="to" className="label">To</label><input id="to" name="to" type="date" defaultValue={to || metrics.range.to.slice(0, 10)} className="field !min-h-0 !py-1.5 text-xs" /></div>
              <button type="submit" className="a-btn a-btn-outline a-btn-sm">Apply</button>
            </form>
            <a href={`/api/v1/admin/reports/sales.csv${query.toString() ? `?${query.toString()}` : ""}`} className="a-btn a-btn-sm" download>Export CSV</a>
          </div>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Gross sales" value={money(metrics.grossSales)} hint={`${metrics.paidOrders} paid orders`} />
        <Stat label="Net sales" value={money(metrics.netSales)} hint={`after ${money(metrics.refunds)} refunds`} />
        <Stat label="Average order" value={money(metrics.averageOrderValue)} hint={`${metrics.orders} orders placed`} />
        <Stat label="Units sold" value={String(metrics.unitsSold)} hint={`${metrics.newCustomers} new customers`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="panel overflow-hidden">
          <div className="border-b border-line px-4 py-3"><h2 className="text-xs font-medium uppercase tracking-[0.08em]">Top products</h2></div>
          <table>
            <thead><tr><th>Product</th><th className="text-right">Units</th><th className="text-right">Revenue</th></tr></thead>
            <tbody>
              {metrics.topProducts.map((product) => (
                <tr key={product.productId ?? product.name}>
                  <td className="text-xs">{product.name}</td>
                  <td className="text-right">{product.units}</td>
                  <td className="text-right">{money(product.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="panel overflow-hidden">
          <div className="border-b border-line px-4 py-3"><h2 className="text-xs font-medium uppercase tracking-[0.08em]">Top categories</h2></div>
          <table>
            <thead><tr><th>Category</th><th className="text-right">Units</th><th className="text-right">Revenue</th></tr></thead>
            <tbody>
              {metrics.topCategories.map((category) => (
                <tr key={category.name}>
                  <td className="text-xs">{category.name}</td>
                  <td className="text-right">{category.units}</td>
                  <td className="text-right">{money(category.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-muted">
        Reports use paid and partially refunded orders. Visitor conversion is not reported because no
        analytics provider is connected; fabricating traffic metrics would be misleading.
      </p>
    </div>
  );
}
