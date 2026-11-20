import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Badge } from "@/components/ui";
import { apiGet, dateTime } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";
import { TicketWorkspace } from "@/components/ticket-workspace";

interface AdminTicket {
  id: string; ticketNumber: string; subject: string; description: string; status: string; priority: string;
  createdAt: string; updatedAt: string;
  customer: { id: string; firstName: string; lastName: string; email: string } | null;
  assignedTo: { id: string; firstName: string; lastName: string } | null;
  order: { id: string; orderNumber: string; status: string; grandTotal: string } | null;
  messages: Array<{ id: string; authorType: string; author: string; body: string; isInternal: boolean; createdAt: string }>;
}

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const cookie = await getCookieHeader();
  const [ticket, agents] = await Promise.all([
    apiGet<AdminTicket>(`/admin/tickets/${id}`, { cookie }),
    apiGet<Array<{ id: string; firstName: string; lastName: string; email: string }>>("/admin/tickets/agents", { cookie }),
  ]);
  if (!ticket) notFound();

  return (
    <div>
      <PageHeader
        eyebrow={`Ticket ${ticket.ticketNumber}`}
        title={ticket.subject}
        description={`${ticket.customer ? `${ticket.customer.firstName} ${ticket.customer.lastName} · ${ticket.customer.email}` : "Guest"} · opened ${dateTime(ticket.createdAt)}`}
        back={{ href: "/tickets", label: "Support" }}
        actions={<div className="flex gap-2"><Badge status={ticket.priority} /><Badge status={ticket.status} /></div>}
      />
      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <section className="panel">
          <div className="border-b border-line px-4 py-3"><h2 className="text-xs font-medium uppercase tracking-[0.08em]">Conversation</h2></div>
          <ul className="divide-y divide-line">
            {ticket.messages.map((message) => (
              <li key={message.id} className={`px-4 py-4 ${message.isInternal ? "bg-warn-soft/40" : ""}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-medium">
                    {message.authorType === "CUSTOMER" ? ticket.customer?.firstName ?? "Customer" : message.author}
                    {message.isInternal && <span className="ml-2 border border-warn/30 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.08em] text-warn">Internal</span>}
                  </p>
                  <p className="text-[10px] text-muted">{dateTime(message.createdAt)}</p>
                </div>
                <p className="mt-2 whitespace-pre-line text-xs leading-relaxed">{message.body}</p>
              </li>
            ))}
          </ul>
        </section>
        <div className="space-y-4">
          <section className="panel p-4">
            <h2 className="text-xs font-medium uppercase tracking-[0.08em]">Context</h2>
            <dl className="mt-3 space-y-2 text-[11px]">
              <div className="flex justify-between"><dt className="text-muted">Status</dt><dd><Badge status={ticket.status} /></dd></div>
              <div className="flex justify-between"><dt className="text-muted">Priority</dt><dd>{ticket.priority}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Assigned</dt><dd>{ticket.assignedTo ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}` : "Unassigned"}</dd></div>
            </dl>
            {ticket.order && (
              <div className="mt-3 border-t border-line pt-3 text-[11px]">
                <p className="label">Related order</p>
                <Link href={`/orders/${ticket.order.orderNumber}`} className="underline">{ticket.order.orderNumber}</Link>
                <p className="mt-1 text-muted">{ticket.order.status.replace(/_/g, " ").toLowerCase()}</p>
              </div>
            )}
          </section>
          <TicketWorkspace
            id={ticket.id}
            status={ticket.status}
            priority={ticket.priority}
            assignedToId={ticket.assignedTo?.id ?? null}
            agents={agents ?? []}
          />
        </div>
      </div>
    </div>
  );
}
