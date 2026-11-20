import { PageHeader, Stat, Badge, EmptyState } from "@/components/ui";
import { apiGet, money, dateTime, date } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";
import Link from "next/link";

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

function SalesChart({ series }: { series: Metrics["salesSeries"] }) {
  if (!series.length) {
    return <div className="flex h-56 items-center justify-center text-xs text-muted">No paid orders in this period.</div>;
  }
  const width = 760;
  const height = 200;
  const padding = { top: 12, right: 8, bottom: 24, left: 44 };
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

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full" role="img" aria-label="Daily paid sales">
      {ticks.map((tick) => (
        <g key={tick.y}>
          <line x1={padding.left} x2={width - padding.right} y1={tick.y} y2={tick.y} stroke="#ddd6c9" strokeDasharray="2 4" />
          <text x={padding.left - 8} y={tick.y + 3} textAnchor="end" fontSize="9" fill="#6f6a61">{tick.label}</text>
        </g>
      ))}
      <polygon points={area} fill="#3f5b4a" opacity="0.08" />
      <polyline points={line} fill="none" stroke="#3f5b4a" strokeWidth="1.6" />
      {points.map((point, index) => (
        <g key={point.day}>
          <circle cx={point.x} cy={point.y} r="2.2" fill="#3f5b4a" />
          {(index === 0 || index === points.length - 1 || index % Math.ceil(points.length / 6) === 0) && (
            <text x={point.x} y={height - 6} textAnchor="middle" fontSize="8.5" fill="#6f6a61">
              {new Date(point.day).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description={`Commercial performance from ${date(metrics.range.from)} to ${date(metrics.range.to)}. All figures come from live orders and refunds.`}
        actions={
          <form method="get" className="flex flex-wrap items-end gap-2">
            <div>
              <label htmlFor="from" className="label">From</label>
              <input id="from" name="from" type="date" defaultValue={from || metrics.range.from.slice(0, 10)} className="field !min-h-0 !py-1.5 text-xs" />
            </div>
            <div>
              <label htmlFor="to" className="label">To</label>
              <input id="to" name="to" type="date" defaultValue={to || metrics.range.to.slice(0, 10)} className="field !min-h-0 !py-1.5 text-xs" />
            </div>
            <button type="submit" className="a-btn a-btn-outline a-btn-sm">Apply</button>
          </form>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Gross sales" value={money(metrics.grossSales)} hint={`${metrics.paidOrders} paid orders`} />
        <Stat label="Net sales" value={money(metrics.netSales)} hint={`${money(metrics.refunds)} refunded`} />
        <Stat label="Average order" value={money(metrics.averageOrderValue)} hint={`${metrics.orders} orders placed`} />
        <Stat label="Units sold" value={String(metrics.unitsSold)} hint={`${metrics.newCustomers} new customers`} />
        <Stat
          label="Needs action"
          value={`${metrics.pendingOrders + metrics.pendingReturns}`}
          hint={`${metrics.pendingOrders} orders · ${metrics.pendingReturns} returns`}
          tone={metrics.pendingOrders + metrics.pendingReturns > 0 ? "amber" : "green"}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <section className="panel p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Sales over time</p>
              <p className="mt-1 text-sm">Paid revenue by day</p>
            </div>
            <span className="text-[11px] text-muted">{metrics.salesSeries.length} days with sales</span>
          </div>
          <div className="mt-4">
            <SalesChart series={metrics.salesSeries} />
          </div>
        </section>

        <section className="panel">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-xs font-medium uppercase tracking-[0.08em]">Low stock</h2>
            <Link href="/inventory?lowStock=true" className="text-[11px] text-muted hover:text-ink">View all</Link>
          </div>
          {!lowStock?.length ? (
            <EmptyState title="Stock is healthy" body="Nothing is below its reorder point." />
          ) : (
            <ul className="divide-y divide-line">
              {lowStock.slice(0, 6).map((row) => (
                <li key={`${row.variantId}-${row.warehouse}`} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{row.productName}</p>
                    <p className="mt-0.5 text-[10px] text-muted">{row.sku} · {row.warehouse}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-medium ${row.available <= 0 ? "text-danger" : "text-warn"}`}>{row.available} left</p>
                    <p className="text-[10px] text-muted">Reorder at {row.reorderPoint}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-xs font-medium uppercase tracking-[0.08em]">Recent orders</h2>
            <Link href="/orders" className="text-[11px] text-muted hover:text-ink">All orders</Link>
          </div>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr><th>Order</th><th>Customer</th><th>Status</th><th>Payment</th><th className="text-right">Total</th><th>Placed</th></tr>
              </thead>
              <tbody>
                {metrics.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td><Link href={`/orders/${order.orderNumber}`} className="font-medium hover:underline">{order.orderNumber}</Link></td>
                    <td className="text-muted">{order.email}</td>
                    <td><Badge status={order.status} /></td>
                    <td><Badge status={order.paymentStatus} /></td>
                    <td className="text-right">{money(order.grandTotal)}</td>
                    <td className="text-[11px] text-muted">{dateTime(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-4">
          <section className="panel">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-xs font-medium uppercase tracking-[0.08em]">Returns to review</h2>
              <Link href="/returns?status=REQUESTED" className="text-[11px] text-muted hover:text-ink">View all</Link>
            </div>
            {!returns?.items.length ? (
              <EmptyState title="No returns waiting" />
            ) : (
              <ul className="divide-y divide-line">
                {returns.items.map((request) => (
                  <li key={request.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <Link href={`/returns/${request.id}`} className="text-xs font-medium hover:underline">{request.returnNumber}</Link>
                      <p className="mt-0.5 text-[10px] text-muted">{request.orderNumber} · {request.resolution.toLowerCase()}</p>
                    </div>
                    <Badge status={request.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-xs font-medium uppercase tracking-[0.08em]">Top products</h2>
            </div>
            {!metrics.topProducts.length ? (
              <EmptyState title="No sales yet" />
            ) : (
              <ul className="divide-y divide-line">
                {metrics.topProducts.slice(0, 5).map((product) => (
                  <li key={product.productId ?? product.name} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <p className="truncate text-xs">{product.name}</p>
                    <div className="shrink-0 text-right">
                      <p className="text-xs">{product.units} units</p>
                      <p className="text-[10px] text-muted">{money(product.revenue)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link href="/orders?status=PAID" className="panel flex items-center justify-between p-4 hover:border-ink">
          <div><p className="text-xs font-medium">Paid orders</p><p className="mt-1 text-[11px] text-muted">Ready to process</p></div>
          <span className="text-xl font-medium">{metrics.pendingOrders}</span>
        </Link>
        <Link href="/inventory?lowStock=true" className="panel flex items-center justify-between p-4 hover:border-ink">
          <div><p className="text-xs font-medium">Low stock lines</p><p className="mt-1 text-[11px] text-muted">At or below reorder point</p></div>
          <span className={`text-xl font-medium ${metrics.lowStockVariants ? "text-warn" : ""}`}>{metrics.lowStockVariants}</span>
        </Link>
        <Link href="/returns" className="panel flex items-center justify-between p-4 hover:border-ink">
          <div><p className="text-xs font-medium">Open returns</p><p className="mt-1 text-[11px] text-muted">Across all stages</p></div>
          <span className="text-xl font-medium">{metrics.pendingReturns}</span>
        </Link>
        <Link href="/customers" className="panel flex items-center justify-between p-4 hover:border-ink">
          <div><p className="text-xs font-medium">New customers</p><p className="mt-1 text-[11px] text-muted">In selected period</p></div>
          <span className="text-xl font-medium">{metrics.newCustomers}</span>
        </Link>
      </div>
    </div>
  );
}
