import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AccountNav } from "@/components/account-nav";
import { SignOutButton } from "@/components/auth-forms";
import { getI18n } from "@/lib/i18n";

export const metadata: Metadata = { title: "Your account — DAYSHIFT", robots: { index: false } };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/account");
  const { t } = await getI18n();

  return (
    <div className="wrap py-10 md:py-14">
      <div className="grid gap-10 lg:grid-cols-[240px_1fr] lg:gap-16">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <p className="overline text-muted">{t("Your account")}</p>
          <h2 className="mt-2 font-display text-3xl">{session.firstName}</h2>
          <p className="mt-1 truncate text-xs text-muted">{session.email}</p>
          <div className="mt-8">
            <AccountNav />
          </div>
          <div className="mt-8 border-t border-line pt-5">
            <SignOutButton />
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
