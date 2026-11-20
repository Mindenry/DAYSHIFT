import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { getCookieHeader } from "@/lib/session";
import { getI18n } from "@/lib/i18n";
import { TicketReplyForm } from "@/components/support-forms";

export const metadata: Metadata = { title: "Conversation", robots: { index: false } };

interface TicketDetail {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  order: { orderNumber: string } | null;
  messages: Array<{ id: string; authorType: string; body: string; createdAt: string }>;
}

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t, locale } = await getI18n();
  const cookie = await getCookieHeader();
  const ticket = await apiGet<TicketDetail>(`/support/tickets/${id}`, { cookie, revalidate: 0 });
  if (!ticket) notFound();

  return (
    <div>
      <Link href="/account/support" className="overline link-underline text-muted">{t("Back to support")}</Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="overline text-muted">{ticket.ticketNumber}</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">{ticket.subject}</h1>
          {ticket.order && <p className="mt-1 text-xs text-muted">{t("Order {order}", { order: ticket.order.orderNumber })}</p>}
        </div>
        <span className="border border-line px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-muted">
          {t(ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1).replace(/_/g, " ").toLowerCase())}
        </span>
      </div>

      <div className="mt-8 max-w-3xl space-y-5">
        {ticket.messages.map((message) => (
          <div
            key={message.id}
            className={`border p-5 ${message.authorType === "CUSTOMER" ? "border-line bg-paper" : "border-ink/20 bg-sand/50"}`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="overline text-muted">{message.authorType === "CUSTOMER" ? t("You") : t("DAYSHIFT care")}</p>
              <p className="text-[11px] text-muted">
                {new Date(message.createdAt).toLocaleString(locale === "th" ? "th-TH" : "en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </p>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{message.body}</p>
          </div>
        ))}
      </div>

      {ticket.status !== "CLOSED" ? (
        <div className="max-w-3xl">
          <TicketReplyForm ticketId={ticket.id} />
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted">{t("This conversation is closed. Start a new request if you need anything else.")}</p>
      )}
    </div>
  );
}
