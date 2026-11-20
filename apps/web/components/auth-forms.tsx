"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { clientApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n-client";

async function completeSignIn(router: ReturnType<typeof useRouter>, next: string) {
  try {
    await clientApi("/cart/merge", { method: "POST" });
  } catch {
    /* no guest cart to merge */
  }
  window.dispatchEvent(new Event("cart:updated"));
  router.push(next);
  router.refresh();
}

export function LoginForm({ next }: { next: string }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <form
      className="mt-8 space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setBusy(true);
        setError(null);
        try {
          await clientApi("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email: data.get("email"), password: data.get("password") }),
          });
          toast(t("Welcome back"));
          await completeSignIn(router, next);
        } catch (loginError) {
          setError(loginError instanceof Error ? loginError.message : t("Could not sign in."));
          setBusy(false);
        }
      }}
    >
      {error && <div role="alert" className="border border-sale/40 bg-sale/5 p-3 text-sm text-sale">{error}</div>}
      <div>
        <label htmlFor="login-email" className="label">{t("Email")}</label>
        <input id="login-email" name="email" type="email" required autoComplete="email" className="field" />
      </div>
      <div>
        <label htmlFor="login-password" className="label">{t("Password")}</label>
        <input id="login-password" name="password" type="password" required autoComplete="current-password" className="field" />
      </div>
      <button type="submit" disabled={busy} className="btn btn-primary w-full">
        {busy ? t("Signing in…") : t("Sign in")}
      </button>
    </form>
  );
}

export function RegisterForm({ next }: { next: string }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setBusy(true);
        setError(null);
        try {
          await clientApi("/auth/register", {
            method: "POST",
            body: JSON.stringify({
              firstName: data.get("firstName"),
              lastName: data.get("lastName"),
              email: data.get("email"),
              password: data.get("password"),
              marketingOptIn: data.get("marketingOptIn") === "on",
            }),
          });
          toast(t("Your account is ready"));
          await completeSignIn(router, next);
        } catch (registerError) {
          setError(registerError instanceof Error ? registerError.message : t("Could not create account."));
          setBusy(false);
        }
      }}
    >
      {error && <div role="alert" className="border border-sale/40 bg-sale/5 p-3 text-sm text-sale">{error}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="label">{t("First name")}</label>
          <input id="firstName" name="firstName" required autoComplete="given-name" className="field" />
        </div>
        <div>
          <label htmlFor="lastName" className="label">{t("Last name")}</label>
          <input id="lastName" name="lastName" required autoComplete="family-name" className="field" />
        </div>
      </div>
      <div>
        <label htmlFor="register-email" className="label">{t("Email")}</label>
        <input id="register-email" name="email" type="email" required autoComplete="email" className="field" />
      </div>
      <div>
        <label htmlFor="register-password" className="label">{t("Password")}</label>
        <input id="register-password" name="password" type="password" required minLength={10} autoComplete="new-password" className="field" />
        <p className="mt-1.5 text-[11px] text-muted">{t("At least 10 characters with upper and lower case letters and a number.")}</p>
      </div>
      <label className="flex items-start gap-3 pt-1 text-xs text-muted">
        <input type="checkbox" name="marketingOptIn" className="mt-0.5 h-4 w-4 accent-[#1a1917]" />
        {t("Send me the DAYSHIFT note — new arrivals and studio news. Unsubscribe anytime.")}
      </label>
      <label className="flex items-start gap-3 text-xs text-muted">
        <input type="checkbox" required className="mt-0.5 h-4 w-4 accent-[#1a1917]" />
        {t("I agree to the")} <Link href="/legal/terms" className="underline">{t("terms")}</Link> {t("and")} <Link href="/legal/privacy" className="underline">{t("privacy policy")}</Link>.
      </label>
      <button type="submit" disabled={busy} className="btn btn-primary w-full">
        {busy ? t("Creating account…") : t("Create account")}
      </button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const { t } = useI18n();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (sent) {
    return (
      <div className="mt-6 border border-line p-5 text-sm leading-relaxed text-muted">
        {t("If an account exists for that email, a reset link is on its way.")}
      </div>
    );
  }

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setBusy(true);
        setError(null);
        try {
          await clientApi("/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify({ email: data.get("email") }),
          });
          setSent(true);
        } catch (forgotError) {
          setError(forgotError instanceof Error ? forgotError.message : t("Could not send reset link."));
          setBusy(false);
        }
      }}
    >
      {error && <div role="alert" className="border border-sale/40 bg-sale/5 p-3 text-sm text-sale">{error}</div>}
      <div>
        <label htmlFor="forgot-email" className="label">{t("Email")}</label>
        <input id="forgot-email" name="email" type="email" required className="field" />
      </div>
      <button type="submit" disabled={busy} className="btn btn-primary w-full">{busy ? t("Sending…") : t("Send reset link")}</button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setBusy(true);
        setError(null);
        try {
          await clientApi("/auth/reset-password", {
            method: "POST",
            body: JSON.stringify({ token, password: data.get("password") }),
          });
          toast(t("Password updated. Sign in with your new password."));
          router.push("/login");
        } catch (resetError) {
          setError(resetError instanceof Error ? resetError.message : t("Could not reset password."));
          setBusy(false);
        }
      }}
    >
      {error && <div role="alert" className="border border-sale/40 bg-sale/5 p-3 text-sm text-sale">{error}</div>}
      <div>
        <label htmlFor="reset-password" className="label">{t("New password")}</label>
        <input id="reset-password" name="password" type="password" required minLength={10} className="field" />
        <p className="mt-1.5 text-[11px] text-muted">{t("At least 10 characters with upper and lower case letters and a number.")}</p>
      </div>
      <button type="submit" disabled={busy} className="btn btn-primary w-full">{busy ? t("Updating…") : t("Update password")}</button>
      <Link href="/login" className="block text-center text-xs underline">{t("Back to sign in")}</Link>
    </form>
  );
}

export function SignOutButton() {
  const { t } = useI18n();
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await clientApi("/auth/logout", { method: "POST" });
        } finally {
          window.dispatchEvent(new Event("cart:updated"));
          router.push("/");
          router.refresh();
        }
      }}
      className="inline-flex min-h-11 items-center text-left text-sm text-muted underline underline-offset-4 hover:text-ink"
    >
      {t("Sign out")}
    </button>
  );
}
