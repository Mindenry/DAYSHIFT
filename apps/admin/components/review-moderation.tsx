"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { clientApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n-client";

export function ReviewModeration({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const { t } = useI18n();
  const [busy, setBusy] = useState<string | null>(null);

  const moderate = async (next: "APPROVED" | "REJECTED" | "PENDING") => {
    setBusy(next);
    try {
      await clientApi(`/admin/reviews/${id}`, { method: "PATCH", body: JSON.stringify({ status: next }) });
      toast(next === "APPROVED" ? t("Review approved") : next === "REJECTED" ? t("Review rejected") : t("Review reopened"));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Could not moderate review"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex gap-2">
      {status !== "APPROVED" && <button type="button" onClick={() => moderate("APPROVED")} disabled={!!busy} className="a-btn a-btn-sm">{t("Approve")}</button>}
      {status !== "REJECTED" && <button type="button" onClick={() => moderate("REJECTED")} disabled={!!busy} className="a-btn a-btn-outline a-btn-sm">{t("Reject")}</button>}
      {status !== "PENDING" && <button type="button" onClick={() => moderate("PENDING")} disabled={!!busy} className="a-btn a-btn-outline a-btn-sm">{t("Re-open")}</button>}
    </div>
  );
}
