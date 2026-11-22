"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clientApi } from "@/lib/client-api";
import { useI18n } from "@/lib/i18n-client";

export function ReviewForm({ productId, productName }: { productId: string; productName: string }) {
  const { t } = useI18n();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  if (done) {
    return (
      <div className="border border-line p-5 text-sm text-muted">
        {t("Thank you. Your review of {name} has been submitted for moderation.", { name: productName })}
      </div>
    );
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await clientApi("/reviews", {
        method: "POST",
        body: JSON.stringify({ productId, rating, title: title || undefined, body }),
      });
      setDone(true);
      toast(t("Review submitted for moderation"));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Could not submit review"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="border border-line p-5">
      <p className="overline">{t("Write a review")}</p>
      <div className="mt-3 flex items-center gap-1" role="radiogroup" aria-label={t("Rating")}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={rating === star}
            aria-label={t("{count} stars", { count: star })}
            onClick={() => setRating(star)}
            className={`text-2xl leading-none ${star <= rating ? "text-ink" : "text-line"} hover:text-ink`}
          >
            ★
          </button>
        ))}
      </div>
      <div className="mt-4">
        <label htmlFor="review-title" className="label">{t("Title (optional)")}</label>
        <input id="review-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className="field" placeholder={t("Sum it up")} />
      </div>
      <div className="mt-4">
        <label htmlFor="review-body" className="label">{t("Your review")}</label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          minLength={10}
          maxLength={2000}
          required
          rows={4}
          className="field resize-y"
          placeholder={t("How does it fit? How is the fabric?")}
        />
      </div>
      <button type="submit" disabled={busy || body.trim().length < 10} className="btn btn-primary mt-4 w-full">
        {busy ? t("Submitting…") : t("Submit review")}
      </button>
      <p className="mt-3 text-[11px] text-muted">{t("Only customers who received this piece can review it. Reviews are moderated.")}</p>
    </form>
  );
}
