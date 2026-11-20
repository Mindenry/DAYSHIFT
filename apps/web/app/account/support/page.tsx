import type { Metadata } from "next";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { getCookieHeader } from "@/lib/session";
import { NewTicketForm } from "@/components/support-forms";

export const metadata: Metadata = { title: "Customer care", robots: { index: false } };

interface TicketSummary {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  messageCount: number;
  updatedAt: string;
}

export default async function AccountSupportPage() {
  const cookie = await getCookieHeader();
  const tickets = await apiGet<TicketSummary[]>("/support/tickets", { cookie, revalidate: 0 });

  return (
    <div>
      <div className="border-b border-line pb-6">
        <p className="overline text-muted">Account</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">Customer care</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Questions about sizing, an order or a return? Send us a note and we&apos;ll reply by email.
          Our team answers within one business day.
        </p>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <section>
          <h2 className="border-b border-line pb-3 font-display text-2xl">Your conversations</h2>
          {!tickets || tickets.length === 0 ? (
            <p className="py-10 text-sm text-muted">No conversations yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {tickets.map((ticket) => (
                <li key={ticket.id}>
                  <Link href={`/account/support/${ticket.id}`} className="flex items-start justify-between gap-4 py-4 hover:bg-sand/25">
                    <div>
                      <p className="font-display text-lg">{ticket.subject}</p>
                      <p className="mt-1 text-xs text-muted">
                        {ticket.ticketNumber} · {ticket.messageCount} {ticket.messageCount === 1 ? "message" : "messages"} ·{" "}
                        {new Date(ticket.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="shrink-0 border border-line px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-muted">
                      {ticket.status.replace(/_/g, " ").toLowerCase()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <aside>
          <div className="border border-line p-6">
            <p className="overline">New request</p>
            <NewTicketForm />
          </div>
          <div className="mt-4 border border-line p-5 text-xs leading-relaxed text-muted">
            <p>Prefer email? Write to <span className="text-ink">hello@dayshift.example</span>.</p>
            <p className="mt-2">For order-specific help, include your order number.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
