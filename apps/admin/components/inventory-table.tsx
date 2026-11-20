"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { clientApi } from "@/lib/api";

interface Row {
  variantId: string; warehouseId: string; sku: string; productId: string; productName: string;
  size: string | null; color: string | null; onHand: number; reserved: number; damaged: number;
  incoming: number; reorderPoint: number; available: number; warehouseName: string; warehouseCode: string;
}

interface WarehouseOption { id: string; name: string; code: string }

export function InventoryTable({ rows, warehouses }: { rows: Row[]; warehouses: WarehouseOption[] }) {
  const router = useRouter();
  const [modal, setModal] = useState<{ mode: "adjust" | "transfer"; row: Row } | null>(null);
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [type, setType] = useState("ADJUSTMENT");
  const [destination, setDestination] = useState("");
  const [quantity, setQuantity] = useState("");
  const [busy, setBusy] = useState(false);

  const open = (mode: "adjust" | "transfer", row: Row) => {
    setModal({ mode, row });
    setDelta("");
    setReason("");
    setType("ADJUSTMENT");
    setDestination(warehouses.find((w) => w.id !== row.warehouseId)?.id ?? "");
    setQuantity("");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!modal) return;
    setBusy(true);
    try {
      if (modal.mode === "adjust") {
        await clientApi("/admin/inventory/adjust", {
          method: "POST",
          body: JSON.stringify({
            variantId: modal.row.variantId,
            warehouseId: modal.row.warehouseId,
            quantityDelta: Number(delta),
            reason,
            type,
          }),
        });
        toast("Stock adjusted and movement recorded");
      } else {
        await clientApi("/admin/inventory/transfer", {
          method: "POST",
          body: JSON.stringify({
            variantId: modal.row.variantId,
            fromWarehouseId: modal.row.warehouseId,
            toWarehouseId: destination,
            quantity: Number(quantity),
            reason: reason || "Warehouse transfer",
          }),
        });
        toast("Transfer completed");
      }
      setModal(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update stock");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table>
            <thead><tr><th>Product</th><th>SKU</th><th>Size / colour</th><th>Warehouse</th><th>On hand</th><th>Reserved</th><th>Damaged</th><th>Available</th><th>Reorder</th><th /></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.variantId}-${row.warehouseId}`}>
                  <td><Link href={`/products/${row.productId}`} className="font-medium hover:underline">{row.productName}</Link></td>
                  <td className="font-mono text-[10px] text-muted">{row.sku}</td>
                  <td className="text-[11px] text-muted">{row.color ?? "—"} / {row.size ?? "—"}</td>
                  <td className="text-[11px]">{row.warehouseCode}</td>
                  <td>{row.onHand}</td>
                  <td className="text-muted">{row.reserved}</td>
                  <td className="text-muted">{row.damaged}</td>
                  <td className={row.available <= 0 ? "font-medium text-danger" : row.available <= row.reorderPoint ? "font-medium text-warn" : "font-medium"}>{row.available}</td>
                  <td className="text-muted">{row.reorderPoint}</td>
                  <td className="whitespace-nowrap text-right">
                    <button type="button" onClick={() => open("adjust", row)} className="text-[11px] underline">Adjust</button>
                    <button type="button" onClick={() => open("transfer", row)} className="ml-3 text-[11px] underline">Transfer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" role="dialog" aria-modal="true">
          <form onSubmit={submit} className="w-full max-w-md border border-line bg-panel p-6">
            <h2 className="text-base font-medium capitalize">{modal.mode} stock</h2>
            <p className="mt-1 text-xs text-muted">{modal.row.productName} · {modal.row.sku} · {modal.row.warehouseCode}</p>
            <div className="mt-4 space-y-4">
              {modal.mode === "adjust" ? (
                <>
                  <div>
                    <label className="label" htmlFor="delta">Quantity change</label>
                    <input id="delta" type="number" className="field" value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="e.g. 12 or -3" required />
                    <p className="mt-1 text-[10px] text-muted">Positive adds stock; negative removes. Stock cannot go below zero.</p>
                  </div>
                  <div>
                    <label className="label" htmlFor="type">Movement type</label>
                    <select id="type" className="field" value={type} onChange={(e) => setType(e.target.value)}>
                      {["ADJUSTMENT", "STOCK_IN", "STOCK_OUT", "DAMAGE", "RECONCILIATION"].map((value) => <option key={value} value={value}>{value.replace(/_/g, " ")}</option>)}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="label" htmlFor="dest">Destination warehouse</label>
                    <select id="dest" className="field" value={destination} onChange={(e) => setDestination(e.target.value)} required>
                      {warehouses.filter((w) => w.id !== modal.row.warehouseId).map((w) => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label" htmlFor="qty">Quantity</label>
                    <input id="qty" type="number" min="1" max={modal.row.available} className="field" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                    <p className="mt-1 text-[10px] text-muted">{modal.row.available} available to transfer.</p>
                  </div>
                </>
              )}
              <div>
                <label className="label" htmlFor="reason">Reason / reference</label>
                <input id="reason" className="field" value={reason} onChange={(e) => setReason(e.target.value)} required placeholder="Stock count, damaged return, transfer…" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className="a-btn a-btn-outline">Cancel</button>
              <button type="submit" disabled={busy} className="a-btn">{busy ? "Saving…" : "Record movement"}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
