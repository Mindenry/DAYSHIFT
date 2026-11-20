import Link from "next/link";
import { PageHeader, Pagination, EmptyState } from "@/components/ui";
import { apiGet } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";
import { getI18n } from "@/lib/i18n";
import { InventoryTable } from "@/components/inventory-table";

interface InventoryResponse {
  items: Array<{
    variantId: string; warehouseId: string; sku: string; productId: string; productName: string;
    size: string | null; color: string | null; onHand: number; reserved: number; damaged: number;
    incoming: number; reorderPoint: number; available: number; warehouseName: string; warehouseCode: string;
  }>;
  meta: { page: number; total: number; totalPages: number };
}

interface Warehouse { id: string; name: string; code: string }

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaff();
  const { t } = await getI18n();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const warehouseId = typeof params.warehouseId === "string" ? params.warehouseId : "";
  const lowStock = typeof params.lowStock === "string" ? params.lowStock : "";
  const page = typeof params.page === "string" ? params.page : "1";
  const cookie = await getCookieHeader();
  const query = new URLSearchParams({ page, pageSize: "30" });
  if (q) query.set("q", q);
  if (warehouseId) query.set("warehouseId", warehouseId);
  if (lowStock) query.set("lowStock", lowStock);

  const [inventory, warehouses] = await Promise.all([
    apiGet<InventoryResponse>(`/admin/inventory?${query.toString()}`, { cookie }),
    apiGet<Warehouse[]>("/admin/warehouses", { cookie }),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Inventory"
        title="Stock"
        description="Stock levels across warehouses, with a full movement history."
        actions={<Link href="/inventory/movements" className="a-btn a-btn-outline">{t("Movement history")}</Link>}
      />
      <div className="panel">
        <form method="get" className="flex flex-wrap items-end gap-2 border-b border-line p-3">
          <div className="min-w-52 flex-1">
            <label htmlFor="q" className="label">{t("Search")}</label>
            <input id="q" name="q" defaultValue={q} placeholder={t("Product, SKU or colour")} className="field" />
          </div>
          <div>
            <label htmlFor="warehouse" className="label">{t("Warehouse")}</label>
            <select id="warehouse" name="warehouseId" defaultValue={warehouseId} className="field">
              <option value="">{t("All warehouses")}</option>
              {(warehouses ?? []).map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
            </select>
          </div>
          <label className="flex h-9 items-center gap-2 text-xs">
            <input type="checkbox" name="lowStock" value="true" defaultChecked={lowStock === "true"} className="h-4 w-4 accent-[#2f6b4f]" />
            {t("Low stock only")}
          </label>
          <button type="submit" className="a-btn a-btn-outline">{t("Filter")}</button>
          {(q || warehouseId || lowStock) && <Link href="/inventory" className="a-btn a-btn-outline">{t("Reset")}</Link>}
        </form>
        {!inventory?.items.length ? (
          <EmptyState title="No stock lines found" body="Try a different filter." />
        ) : (
          <>
            <InventoryTable rows={inventory.items} warehouses={warehouses ?? []} />
            <Pagination page={inventory.meta.page} totalPages={inventory.meta.totalPages} basePath="/inventory" params={{ q, warehouseId, lowStock }} />
          </>
        )}
      </div>
    </div>
  );
}
