import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Badge } from "@/components/ui";
import { apiGet, dateTime } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";
import { getI18n } from "@/lib/i18n";
import { enumLabel } from "@/lib/messages";
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
  const { t, locale } = await getI18n();
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
        eyebrow={`${t("Ticket")} ${ticket.ticketNumber}`}
        title={ticket.subject}
        description={`${ticket.customer ? `${ticket.customer.firstName} ${ticket.customer.lastName} · ${ticket.customer.email}` : t("Guest")} · ${t("opened")} ${dateTime(ticket.createdAt)}`}
        back={{ href: "/tickets", label: "Support" }}
        actions={<div className="flex gap-2"><Badge status={ticket.priority} /><Badge status={ticket.status} /></div>}
      />
      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <section className="panel overflow-hidden">
          <div className="panel-header"><h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("Conversation")}</h2></div>
          <ul className="divide-y divide-line">
            {ticket.messages.map((message) => (
              <li key={message.id} className={`px-4 py-4 ${message.isInternal ? "bg-warn-soft/40" : ""}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-medium">
                    {message.authorType === "CUSTOMER" ? ticket.customer?.firstName ?? t("Customer") : message.author}
                    {message.isInternal && <span className="ml-2 rounded-full border border-warn/30 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.08em] text-warn">{t("Internal")}</span>}
                  </p>
                  <p className="text-[10px] text-muted">{dateTime(message.createdAt)}</p>
                </div>
                <p className="mt-2 whitespace-pre-line text-xs leading-relaxed">{message.body}</p>
              </li>
            ))}
          </ul>
        </section>
        <div className="space-y-4">
          <section className="panel p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("Context")}</h2>
            <dl className="mt-3 space-y-2 text-[11px]">
              <div className="flex items-center justify-between gap-2"><dt className="text-muted">{t("Status")}</dt><dd><Badge status={ticket.status} /></dd></div>
              <div className="flex justify-between"><dt className="text-muted">{t("Priority")}</dt><dd>{t(ticket.priority)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">{t("Assigned")}</dt><dd>{ticket.assignedTo ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}` : t("Unassigned")}</dd></div>
            </dl>
            {ticket.order && (
              <div className="mt-3 border-t border-line pt-3 text-[11px]">
                <p className="label">{t("Related order")}</p>
                <Link href={`/orders/${ticket.order.orderNumber}`} className="underline">{ticket.order.orderNumber}</Link>
                <p className="mt-1 text-muted">{enumLabel(locale, ticket.order.status)}</p>
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
