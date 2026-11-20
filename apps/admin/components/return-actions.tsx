"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clientApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n-client";
import { enumLabel } from "@/lib/messages";

const NEXT: Record<string, string[]> = {
  REQUESTED: ["UNDER_REVIEW", "APPROVED", "REJECTED", "CANCELLED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["RETURN_SHIPPED", "RECEIVED", "CANCELLED"],
  RETURN_SHIPPED: ["RECEIVED", "CANCELLED"],
  RECEIVED: ["INSPECTED"],
  INSPECTED: ["CLOSED"],
  REFUND_PENDING: ["CLOSED"],
  REFUNDED: ["CLOSED"],
  REJECTED: ["CLOSED"],
  CLOSED: [],
  CANCELLED: [],
};

export function ReturnActions({
  id,
  status,
  adminNote,
  refundAmount,
  hasRefund,
}: {
  id: string;
  status: string;
  adminNote: string | null;
  refundAmount: string | null;
  hasRefund: boolean;
}) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [note, setNote] = useState(adminNote ?? "");
  const [message, setMessage] = useState("");
  const [next, setNext] = useState(NEXT[status]?.[0] ?? "");
  const [busy, setBusy] = useState<string | null>(null);

  const update = async (target: string) => {
    setBusy(target);
    try {
      await clientApi(`/admin/returns/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: target, adminNote: note || undefined, message: message || undefined }),
      });
      toast(t("Return marked {status}", { status: enumLabel(locale, target) }));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Could not update return"));
    } finally {
      setBusy(null);
    }
  };

  const refund = async () => {
    if (!window.confirm(t("Process a refund of {amount}?", { amount: refundAmount ?? t("the calculated amount") }))) return;
    setBusy("refund");
    try {
      await clientApi(`/admin/returns/${id}/refund`, { method: "POST" });
      toast(t("Refund processed through the sandbox provider"));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Could not process refund"));
    } finally {
      setBusy(null);
    }
  };

  const canRefund = ["INSPECTED", "REFUND_PENDING"].includes(status) && !hasRefund;

  return (
    <div className="space-y-4">
      <section className="panel p-5">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("Review")}</h2>
        <textarea className="field mt-3" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("Internal note (not shown to customer)")} />
        <input className="field mt-2" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("Optional message included in the customer email")} />
      </section>

      {NEXT[status]?.length > 0 && (
        <section className="panel p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("Next step")}</h2>
          <select className="field mt-3" value={next} onChange={(e) => setNext(e.target.value)} aria-label={t("Return status")}>
            {NEXT[status].map((value) => <option key={value} value={value}>{enumLabel(locale, value)}</option>)}
          </select>
          <button type="button" onClick={() => update(next)} disabled={busy === next} className="a-btn mt-2 w-full">
            {busy === next ? t("Updating…") : t("Apply status")}
          </button>
          {next === "INSPECTED" && <p className="mt-2 text-[10px] leading-relaxed text-muted">{t("Inspection restocks returned items and fulfils exchange replacements if selected.")}</p>}
        </section>
      )}

      {canRefund && (
        <section className="panel border-accent/30 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("Refund")}</h2>
          <p className="mt-2 text-[11px] text-muted">{t("Issue the calculated refund of {amount} to the original payment method.", { amount: refundAmount ?? "—" })}</p>
          <button type="button" onClick={refund} disabled={busy === "refund"} className="a-btn mt-3 w-full">
            {busy === "refund" ? t("Processing…") : t("Process refund")}
          </button>
        </section>
      )}

      {hasRefund && <div className="rounded-lg border border-accent/20 bg-accent-soft p-3 text-[11px] text-accent">{t("A refund has already been processed for this return.")}</div>}
    </div>
  );
}
