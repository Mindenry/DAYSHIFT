import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/session";
import { AdminLoginForm } from "@/components/admin-login-form";
import { getI18n } from "@/lib/i18n";
import { LocaleSwitcher } from "@/lib/i18n-client";
import { STOREFRONT_URL } from "@/lib/site";

export const metadata: Metadata = { title: "Sign in — DAYSHIFT Ops", robots: { index: false } };

export default async function LoginPage() {
  const session = await getStaffSession();
  if (session) redirect("/");
  const { t } = await getI18n();

  return (
    <div className="relative grid min-h-screen bg-canvas lg:grid-cols-[1.08fr_1fr]">
      <div className="absolute right-4 top-4 z-10">
        <LocaleSwitcher />
      </div>

      <section className="relative hidden overflow-hidden bg-sidebar p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-accent/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-[380px] w-[380px] rounded-full bg-white/5 blur-2xl" />

        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-base font-bold">D</span>
          <div>
            <p className="text-[13px] font-semibold tracking-[0.26em]">DAYSHIFT</p>
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/60">{t("Commerce operations")}</p>
          </div>
        </div>

        <div className="relative max-w-lg">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">{t("Operations")}</p>
          <h1 className="mt-4 text-[clamp(2.6rem,4.5vw,4.5rem)] font-semibold leading-[1.03] tracking-[-0.04em]">
            {t("The business behind everyday style.")}
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-white/60">
            {t("Orders, inventory, returns, customers and the numbers that matter — in one operational workspace.")}
          </p>
          <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-white/10 pt-6">
            <div>
              <dt className="text-[10px] uppercase tracking-[0.14em] text-white/60">{t("Channels")}</dt>
              <dd className="mt-1 text-sm text-white/85">{t("Storefront · Admin")}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.14em] text-white/60">{t("Environment")}</dt>
              <dd className="mt-1 text-sm text-white/85">{t("Local · Sandbox payments")}</dd>
            </div>
          </dl>
        </div>

        <p className="relative text-[10px] leading-relaxed text-white/60">
          {t("Demonstration environment. No real customer data or payments.")}
        </p>
      </section>

      <section className="flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-base font-bold text-surface">D</span>
            <div>
              <p className="text-[13px] font-semibold tracking-[0.24em]">DAYSHIFT</p>
              <p className="text-[9px] uppercase tracking-[0.18em] text-muted">{t("Commerce operations")}</p>
            </div>
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">{t("Staff access")}</p>
          <h2 className="mt-2 text-[2rem] font-semibold leading-tight tracking-[-0.03em]">{t("Sign in to operations")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {t("Use a staff account. Customer accounts cannot access this portal.")}
          </p>

          <AdminLoginForm />

          <div className="mt-8 rounded-xl border border-line bg-surface-2 p-4 text-xs leading-relaxed text-muted">
            <p className="font-semibold text-ink">{t("Demo credentials")}</p>
            <p className="mt-2">{t("Use the seeded staff account to explore the operations portal.")}</p>
            <div className="mt-3 space-y-1 font-mono text-[10.5px] text-ink-soft">
              <p>admin@dayshift.example · Admin1234!Pass</p>
              <p>warehouse@dayshift.example · Warehouse1234!Pass</p>
              <p>support@dayshift.example · Support1234!Pass</p>
            </div>
          </div>

          <a href={STOREFRONT_URL} className="mt-6 inline-flex text-xs text-muted underline underline-offset-4 hover:text-ink">
            {t("Back to storefront")}
          </a>
        </div>
      </section>
    </div>
  );
}
