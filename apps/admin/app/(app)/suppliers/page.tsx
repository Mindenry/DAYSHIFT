import { PageHeader } from "@/components/ui";
import { apiGet } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";
import { SupplierManager } from "@/components/admin-forms";

export default async function SuppliersPage() {
  await requireStaff();
  const cookie = await getCookieHeader();
  const suppliers = await apiGet<Array<{ id: string; name: string; code: string; contactName: string | null; email: string | null; isActive: boolean; _count: { purchaseOrders: number } }>>(
    "/admin/suppliers",
    { cookie },
  );
  return (
    <div>
      <PageHeader eyebrow="Inventory" title="Suppliers" description="Vendors and lead times for purchasing." />
      <SupplierManager initial={suppliers ?? []} />
    </div>
  );
}
