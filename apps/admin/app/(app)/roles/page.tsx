import { PageHeader } from "@/components/ui";
import { apiGet } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";
import { getI18n } from "@/lib/i18n";
import { enumLabel } from "@/lib/messages";

interface Role {
  id: string; name: string; description: string | null; isSystem: boolean;
  permissions: Array<{ permission: { key: string; group: string; description: string } }>;
  _count: { staff: number };
}

export default async function RolesPage() {
  await requireStaff();
  const { t, locale } = await getI18n();
  const cookie = await getCookieHeader();
  const roles = await apiGet<Role[]>("/admin/roles", { cookie });

  return (
    <div>
      <PageHeader eyebrow="Administration" title="Roles & permissions" description="Permission matrix for every staff role." />
      <div className="grid gap-4 lg:grid-cols-2">
        {(roles ?? []).map((role) => (
          <section key={role.id} className="panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold capitalize">{enumLabel(locale, role.name)}</h2>
                <p className="mt-0.5 text-[10px] text-muted">{role.description} · {role._count.staff} {t("staff")}</p>
              </div>
              <span className="a-chip">{role.permissions.length} {t("permissions")}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {role.permissions.sort((a, b) => a.permission.key.localeCompare(b.permission.key)).map(({ permission }) => (
                <span key={permission.key} className="rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[9px] text-muted">{permission.key}</span>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="mt-4 text-[11px] leading-relaxed text-muted">
        {t("SUPER_ADMIN permissions cannot be reduced through the interface. Other roles can be updated via the roles API, with every change recorded in the audit log.")}
      </p>
    </div>
  );
}
