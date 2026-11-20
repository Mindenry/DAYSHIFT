"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { clientApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n-client";

export function AdminLoginForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useI18n();

  return (
    <form
      className="mt-7 space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setBusy(true);
        setError(null);
        try {
          const user = await clientApi<{ kind: string }>("/auth/staff/login", {
            method: "POST",
            body: JSON.stringify({ email: data.get("email"), password: data.get("password") }),
          });
          if (user.kind !== "staff") throw new Error(t("Staff access required"));
          router.push("/");
          router.refresh();
        } catch (loginError) {
          setError(loginError instanceof Error ? loginError.message : t("Could not sign in"));
          setBusy(false);
        }
      }}
    >
      {error && (
        <div role="alert" className="rounded-lg border border-danger/25 bg-danger-soft px-3 py-2.5 text-xs text-danger">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="email" className="label">{t("Staff email")}</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className="field"
          placeholder={t("Enter your staff email")}
        />
      </div>
      <div>
        <label htmlFor="password" className="label">{t("Password")}</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="field"
          placeholder={t("Enter your password")}
        />
      </div>
      <button type="submit" disabled={busy} className="a-btn w-full">
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> {t("Signing in…")}
          </>
        ) : (
          <>
            {t("Sign in")} <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}
