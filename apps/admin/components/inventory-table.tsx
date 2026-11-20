"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { clientApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n-client";
import { enumLabel } from "@/lib/messages";
import { Modal, FormActions } from "./modal";

interface Row {
  variantId: string; warehouseId: string; sku: string; productId: string; productName: string;
  size: string | null; color: string | null; onHand: number; reserved: number; damaged: number;
  incoming: number; reorderPoint: number; available: number; warehouseName: string; warehouseCode: string;
}

interface WarehouseOption { id: string; name: string; code: string }

export function InventoryTable({ rows, warehouses }: { rows: Row[]; warehouses: WarehouseOption[] }) {
  const router = useRouter();
  const { t, locale } = useI18n();
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
        toast(t("Stock adjusted and movement recorded"));
      } else {
        await clientApi("/admin/inventory/transfer", {
          method: "POST",
          body: JSON.stringify({
            variantId: modal.row.variantId,
            fromWarehouseId: modal.row.warehouseId,
            toWarehouseId: destination,
            quantity: Number(quantity),
            reason: reason || t("Warehouse transfer"),
          }),
        });
        toast(t("Transfer completed"));
      }
      setModal(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Could not update stock"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="panel overflow-hidden">
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t("Product")}</th><th>{t("SKU")}</th><th>{t("Size / colour")}</th><th>{t("Warehouse")}</th><th>{t("On hand")}</th><th>{t("Reserved")}</th><th>{t("Damaged")}</th><th>{t("Available")}</th><th>{t("Reorder")}</th><th /></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.variantId}-${row.warehouseId}`}>
                  <td><Link href={`/products/${row.productId}`} className="font-medium hover:underline">{row.productName}</Link></td>
                  <td className="font-mono text-[10px] text-muted">{row.sku}</td>
                  <td className="text-[11px] text-muted">{row.color ?? "—"} / {row.size ?? "—"}</td>
                  <td className="text-[11px]">{row.warehouseCode}</td>
                  <td className="mono">{row.onHand}</td>
                  <td className="text-muted mono">{row.reserved}</td>
                  <td className="text-muted mono">{row.damaged}</td>
                  <td className={`mono ${row.available <= 0 ? "font-semibold text-danger" : row.available <= row.reorderPoint ? "font-semibold text-warn" : "font-semibold"}`}>{row.available}</td>
                  <td className="text-muted mono">{row.reorderPoint}</td>
                  <td className="whitespace-nowrap text-right">
                    <button type="button" onClick={() => open("adjust", row)} className="a-link">{t("Adjust")}</button>
                    <button type="button" onClick={() => open("transfer", row)} className="ml-3 a-link">{t("Transfer")}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title={modal.mode === "adjust" ? "Adjust stock" : "Transfer stock"} onClose={() => setModal(null)}>
          <form onSubmit={submit}>
            <p className="text-xs text-muted">{modal.row.productName} · {modal.row.sku} · {modal.row.warehouseCode}</p>
            <div className="mt-4 space-y-4">
              {modal.mode === "adjust" ? (
                <>
                  <div>
                    <label className="label" htmlFor="delta">{t("Quantity change")}</label>
                    <input id="delta" type="number" className="field" value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="e.g. 12 or -3" required />
                    <p className="mt-1 text-[10px] leading-relaxed text-muted">{t("Positive adds stock; negative removes. Stock cannot go below zero.")}</p>
                  </div>
                  <div>
                    <label className="label" htmlFor="type">{t("Movement type")}</label>
                    <select id="type" className="field" value={type} onChange={(e) => setType(e.target.value)}>
                      {["ADJUSTMENT", "STOCK_IN", "STOCK_OUT", "DAMAGE", "RECONCILIATION"].map((value) => <option key={value} value={value}>{enumLabel(locale, value)}</option>)}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="label" htmlFor="dest">{t("Destination warehouse")}</label>
                    <select id="dest" className="field" value={destination} onChange={(e) => setDestination(e.target.value)} required>
                      {warehouses.filter((w) => w.id !== modal.row.warehouseId).map((w) => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label" htmlFor="qty">{t("Quantity")}</label>
                    <input id="qty" type="number" min="1" max={modal.row.available} className="field" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                    <p className="mt-1 text-[10px] text-muted">{t("{count} available to transfer.", { count: modal.row.available })}</p>
                  </div>
                </>
              )}
              <div>
                <label className="label" htmlFor="reason">{t("Reason / reference")}</label>
                <input id="reason" className="field" value={reason} onChange={(e) => setReason(e.target.value)} required placeholder={t("Stock count, damaged return, transfer…")} />
              </div>
            </div>
            <FormActions busy={busy} onCancel={() => setModal(null)} submitLabel="Record movement" />
          </form>
        </Modal>
      )}
    </>
  );
}
