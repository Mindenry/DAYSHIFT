"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clientApi } from "@/lib/api";

export function NewTicketForm() {
  const [busy, setBusy] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();

  return (
    <form
      className="mt-4 space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        try {
          const ticket = await clientApi<{ id: string }>("/support/tickets", {
            method: "POST",
            body: JSON.stringify({ subject, description, priority: "NORMAL" }),
          });
          toast("Request sent. We'll reply by email.");
          setSubject("");
          setDescription("");
          router.push(`/account/support/${ticket.id}`);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Could not send request");
        } finally {
          setBusy(false);
        }
      }}
    >
      <div>
        <label htmlFor="ticket-subject" className="label">Subject</label>
        <input id="ticket-subject" required minLength={3} maxLength={160} value={subject} onChange={(e) => setSubject(e.target.value)} className="field" placeholder="How can we help?" />
      </div>
      <div>
        <label htmlFor="ticket-description" className="label">Details</label>
        <textarea id="ticket-description" required minLength={10} maxLength={4000} rows={5} value={description} onChange={(e) => setDescription(e.target.value)} className="field resize-y" placeholder="Include your order number if relevant." />
      </div>
      <button type="submit" disabled={busy} className="btn btn-primary w-full">{busy ? "Sending…" : "Send request"}</button>
    </form>
  );
}

export function TicketReplyForm({ ticketId }: { ticketId: string }) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  return (
    <form
      className="mt-6"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        try {
          await clientApi(`/support/tickets/${ticketId}/messages`, {
            method: "POST",
            body: JSON.stringify({ body }),
          });
          setBody("");
          toast("Reply sent");
          router.refresh();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Could not send reply");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label htmlFor="ticket-reply" className="label">Reply</label>
      <textarea id="ticket-reply" required value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="field resize-y" placeholder="Add to the conversation" />
      <button type="submit" disabled={busy || !body.trim()} className="btn btn-primary mt-3">{busy ? "Sending…" : "Send reply"}</button>
    </form>
  );
}
