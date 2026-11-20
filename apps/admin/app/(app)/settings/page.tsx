import { PageHeader } from "@/components/ui";
import { apiGet } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";
import { SettingsForm } from "@/components/settings-form";

export default async function SettingsPage() {
  await requireStaff();
  const cookie = await getCookieHeader();
  const settings = await apiGet<Record<string, Record<string, unknown>>>(`/admin/settings`, { cookie });
  return (
    <div>
      <PageHeader eyebrow="Administration" title="Settings" description="Store, tax, shipping, returns, loyalty, payments and feature flags. Changes invalidate pricing and catalogue caches." />
      <SettingsForm initial={settings ?? {}} />
    </div>
  );
}
