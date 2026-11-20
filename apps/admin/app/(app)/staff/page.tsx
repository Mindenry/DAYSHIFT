import { PageHeader } from "@/components/ui";
import { apiGet } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";
import { StaffManager } from "@/components/admin-forms";

export default async function StaffPage() {
  const session = await requireStaff();
  const cookie = await getCookieHeader();
  const [staff, roles] = await Promise.all([
    apiGet<Array<{ id: string; email: string; firstName: string; lastName: string; status: string; staffProfile: { role: { name: string }; jobTitle: string | null; isActive: boolean } | null }>>(
      "/admin/staff",
      { cookie },
    ),
    apiGet<Array<{ id: string; name: string }>>("/admin/roles", { cookie }),
  ]);
  return (
    <div>
      <PageHeader eyebrow="Administration" title="Staff" description="Team accounts and their roles." />
      <StaffManager initial={staff ?? []} roles={(roles ?? []).map((role) => role.name)} currentUserId={session?.id ?? ""} />
    </div>
  );
}
