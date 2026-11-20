import { PageHeader, Badge, EmptyState } from "@/components/ui";
import { apiGet, money, date } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";
import { ReceivePurchaseOrder } from "@/components/admin-forms";

interface PO {
  id: string; poNumber: string; status: string; expectedAt: string | null; subtotal: string;
  receivedAt: string | null; supplier: { name: string }; warehouse: { name: string; code: string };
  items: Array<{ id: string; quantity: number; receivedQuantity: number; unitCost: string; variant: { sku: string; size: string | null; color: string | null } }>;
}

export default async function PurchaseOrdersPage() {
  await requireStaff();
  const cookie = await getCookieHeader();
  const orders = await apiGet<PO[]>("/admin/purchase-orders", { cookie });

  return (
    <div>
      <PageHeader eyebrow="Inventory" title="Purchase orders" description="Replenishment from suppliers. Receiving writes stock-in movements for every line." />
      <div className="panel overflow-hidden">
        {!orders?.length ? <EmptyState title="No purchase orders" body="Create purchase orders through the purchasing API; receiving is handled here." /> : (
          <table>
            <thead><tr><th>PO</th><th>Supplier</th><th>Warehouse</th><th>Items</th><th className="text-right">Subtotal</th><th>Expected</th><th>Status</th><th /></tr></thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="font-mono text-[11px] font-medium">{order.poNumber}</td>
                  <td className="text-xs">{order.supplier.name}</td>
                  <td className="text-[11px]">{order.warehouse.code}</td>
                  <td className="text-[11px]">{order.items.map((item) => `${item.variant.sku} × ${item.quantity}`).join(", ")}</td>
                  <td className="text-right">{money(order.subtotal)}</td>
                  <td className="text-[11px] text-muted">{date(order.expectedAt)}</td>
                  <td><Badge status={order.status} /></td>
                  <td className="text-right">
                    <ReceivePurchaseOrder id={order.id} disabled={["RECEIVED", "CANCELLED"].includes(order.status)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
