import { PageHeader, Stat } from "@/components/ui";
import { apiGet, money, date } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";
import { getI18n } from "@/lib/i18n";
import { Download } from "lucide-react";

interface Metrics {
  range: { from: string; to: string };
  grossSales: string; netSales: string; refunds: string; orders: number; paidOrders: number;
  averageOrderValue: string; unitsSold: number; newCustomers: number;
  topProducts: Array<{ productId: string | null; name: string; units: number; revenue: string }>;
  topCategories: Array<{ name: string; units: number; revenue: string }>;
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireStaff();
  const { t } = await getI18n();
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
        description={t("Commercial reporting for {from} to {to}. Export includes daily paid sales.", {
          from: date(metrics.range.from),
          to: date(metrics.range.to),
        })}
        actions={
          <div className="flex flex-wrap items-end gap-2">
            <form method="get" className="flex flex-wrap items-end gap-2">
              <div><label htmlFor="from" className="label">{t("From")}</label><input id="from" name="from" type="date" defaultValue={from || metrics.range.from.slice(0, 10)} className="field !min-h-9 !py-1.5 text-xs" /></div>
              <div><label htmlFor="to" className="label">{t("To")}</label><input id="to" name="to" type="date" defaultValue={to || metrics.range.to.slice(0, 10)} className="field !min-h-9 !py-1.5 text-xs" /></div>
              <button type="submit" className="a-btn a-btn-outline">{t("Apply")}</button>
            </form>
            <a href={`/api/v1/admin/reports/sales.csv${query.toString() ? `?${query.toString()}` : ""}`} className="a-btn" download>
              <Download className="h-3.5 w-3.5" /> {t("Export CSV")}
            </a>
          </div>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Gross sales" value={money(metrics.grossSales)} hint={`${metrics.paidOrders} ${t("paid orders")}`} />
        <Stat label="Net sales" value={money(metrics.netSales)} hint={t("after {amount} refunds", { amount: money(metrics.refunds) })} />
        <Stat label="Average order" value={money(metrics.averageOrderValue)} hint={`${metrics.orders} ${t("orders placed")}`} />
        <Stat label="Units sold" value={String(metrics.unitsSold)} hint={`${metrics.newCustomers} ${t("new customers")}`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="panel overflow-hidden">
          <div className="panel-header"><h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("Top products")}</h2></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>{t("Product")}</th><th className="text-right">{t("Units")}</th><th className="text-right">{t("Revenue")}</th></tr></thead>
              <tbody>
                {metrics.topProducts.map((product) => (
                  <tr key={product.productId ?? product.name}>
                    <td className="text-xs">{product.name}</td>
                    <td className="text-right">{product.units}</td>
                    <td className="text-right font-medium">{money(product.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel overflow-hidden">
          <div className="panel-header"><h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("Top categories")}</h2></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>{t("Category")}</th><th className="text-right">{t("Units")}</th><th className="text-right">{t("Revenue")}</th></tr></thead>
              <tbody>
                {metrics.topCategories.map((category) => (
                  <tr key={category.name}>
                    <td className="text-xs">{category.name}</td>
                    <td className="text-right">{category.units}</td>
                    <td className="text-right font-medium">{money(category.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-muted">
        {t("Reports use paid and partially refunded orders. Visitor conversion is not reported because no analytics provider is connected.")}
      </p>
    </div>
  );
}
