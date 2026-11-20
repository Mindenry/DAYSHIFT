import type { Metadata } from "next";
import Link from "next/link";
import { apiGet, money } from "@/lib/api";
import { getCookieHeader } from "@/lib/session";
import { statusLabel } from "@/components/order-detail-view";

export const metadata: Metadata = { title: "Your orders — DAYSHIFT", robots: { index: false } };

interface OrdersResponse {
  items: Array<{
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    grandTotal: string;
    createdAt: string;
    itemCount: number;
    thumbnail: string | null;
    trackingNumber: string | null;
  }>;
  meta: { page: number; totalPages: number; total: number };
}

const TABS = [
  { label: "All", value: "" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Returns", value: "RETURN_REQUESTED" },
];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "";
  const page = typeof params.page === "string" ? params.page : "1";
  const cookie = await getCookieHeader();
  const query = new URLSearchParams({ page, pageSize: "20" });
  if (status) query.set("status", status);
  const orders = await apiGet<OrdersResponse>(`/orders?${query.toString()}`, { cookie, revalidate: 0 });

  return (
    <div>
      <div className="border-b border-line pb-6">
        <p className="overline text-muted">Account</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">Orders</h1>
      </div>

      <nav aria-label="Filter orders" className="mt-6 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((tab) => {
          const active = status === tab.value;
          return (
            <Link
              key={tab.label}
              href={tab.value ? `/account/orders?status=${tab.value}` : "/account/orders"}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 border-b-2 px-4 py-3 text-[11px] uppercase tracking-[0.14em] ${
                active ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {!orders || orders.items.length === 0 ? (
        <div className="py-20 text-center">
          <h2 className="font-display text-3xl">No orders here.</h2>
          <p className="mt-3 text-sm text-muted">When you place an order, it will appear here.</p>
          <Link href="/collections/new-arrivals" className="btn btn-outline mt-8">Start shopping</Link>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {orders.items.map((order) => (
            <li key={order.id}>
              <Link href={`/account/orders/${order.orderNumber}`} className="grid gap-4 py-5 transition-colors hover:bg-sand/25 sm:grid-cols-[80px_1fr_auto] sm:items-center">
                <div className="h-24 w-20 overflow-hidden bg-sand">
                  {order.thumbnail && (
                     
                    <img src={order.thumbnail} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div>
                  <p className="font-display text-xl">{order.orderNumber}</p>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(order.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    {" · "}{order.itemCount} {order.itemCount === 1 ? "piece" : "pieces"}
                  </p>
                  <p className="mt-2 inline-flex border border-line px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-muted">
                    {statusLabel(order.status)}
                  </p>
                  {order.trackingNumber && <p className="mt-2 text-[11px] text-muted">Tracking {order.trackingNumber}</p>}
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm">{money(order.grandTotal)}</p>
                  <span className="mt-2 inline-block text-[11px] uppercase tracking-[0.12em] underline">View order</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {orders && orders.meta.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: orders.meta.totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={`/account/orders?${status ? `status=${status}&` : ""}page=${n}`}
              className={`flex h-9 w-9 items-center justify-center border text-xs ${n === orders.meta.page ? "border-ink bg-ink text-paper" : "border-line"}`}
            >
              {n}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
