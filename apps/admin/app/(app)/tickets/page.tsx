import Link from "next/link";
import { PageHeader, Badge, Pagination, EmptyState } from "@/components/ui";
import { apiGet, dateTime } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";

interface TicketsResponse {
  items: Array<{
    id: string; ticketNumber: string; subject: string; status: string; priority: string;
    customer: string; email: string | null; orderNumber: string | null; assignedTo: string | null;
    messageCount: number; updatedAt: string;
  }>;
  meta: { page: number; total: number; totalPages: number };
}

export default async function TicketsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireStaff();
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "";
  const q = typeof params.q === "string" ? params.q : "";
  const page = typeof params.page === "string" ? params.page : "1";
  const cookie = await getCookieHeader();
  const query = new URLSearchParams({ page, pageSize: "25" });
  if (status) query.set("status", status);
  if (q) query.set("q", q);
  const tickets = await apiGet<TicketsResponse>(`/admin/tickets?${query.toString()}`, { cookie });

  return (
    <div>
      <PageHeader eyebrow="Support" title="Support tickets" description="Customer conversations, internal notes and resolution status." />
      <div className="panel">
        <form method="get" className="flex flex-wrap items-end gap-2 border-b border-line p-3">
          <div className="min-w-52 flex-1">
            <label htmlFor="q" className="label">Search</label>
            <input id="q" name="q" defaultValue={q} placeholder="Ticket, subject or email" className="field" />
          </div>
          <div>
            <label htmlFor="status" className="label">Status</label>
            <select id="status" name="status" defaultValue={status} className="field">
              <option value="">All</option>
              {["OPEN", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "WAITING_FOR_INTERNAL_TEAM", "RESOLVED", "CLOSED"].map((value) => <option key={value} value={value}>{value.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <button type="submit" className="a-btn a-btn-outline">Filter</button>
        </form>
        {!tickets?.items.length ? <EmptyState title="No tickets found" /> : (
          <>
            <div className="overflow-x-auto">
              <table>
                <thead><tr><th>Ticket</th><th>Customer</th><th>Subject</th><th>Order</th><th>Priority</th><th>Status</th><th>Agent</th><th>Updated</th></tr></thead>
                <tbody>
                  {tickets.items.map((ticket) => (
                    <tr key={ticket.id}>
                      <td><Link href={`/tickets/${ticket.id}`} className="font-medium hover:underline">{ticket.ticketNumber}</Link></td>
                      <td><p className="text-xs">{ticket.customer}</p><p className="text-[10px] text-muted">{ticket.email}</p></td>
                      <td className="max-w-64 truncate text-xs">{ticket.subject}</td>
                      <td className="text-[11px]">{ticket.orderNumber ?? "—"}</td>
                      <td><Badge status={ticket.priority} /></td>
                      <td><Badge status={ticket.status} /></td>
                      <td className="text-[11px] text-muted">{ticket.assignedTo ?? "Unassigned"}</td>
                      <td className="text-[11px] text-muted">{dateTime(ticket.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={tickets.meta.page} totalPages={tickets.meta.totalPages} basePath="/tickets" params={{ status, q }} />
          </>
        )}
      </div>
    </div>
  );
}
