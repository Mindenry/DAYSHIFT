import { PageHeader } from "@/components/ui";
import { apiGet } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";
import { WarehouseManager } from "@/components/warehouse-manager";

export default async function WarehousesPage() {
  await requireStaff();
  const cookie = await getCookieHeader();
  const warehouses = await apiGet<Array<{ id: string; name: string; code: string; line1: string; city: string; state: string | null; postalCode: string; country: string; phone: string | null; isActive: boolean; isDefault: boolean; _count: { inventory: number } }>>(
    "/admin/warehouses",
    { cookie },
  );
  return (
    <div>
      <PageHeader eyebrow="Inventory" title="Warehouses" description="Locations that hold and ship stock." />
      <WarehouseManager initial={warehouses ?? []} />
    </div>
  );
}
