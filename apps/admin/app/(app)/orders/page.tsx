import Link from "next/link";
import { PageHeader, Badge, Pagination, EmptyState } from "@/components/ui";
import { apiGet, money, dateTime } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";

interface OrdersResponse {
  items: Array<{
    id: string; orderNumber: string; status: string; paymentStatus: string; grandTotal: string;
    itemCount: number; createdAt: string; email: string; customerName: string | null;
    paymentMethod: string | null; trackingNumber: string | null;
  }>;
  meta: { page: number; total: number; totalPages: number };
}

const TABS = [
  { label: "All", value: "" },
  { label: "Pending payment", value: "PENDING_PAYMENT" },
  { label: "Paid", value: "PAID" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Packed", value: "PACKED" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireStaff();
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "";
  const q = typeof params.q === "string" ? params.q : "";
  const page = typeof params.page === "string" ? params.page : "1";
  const cookie = await getCookieHeader();
  const query = new URLSearchParams({ page, pageSize: "25" });
  if (status) query.set("status", status);
  if (q) query.set("q", q);
  const orders = await apiGet<OrdersResponse>(`/admin/orders?${query.toString()}`, { cookie });

  return (
    <div>
      <PageHeader eyebrow="Sales" title="Orders" description={`${orders?.meta.total ?? 0} orders. Every status change is recorded with actor, reason and timestamp.`} />
      <div className="panel">
        <nav className="flex gap-1 overflow-x-auto border-b border-line px-3">
          {TABS.map((tab) => {
            const active = status === tab.value;
            return (
              <Link
                key={tab.label}
                href={`/orders${tab.value ? `?status=${tab.value}` : ""}`}
                className={`shrink-0 border-b-2 px-3 py-3 text-[11px] ${active ? "border-ink font-medium text-ink" : "border-transparent text-muted hover:text-ink"}`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
        <form method="get" className="flex flex-wrap items-end gap-2 border-b border-line p-3">
          {status && <input type="hidden" name="status" value={status} />}
          <div className="min-w-56 flex-1">
            <label htmlFor="q" className="label">Search</label>
            <input id="q" name="q" defaultValue={q} placeholder="Order number or email" className="field" />
          </div>
          <button type="submit" className="a-btn a-btn-outline">Search</button>
          {q && <Link href={`/orders${status ? `?status=${status}` : ""}`} className="a-btn a-btn-outline">Reset</Link>}
        </form>

        {!orders?.items.length ? (
          <EmptyState title="No orders found" body="Try a different status or search." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table>
                <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Payment</th><th>Method</th><th className="text-right">Items</th><th className="text-right">Total</th><th>Placed</th></tr></thead>
                <tbody>
                  {orders.items.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <Link href={`/orders/${order.orderNumber}`} className="font-medium hover:underline">{order.orderNumber}</Link>
                        {order.trackingNumber && <p className="mt-0.5 text-[10px] text-muted">{order.trackingNumber}</p>}
                      </td>
                      <td>
                        <p className="text-xs">{order.customerName || "Guest"}</p>
                        <p className="text-[10px] text-muted">{order.email}</p>
                      </td>
                      <td><Badge status={order.status} /></td>
                      <td><Badge status={order.paymentStatus} /></td>
                      <td className="text-[10px] uppercase tracking-[0.05em] text-muted">{order.paymentMethod?.replace(/_/g, " ").toLowerCase() ?? "—"}</td>
                      <td className="text-right">{order.itemCount}</td>
                      <td className="text-right font-medium">{money(order.grandTotal)}</td>
                      <td className="whitespace-nowrap text-[11px] text-muted">{dateTime(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={orders.meta.page} totalPages={orders.meta.totalPages} basePath="/orders" params={{ status, q }} />
          </>
        )}
      </div>
    </div>
  );
}
