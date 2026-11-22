"use client";

import { useState } from "react";
import { ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { clientApi } from "@/lib/client-api";
import { useI18n } from "@/lib/i18n-client";

export function HelpfulButton({ reviewId, initialCount }: { reviewId: string; initialCount: number }) {
  const { t } = useI18n();
  const [count, setCount] = useState(initialCount);
  const [voted, setVoted] = useState(false);
  const [busy, setBusy] = useState(false);

  const vote = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await clientApi<{ helpful: boolean; count: number }>(`/reviews/${reviewId}/helpful`, { method: "POST" });
      setVoted(result.helpful);
      setCount(result.count);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Could not register your vote"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" onClick={vote} disabled={busy} className="inline-flex items-center gap-1.5 hover:text-ink" aria-pressed={voted}>
      <ThumbsUp className={`h-3.5 w-3.5 ${voted ? "fill-ink" : ""}`} /> {t("Helpful")} ({count})
    </button>
  );
}
