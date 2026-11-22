"use client";

import { useState } from "react";
import { toast } from "sonner";
import { clientApi } from "@/lib/client-api";
import { useI18n } from "@/lib/i18n-client";

interface Props {
  user: { firstName: string; lastName: string; email: string; phone: string | null; emailVerifiedAt: string | null };
}

export function SettingsView({ user }: Props) {
  const { t } = useI18n();
  const [profile, setProfile] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone ?? "",
  });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [busy, setBusy] = useState<string | null>(null);
  const [verified, setVerified] = useState(!!user.emailVerifiedAt);

  return (
    <div className="space-y-10">
      <section>
        <h2 className="border-b border-line pb-3 font-display text-2xl">{t("Profile")}</h2>
        <form
          className="mt-5 grid max-w-xl gap-4 sm:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy("profile");
            try {
              await clientApi("/auth/profile", { method: "PATCH", body: JSON.stringify(profile) });
              toast(t("Profile updated"));
            } catch (error) {
              toast.error(error instanceof Error ? error.message : t("Could not update profile"));
            } finally {
              setBusy(null);
            }
          }}
        >
          <div>
            <label htmlFor="p-first" className="label">{t("First name")}</label>
            <input id="p-first" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} className="field" required />
          </div>
          <div>
            <label htmlFor="p-last" className="label">{t("Last name")}</label>
            <input id="p-last" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} className="field" required />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="p-email" className="label">{t("Email")}</label>
            <input id="p-email" value={user.email} disabled className="field opacity-60" />
            <p className="mt-1 text-[11px] text-muted">{t("Contact customer care to change your account email.")}</p>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="p-phone" className="label">{t("Phone")}</label>
            <input id="p-phone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="field" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={busy === "profile"} className="btn btn-primary">
              {busy === "profile" ? t("Saving…") : t("Save profile")}
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="border-b border-line pb-3 font-display text-2xl">{t("Password")}</h2>
        <form
          className="mt-5 grid max-w-xl gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy("password");
            try {
              await clientApi("/auth/change-password", { method: "POST", body: JSON.stringify(passwords) });
              toast(t("Password updated. Other sessions have been signed out."));
              setPasswords({ currentPassword: "", newPassword: "" });
            } catch (error) {
              toast.error(error instanceof Error ? error.message : t("Could not change password"));
            } finally {
              setBusy(null);
            }
          }}
        >
          <div>
            <label htmlFor="current-password" className="label">{t("Current password")}</label>
            <input id="current-password" type="password" required value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} className="field" autoComplete="current-password" />
          </div>
          <div>
            <label htmlFor="new-password" className="label">{t("New password")}</label>
            <input id="new-password" type="password" required minLength={10} value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} className="field" autoComplete="new-password" />
            <p className="mt-1 text-[11px] text-muted">{t("At least 10 characters with upper and lower case letters and a number.")}</p>
          </div>
          <div>
            <button type="submit" disabled={busy === "password"} className="btn btn-outline">
              {busy === "password" ? t("Updating…") : t("Update password")}
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="border-b border-line pb-3 font-display text-2xl">{t("Email verification")}</h2>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
          <p className={verified ? "text-muted" : "text-sale"}>
            {verified ? t("Your email is verified.") : t("Your email address is not verified yet.")}
          </p>
          {!verified && (
            <button
              type="button"
              onClick={async () => {
                try {
                  await clientApi("/auth/verify-email/resend", { method: "POST" });
                  toast(t("Verification email queued"));
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : t("Could not send verification"));
                }
              }}
              className="underline"
            >
              {t("Resend verification")}
            </button>
          )}
        </div>
      </section>

      <section>
        <h2 className="border-b border-line pb-3 font-display text-2xl">{t("Your data")}</h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          {t("You can download a copy of your profile, addresses, order history and reviews at any time.")}
        </p>
        <a href="/api/v1/account/export" className="btn btn-outline mt-4" download>
          {t("Download my data (JSON)")}
        </a>
      </section>

      <section className="border border-sale/30 p-5">
        <h2 className="font-display text-xl">{t("Close your account")}</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          {t("Account deletion requires identity verification and is handled by customer care. This ensures orders and financial records remain auditable where required by law.")}
        </p>
        <a href="/account/support" className="btn btn-outline mt-4">{t("Contact customer care")}</a>
      </section>
    </div>
  );
}
