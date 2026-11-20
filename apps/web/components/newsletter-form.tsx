"use client";

import { useState } from "react";
import { clientApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n-client";

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setState("loading");
    try {
      await clientApi<{ subscribed: boolean }>("/content/newsletter", {
        method: "POST",
        body: JSON.stringify({ email, source: "footer" }),
      });
      setState("done");
      setMessage(t("You're on the list. Look out for the next note."));
      setEmail("");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : t("Please try again."));
    }
  };

  return (
    <form onSubmit={submit} className="w-full" aria-live="polite">
      <div className="flex items-center border-b border-ink">
        <label htmlFor="newsletter-email" className="sr-only">
          {t("Email address")}
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t("Email address")}
          className={`w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted ${compact ? "text-xs" : ""}`}
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="overline shrink-0 px-2 py-3 disabled:opacity-50"
        >
          {state === "loading" ? t("Joining") : t("Join")}
        </button>
      </div>
      {message && (
        <p className={`mt-2 text-xs ${state === "error" ? "text-sale" : "text-muted"}`}>{message}</p>
      )}
      <p className="mt-2 text-[11px] text-muted">
        {t("By subscribing you agree to our")}{" "}
        <a href="/legal/privacy" className="underline">{t("privacy policy")}</a>. {t("Unsubscribe anytime.")}
      </p>
    </form>
  );
}
