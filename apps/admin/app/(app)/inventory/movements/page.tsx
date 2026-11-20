import Link from "next/link";
import { PageHeader, EmptyState } from "@/components/ui";
import { apiGet, dateTime } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";

interface Movement {
  id: string;
  type: string;
  quantity: number;
  previousOnHand: number;
  newOnHand: number;
  reason: string | null;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
  variant: { sku: string; size: string | null; color: string | null; product: { name: string } };
  warehouse: { name: string; code: string };
}

export default async function MovementsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireStaff();
  const params = await searchParams;
  const variantId = typeof params.variantId === "string" ? params.variantId : "";
  const cookie = await getCookieHeader();
  const movements = await apiGet<Movement[]>(
    `/admin/inventory/movements${variantId ? `?variantId=${variantId}` : ""}`,
    { cookie },
  );

  return (
    <div>
      <PageHeader
        eyebrow="Inventory"
        title="Movement history"
        description="Every stock change is recorded with its reason, reference and resulting balance."
        back={{ href: "/inventory", label: "Stock" }}
      />
      <div className="panel overflow-hidden">
        {!movements?.length ? (
          <EmptyState title="No movements recorded" />
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead><tr><th>When</th><th>Product</th><th>SKU</th><th>Warehouse</th><th>Type</th><th className="text-right">Change</th><th className="text-right">On hand</th><th>Reason</th><th>Reference</th></tr></thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id}>
                    <td className="whitespace-nowrap text-[11px] text-muted">{dateTime(movement.createdAt)}</td>
                    <td className="text-xs">{movement.variant.product.name}</td>
                    <td className="font-mono text-[10px] text-muted">{movement.variant.sku}</td>
                    <td className="text-[11px]">{movement.warehouse.code}</td>
                    <td className="text-[10px] uppercase tracking-[0.05em]">{movement.type.replace(/_/g, " ")}</td>
                    <td className={`text-right font-medium ${movement.quantity < 0 ? "text-danger" : "text-accent"}`}>{movement.quantity > 0 ? "+" : ""}{movement.quantity}</td>
                    <td className="text-right text-[11px] text-muted">{movement.previousOnHand} → {movement.newOnHand}</td>
                    <td className="max-w-56 truncate text-[11px] text-muted">{movement.reason ?? "—"}</td>
                    <td className="text-[10px] text-muted">{movement.referenceType ?? "—"}{movement.referenceId ? ` · ${movement.referenceId.slice(0, 12)}` : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="mt-3 text-[11px] text-muted">
        Showing the latest 200 movements. <Link href="/inventory" className="underline">Back to stock</Link>.
      </p>
    </div>
  );
}
