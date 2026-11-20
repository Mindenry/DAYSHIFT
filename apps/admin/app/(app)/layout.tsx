import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/session";
import { AdminShell } from "@/components/admin-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getStaffSession();
  if (!session) redirect("/login");
  return (
    <AdminShell
      user={{
        firstName: session.firstName,
        lastName: session.lastName,
        email: session.email,
        staffRole: session.staffRole,
        permissions: session.permissions,
      }}
    >
      {children}
    </AdminShell>
  );
}
