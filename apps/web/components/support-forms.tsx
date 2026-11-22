"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clientApi } from "@/lib/client-api";
import { useI18n } from "@/lib/i18n-client";

export function NewTicketForm() {
  const { t } = useI18n();
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
          toast(t("Request sent. We will reply by email."));
          setSubject("");
          setDescription("");
          router.push(`/account/support/${ticket.id}`);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : t("Could not send request"));
        } finally {
          setBusy(false);
        }
      }}
    >
      <div>
        <label htmlFor="ticket-subject" className="label">{t("Subject")}</label>
        <input id="ticket-subject" required minLength={3} maxLength={160} value={subject} onChange={(e) => setSubject(e.target.value)} className="field" placeholder={t("How can we help?")} />
      </div>
      <div>
        <label htmlFor="ticket-description" className="label">{t("Details")}</label>
        <textarea id="ticket-description" required minLength={10} maxLength={4000} rows={5} value={description} onChange={(e) => setDescription(e.target.value)} className="field resize-y" placeholder={t("Include your order number if relevant.")} />
      </div>
      <button type="submit" disabled={busy} className="btn btn-primary w-full">{busy ? t("Sending…") : t("Send request")}</button>
    </form>
  );
}

export function TicketReplyForm({ ticketId }: { ticketId: string }) {
  const { t } = useI18n();
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
          toast(t("Reply sent"));
          router.refresh();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : t("Could not send reply"));
        } finally {
          setBusy(false);
        }
      }}
    >
      <label htmlFor="ticket-reply" className="label">{t("Reply")}</label>
      <textarea id="ticket-reply" required value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="field resize-y" placeholder={t("Add to the conversation")} />
      <button type="submit" disabled={busy || !body.trim()} className="btn btn-primary mt-3">{busy ? t("Sending…") : t("Send reply")}</button>
    </form>
  );
}
