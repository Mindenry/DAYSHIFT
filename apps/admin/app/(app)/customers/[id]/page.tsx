import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Badge } from "@/components/ui";
import { apiGet, money, date, dateTime } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";
import { CustomerEditor } from "@/components/customer-editor";

interface AdminCustomer {
  id: string; email: string; firstName: string; lastName: string; phone: string | null; status: string;
  emailVerifiedAt: string | null; createdAt: string; lastLoginAt: string | null;
  profile: { staffNotes: string | null; tags: string[]; segment: string | null; marketingOptIn: boolean } | null;
  loyalty: { pointsBalance: number; lifetimePoints: number; tier: string; transactions: Array<{ id: string; type: string; points: number; reason: string; createdAt: string }> } | null;
  addresses: Array<{ id: string; label: string | null; line1: string; city: string; postalCode: string; country: string }>;
  orders: Array<{ id: string; orderNumber: string; status: string; paymentStatus: string; grandTotal: string; createdAt: string }>;
  tickets: Array<{ id: string; ticketNumber: string; subject: string; status: string; createdAt: string }>;
  reviews: Array<{ id: string; rating: number; body: string; status: string; createdAt: string }>;
  returns: Array<{ id: string; returnNumber: string; status: string; requestedAt: string }>;
  orderCount: number; totalSpent: string;
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const cookie = await getCookieHeader();
  const customer = await apiGet<AdminCustomer>(`/admin/customers/${id}`, { cookie });
  if (!customer) notFound();

  return (
    <div>
      <PageHeader
        eyebrow="Customer"
        title={`${customer.firstName} ${customer.lastName}`}
        description={`${customer.email} · joined ${date(customer.createdAt)}`}
        back={{ href: "/customers", label: "Customers" }}
        actions={<Badge status={customer.status} />}
      />
      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { label: "Orders", value: String(customer.orderCount) },
              { label: "Total spent", value: money(customer.totalSpent) },
              { label: "Loyalty tier", value: customer.loyalty?.tier ?? "—" },
              { label: "Points", value: String(customer.loyalty?.pointsBalance ?? 0) },
            ].map((stat) => (
              <div key={stat.label} className="panel p-3">
                <p className="text-[10px] uppercase tracking-[0.08em] text-muted">{stat.label}</p>
                <p className="mt-1.5 text-lg font-medium">{stat.value}</p>
              </div>
            ))}
          </div>

          <section className="panel overflow-hidden">
            <div className="border-b border-line px-4 py-3"><h2 className="text-xs font-medium uppercase tracking-[0.08em]">Orders</h2></div>
            {customer.orders.length === 0 ? <p className="p-4 text-xs text-muted">No orders.</p> : (
              <div className="overflow-x-auto">
                <table>
                  <thead><tr><th>Order</th><th>Status</th><th>Payment</th><th className="text-right">Total</th><th>Date</th></tr></thead>
                  <tbody>
                    {customer.orders.map((order) => (
                      <tr key={order.id}>
                        <td><Link href={`/orders/${order.orderNumber}`} className="text-xs font-medium underline">{order.orderNumber}</Link></td>
                        <td><Badge status={order.status} /></td>
                        <td><Badge status={order.paymentStatus} /></td>
                        <td className="text-right">{money(order.grandTotal)}</td>
                        <td className="text-[11px] text-muted">{date(order.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="panel p-4">
              <h2 className="text-xs font-medium uppercase tracking-[0.08em]">Tickets</h2>
              {customer.tickets.length === 0 ? <p className="mt-2 text-[11px] text-muted">No support tickets.</p> : (
                <ul className="mt-2 space-y-2">
                  {customer.tickets.map((ticket) => (
                    <li key={ticket.id} className="text-[11px]">
                      <Link href={`/tickets/${ticket.id}`} className="font-medium underline">{ticket.ticketNumber}</Link>
                      <p className="text-muted">{ticket.subject} · {ticket.status.replace(/_/g, " ").toLowerCase()}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="panel p-4">
              <h2 className="text-xs font-medium uppercase tracking-[0.08em]">Returns</h2>
              {customer.returns.length === 0 ? <p className="mt-2 text-[11px] text-muted">No returns.</p> : (
                <ul className="mt-2 space-y-2">
                  {customer.returns.map((request) => (
                    <li key={request.id} className="text-[11px]">
                      <Link href={`/returns/${request.id}`} className="font-medium underline">{request.returnNumber}</Link>
                      <p className="text-muted">{request.status.replace(/_/g, " ").toLowerCase()} · {date(request.requestedAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="panel p-4">
            <h2 className="text-xs font-medium uppercase tracking-[0.08em]">Loyalty activity</h2>
            {!customer.loyalty?.transactions.length ? <p className="mt-2 text-[11px] text-muted">No points activity.</p> : (
              <ul className="mt-2 divide-y divide-line">
                {customer.loyalty.transactions.map((transaction) => (
                  <li key={transaction.id} className="flex items-center justify-between py-2 text-[11px]">
                    <span>{transaction.reason}<span className="ml-2 text-muted">{dateTime(transaction.createdAt)}</span></span>
                    <span className={transaction.points >= 0 ? "text-accent" : "text-muted"}>{transaction.points > 0 ? "+" : ""}{transaction.points}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <section className="panel p-4">
            <h2 className="text-xs font-medium uppercase tracking-[0.08em]">Profile</h2>
            <dl className="mt-3 space-y-2 text-[11px]">
              <div className="flex justify-between"><dt className="text-muted">Email</dt><dd>{customer.email}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Phone</dt><dd>{customer.phone ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Marketing</dt><dd>{customer.profile?.marketingOptIn ? "Opted in" : "Opted out"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Verified</dt><dd>{customer.emailVerifiedAt ? "Yes" : "No"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Last login</dt><dd>{dateTime(customer.lastLoginAt)}</dd></div>
            </dl>
            <div className="mt-3 border-t border-line pt-3">
              <p className="label">Addresses</p>
              {customer.addresses.map((address) => (
                <p key={address.id} className="mt-1 text-[11px] text-muted">{address.label ?? "Address"} · {address.line1}, {address.city} {address.postalCode}, {address.country}</p>
              ))}
            </div>
          </section>
          <CustomerEditor
            id={customer.id}
            notes={customer.profile?.staffNotes ?? null}
            tags={customer.profile?.tags ?? []}
            segment={customer.profile?.segment ?? null}
            status={customer.status}
          />
        </div>
      </div>
    </div>
  );
}
