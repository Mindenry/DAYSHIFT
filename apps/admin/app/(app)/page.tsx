import { PageHeader, Stat, Badge, EmptyState } from "@/components/ui";
import { apiGet, money, dateTime, date } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  Boxes,
  Package,
  ReceiptText,
  RotateCcw,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { getI18n } from "@/lib/i18n";
import { enumLabel } from "@/lib/messages";

interface Metrics {
  range: { from: string; to: string };
  grossSales: string;
  netSales: string;
  refunds: string;
  orders: number;
  paidOrders: number;
  averageOrderValue: string;
  unitsSold: number;
  newCustomers: number;
  lowStockVariants: number;
  pendingOrders: number;
  pendingReturns: number;
  salesSeries: Array<{ day: string; total: string; orders: number }>;
  topProducts: Array<{ productId: string | null; name: string; units: number; revenue: string }>;
  topCategories: Array<{ name: string; units: number; revenue: string }>;
  recentOrders: Array<{ id: string; orderNumber: string; email: string; status: string; paymentStatus: string; grandTotal: string; createdAt: string }>;
}

interface LowStockRow {
  variantId: string;
  sku: string;
  productName: string;
  size: string | null;
  color: string | null;
  available: number;
  reorderPoint: number;
  warehouse: string;
}

