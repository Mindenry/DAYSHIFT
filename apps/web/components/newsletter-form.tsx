"use client";

import { useState } from "react";
import { clientApi } from "@/lib/api";

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
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
      setMessage("You're on the list. Look out for the next note.");
      setEmail("");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Please try again.");
    }
  };

  return (
    <form onSubmit={submit} className="w-full" aria-live="polite">
      <div className="flex items-center border-b border-ink">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
          className={`w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted ${compact ? "text-xs" : ""}`}
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="overline shrink-0 px-2 py-3 disabled:opacity-50"
        >
          {state === "loading" ? "Joining" : "Join"}
        </button>
      </div>
      {message && (
        <p className={`mt-2 text-xs ${state === "error" ? "text-sale" : "text-muted"}`}>{message}</p>
      )}
      <p className="mt-2 text-[11px] text-muted">
        By subscribing you agree to our{" "}
        <a href="/legal/privacy" className="underline">privacy policy</a>. Unsubscribe anytime.
      </p>
    </form>
  );
}
