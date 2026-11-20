import { PageHeader } from "@/components/ui";
import { apiGet } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";

interface Role {
  id: string; name: string; description: string | null; isSystem: boolean;
  permissions: Array<{ permission: { key: string; group: string; description: string } }>;
  _count: { staff: number };
}

export default async function RolesPage() {
  await requireStaff();
  const cookie = await getCookieHeader();
  const roles = await apiGet<Role[]>("/admin/roles", { cookie });

  return (
    <div>
      <PageHeader eyebrow="Administration" title="Roles & permissions" description="Permissions are enforced on the API for every staff request. The interface hides actions a role cannot perform, but never relies on that alone." />
      <div className="grid gap-4 lg:grid-cols-2">
        {(roles ?? []).map((role) => (
          <section key={role.id} className="panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-medium capitalize">{role.name.replace(/_/g, " ").toLowerCase()}</h2>
                <p className="mt-0.5 text-[10px] text-muted">{role.description} · {role._count.staff} staff</p>
              </div>
              <span className="border border-line px-2 py-0.5 text-[9px] uppercase tracking-[0.08em] text-muted">{role.permissions.length} permissions</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {role.permissions.sort((a, b) => a.permission.key.localeCompare(b.permission.key)).map(({ permission }) => (
                <span key={permission.key} className="border border-line bg-white px-1.5 py-0.5 font-mono text-[9px] text-muted">{permission.key}</span>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="mt-4 text-[11px] text-muted">
        SUPER_ADMIN permissions cannot be reduced through the interface. Other roles can be updated via
        the roles API, with every change recorded in the audit log.
      </p>
    </div>
  );
}
