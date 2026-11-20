import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getI18n } from "@/lib/i18n";
import { SettingsView } from "@/components/settings-view";

export const metadata: Metadata = { title: "Settings & security", robots: { index: false } };

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account/settings");
  const { t } = await getI18n();
  return (
    <div>
      <div className="border-b border-line pb-6">
        <p className="overline text-muted">{t("Account")}</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">{t("Settings & security")}</h1>
      </div>
      <div className="mt-8">
        <SettingsView
          user={{
            firstName: session.firstName,
            lastName: session.lastName,
            email: session.email,
            phone: session.phone,
            emailVerifiedAt: session.emailVerifiedAt,
          }}
        />
      </div>
    </div>
  );
}