function SalesChart({ series, locale }: { series: Metrics["salesSeries"]; locale: "en" | "th" }) {
  if (!series.length) {
    return <div className="flex h-64 items-center justify-center text-xs text-muted">{locale === "th" ? "ไม่มีคำสั่งซื้อที่ชำระแล้วในช่วงนี้" : "No paid orders in this period."}</div>;
  }
  const width = 760;
  const height = 230;
  const padding = { top: 16, right: 12, bottom: 28, left: 52 };
  const values = series.map((point) => Number(point.total));
  const max = Math.max(...values, 1);
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const step = series.length > 1 ? innerW / (series.length - 1) : innerW;
  const points = series.map((point, index) => {
    const x = padding.left + index * step;
    const y = padding.top + innerH - (Number(point.total) / max) * innerH;
    return { x, y, ...point };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${padding.left},${padding.top + innerH} ${line} ${padding.left + innerW},${padding.top + innerH}`;
  const ticks = [0, 0.5, 1].map((ratio) => ({
    y: padding.top + innerH - ratio * innerH,
    label: money(max * ratio),
  }));
  const dayFormat = new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", { month: "short", day: "numeric" });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full" role="img" aria-label={locale === "th" ? "ยอดขายที่ชำระแล้วรายวัน" : "Daily paid sales"}>
      <defs>
        <linearGradient id="sales-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#2f6b4f" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#2f6b4f" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((tick) => (
        <g key={tick.y}>
          <line x1={padding.left} x2={width - padding.right} y1={tick.y} y2={tick.y} stroke="#e2ddd3" strokeDasharray="2 5" />
          <text x={padding.left - 10} y={tick.y + 3} textAnchor="end" fontSize="9" fill="#686d66">{tick.label}</text>
        </g>
      ))}
      <polygon points={area} fill="url(#sales-fill)" />
      <polyline points={line} fill="none" stroke="#2f6b4f" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((point, index) => (
        <g key={point.day}>
          <circle cx={point.x} cy={point.y} r="2.6" fill="#fffdfa" stroke="#2f6b4f" strokeWidth="1.6" />
          {(index === 0 || index === points.length - 1 || index % Math.ceil(points.length / 6) === 0) && (
            <text x={point.x} y={height - 8} textAnchor="middle" fontSize="9" fill="#686d66">
              {dayFormat.format(new Date(point.day))}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaff();
  const params = await searchParams;
  const from = typeof params.from === "string" ? params.from : "";
  const to = typeof params.to === "string" ? params.to : "";
  const cookie = await getCookieHeader();
  const { locale, t } = await getI18n();
  const query = new URLSearchParams();
  if (from) query.set("from", from);
  if (to) query.set("to", to);

  const [metrics, lowStock, returns] = await Promise.all([
    apiGet<Metrics>(`/admin/dashboard${query.toString() ? `?${query.toString()}` : ""}`, { cookie }),
    apiGet<LowStockRow[]>("/admin/inventory/low-stock", { cookie }),
    apiGet<{ items: Array<{ id: string; returnNumber: string; orderNumber: string; status: string; resolution: string; requestedAt: string }>; meta: { total: number } }>(
      "/admin/returns?status=REQUESTED&pageSize=5",
      { cookie },
    ),
  ]);

  if (!metrics) {
    return <PageHeader title="Dashboard" description="Metrics are unavailable. Check the API and database." />;
  }

  const actions = metrics.pendingOrders + metrics.pendingReturns;
  const maxUnits = Math.max(...metrics.topProducts.map((product) => product.units), 1);

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description={t("Commercial performance from {from} to {to}. All figures come from live orders and refunds.", {
          from: date(metrics.range.from),
          to: date(metrics.range.to),
        })}
        actions={
          <form method="get" className="flex flex-wrap items-end gap-2">
            <div>
              <label htmlFor="from" className="label">{t("From")}</label>
              <input id="from" name="from" type="date" defaultValue={from || metrics.range.from.slice(0, 10)} className="field !min-h-9 !py-1.5 text-xs" />
            </div>
            <div>
              <label htmlFor="to" className="label">{t("To")}</label>
              <input id="to" name="to" type="date" defaultValue={to || metrics.range.to.slice(0, 10)} className="field !min-h-9 !py-1.5 text-xs" />
            </div>
            <button type="submit" className="a-btn a-btn-outline a-btn-sm">{t("Apply")}</button>
          </form>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Gross sales" value={money(metrics.grossSales)} hint={`${metrics.paidOrders} ${t("paid orders")}`} icon="wallet" />
        <Stat label="Net sales" value={money(metrics.netSales)} hint={`${money(metrics.refunds)} ${t("refunded")}`} icon="trending" />
        <Stat label="Average order" value={money(metrics.averageOrderValue)} hint={`${metrics.orders} ${t("orders placed")}`} icon="receipt" />
        <Stat label="Units sold" value={String(metrics.unitsSold)} hint={`${metrics.newCustomers} ${t("new customers")}`} icon="package" />
        <Stat
          label="Needs action"
          value={String(actions)}
          hint={`${metrics.pendingOrders} ${t("orders")} · ${metrics.pendingReturns} ${t("returns")}`}
          tone={actions > 0 ? "amber" : "green"}
          icon="alert"
        />
      </div>

      {actions > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warn/25 bg-warn-soft/70 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-ink-soft">
            <AlertTriangle className="h-4 w-4 text-warn" />
            <span>
              <strong>{metrics.pendingOrders}</strong> {t("orders")} · <strong>{metrics.pendingReturns}</strong> {t("returns")}
            </span>
          </div>
          <div className="flex gap-2">
            <Link href="/orders?status=PAID" className="a-btn a-btn-outline a-btn-sm">{t("Paid orders")}</Link>
            <Link href="/returns?status=REQUESTED" className="a-btn a-btn-sm">{t("Returns to review")}</Link>
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <section className="panel overflow-hidden">
          <div className="panel-header">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">{t("Sales over time")}</p>
              <p className="mt-0.5 text-sm font-semibold">{t("Paid revenue by day")}</p>
            </div>
            <span className="a-chip">{t("{count} days with sales", { count: metrics.salesSeries.length })}</span>
          </div>
          <div className="p-4">
            <SalesChart series={metrics.salesSeries} locale={locale} />
          </div>
        </section>

        <section className="panel overflow-hidden">
          <div className="panel-header">
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("Low stock")}</h2>
            <Link href="/inventory?lowStock=true" className="inline-flex min-h-6 items-center text-[11px] font-medium text-muted hover:text-ink">{t("View all")}</Link>
          </div>
          {!lowStock?.length ? (
            <EmptyState title="Stock is healthy" body="Nothing is below its reorder point." />
          ) : (
            <ul className="divide-y divide-line">
              {lowStock.slice(0, 6).map((row) => (
                <li key={`${row.variantId}-${row.warehouse}`} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">{row.productName}</p>
                    <p className="mt-0.5 truncate text-[10px] text-muted">{row.sku} · {row.warehouse}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-xs font-semibold ${row.available <= 0 ? "text-danger" : "text-warn"}`}>
                      {row.available} {t("left")}
                    </p>
                    <p className="text-[10px] text-muted">{t("Reorder at")} {row.reorderPoint}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <section className="panel overflow-hidden">
          <div className="panel-header">
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("Recent orders")}</h2>
            <Link href="/orders" className="inline-flex min-h-6 items-center gap-1 text-[11px] font-medium text-muted hover:text-ink">
              {t("All orders")} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>{t("Order")}</th><th>{t("Customer")}</th><th>{t("Status")}</th><th>{t("Payment")}</th><th className="text-right">{t("Total")}</th></tr>
              </thead>
              <tbody>
                {metrics.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="whitespace-nowrap"><Link href={`/orders/${order.orderNumber}`} className="font-medium hover:underline">{order.orderNumber}</Link></td>
                    <td className="max-w-[220px]">
                      <p className="truncate text-muted">{order.email}</p>
                      <p className="text-[10px] text-muted">{dateTime(order.createdAt)}</p>
                    </td>
                    <td><Badge status={order.status} /></td>
                    <td><Badge status={order.paymentStatus} /></td>
                    <td className="whitespace-nowrap text-right font-medium">{money(order.grandTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-4">
          <section className="panel overflow-hidden">
            <div className="panel-header">
              <h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("Returns to review")}</h2>
              <Link href="/returns?status=REQUESTED" className="inline-flex min-h-6 items-center text-[11px] font-medium text-muted hover:text-ink">{t("View all")}</Link>
            </div>
            {!returns?.items.length ? (
              <EmptyState title="No returns waiting" />
            ) : (
              <ul className="divide-y divide-line">
                {returns.items.map((request) => (
                  <li key={request.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <Link href={`/returns/${request.id}`} className="text-xs font-semibold hover:underline">{request.returnNumber}</Link>
                      <p className="mt-0.5 text-[10px] text-muted">{request.orderNumber} · {enumLabel(locale, request.resolution)}</p>
                    </div>
                    <Badge status={request.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel overflow-hidden">
            <div className="panel-header">
              <h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("Top products")}</h2>
            </div>
            {!metrics.topProducts.length ? (
              <EmptyState title="No sales yet" />
            ) : (
              <ul className="divide-y divide-line">
                {metrics.topProducts.slice(0, 5).map((product) => (
                  <li key={product.productId ?? product.name} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-xs font-medium">{product.name}</p>
                      <p className="shrink-0 text-[11px] font-semibold">{product.units} {t("units")}</p>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-2">
                        <div className="h-full rounded-full bg-accent/70" style={{ width: `${Math.round((product.units / maxUnits) * 100)}%` }} />
                      </div>
                      <span className="text-[10px] text-muted">{money(product.revenue)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Link href="/orders?status=PAID" className="panel group flex items-center justify-between p-4 transition-colors hover:border-line-strong">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-info-soft text-info"><ShoppingCart className="h-4 w-4" /></span>
            <div><p className="text-xs font-semibold">{t("Paid orders")}</p><p className="mt-0.5 text-[10px] text-muted">{t("Ready to process")}</p></div>
          </div>
          <span className="text-xl font-semibold">{metrics.pendingOrders}</span>
        </Link>
        <Link href="/inventory?lowStock=true" className="panel group flex items-center justify-between p-4 transition-colors hover:border-line-strong">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-warn-soft text-warn"><Boxes className="h-4 w-4" /></span>
            <div><p className="text-xs font-semibold">{t("Low stock lines")}</p><p className="mt-0.5 text-[10px] text-muted">{t("At or below reorder point")}</p></div>
          </div>
          <span className={`text-xl font-semibold ${metrics.lowStockVariants ? "text-warn" : ""}`}>{metrics.lowStockVariants}</span>
        </Link>
        <Link href="/returns" className="panel group flex items-center justify-between p-4 transition-colors hover:border-line-strong">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger-soft text-danger"><RotateCcw className="h-4 w-4" /></span>
            <div><p className="text-xs font-semibold">{t("Open returns")}</p><p className="mt-0.5 text-[10px] text-muted">{t("Across all stages")}</p></div>
          </div>
          <span className="text-xl font-semibold">{metrics.pendingReturns}</span>
        </Link>
        <Link href="/customers" className="panel group flex items-center justify-between p-4 transition-colors hover:border-line-strong">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent"><BadgeDollarSign className="h-4 w-4" /></span>
            <div><p className="text-xs font-semibold">{t("New customers")}</p><p className="mt-0.5 text-[10px] text-muted">{t("In selected period")}</p></div>
          </div>
          <span className="text-xl font-semibold">{metrics.newCustomers}</span>
        </Link>
      </div>
    </div>
  );
}
