"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clientApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n-client";

interface Variant {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  colorHex: string | null;
  isActive: boolean;
  priceOverride: string | null;
  inventory: Array<{ warehouse: { name: string; code: string }; onHand: number; reserved: number; damaged: number }>;
}

export function VariantManager({ productId, variants }: { productId: string; variants: Variant[] }) {
  const router = useRouter();
  const { t } = useI18n();
  const [rows, setRows] = useState(variants);
  const [busy, setBusy] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({ sku: "", size: "", color: "", colorHex: "#1A1917", initialStock: "0", priceOverride: "" });

  const available = (variant: Variant) =>
    variant.inventory.reduce((sum, row) => sum + Math.max(0, row.onHand - row.reserved - row.damaged), 0);

  const toggle = async (variant: Variant) => {
    setBusy(variant.id);
    try {
      await clientApi(`/admin/catalog/variants/${variant.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !variant.isActive }),
      });
      setRows(rows.map((row) => row.id === variant.id ? { ...row, isActive: !row.isActive } : row));
      toast(variant.isActive ? t("Variant deactivated") : t("Variant activated"));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Could not update variant"));
    } finally {
      setBusy(null);
    }
  };

  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy("add");
    try {
      await clientApi(`/admin/catalog/products/${productId}/variants`, {
        method: "POST",
        body: JSON.stringify({
          sku: draft.sku,
          size: draft.size || undefined,
          color: draft.color || undefined,
          colorHex: draft.colorHex || undefined,
          initialStock: Number(draft.initialStock || 0),
          priceOverride: draft.priceOverride ? Number(draft.priceOverride) : undefined,
        }),
      });
      toast(t("Variant added"));
      setShowAdd(false);
      setDraft({ sku: "", size: "", color: "", colorHex: "#1A1917", initialStock: "0", priceOverride: "" });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Could not add variant"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="panel mt-4 overflow-hidden">
      <div className="panel-header">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("Variants & stock")}</h2>
          <p className="mt-0.5 text-[10px] text-muted">{t("{count} variants · stock across warehouses", { count: rows.length })}</p>
        </div>
        <button type="button" onClick={() => setShowAdd(!showAdd)} className="a-btn a-btn-outline a-btn-sm">{t("Add variant")}</button>
      </div>

      {showAdd && (
        <form onSubmit={add} className="grid gap-2 border-b border-line bg-surface-2 p-4 sm:grid-cols-[1.4fr_0.7fr_0.7fr_0.6fr_0.6fr_auto]">
          <input className="field" placeholder={t("SKU")} value={draft.sku} onChange={(e) => setDraft({ ...draft, sku: e.target.value.toUpperCase() })} required />
          <input className="field" placeholder={t("Size")} value={draft.size} onChange={(e) => setDraft({ ...draft, size: e.target.value })} />
          <input className="field" placeholder={t("Colour")} value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} />
          <input type="color" className="h-9 w-full rounded-lg border border-line bg-white" value={draft.colorHex} onChange={(e) => setDraft({ ...draft, colorHex: e.target.value })} />
          <input type="number" min="0" className="field" placeholder={t("Stock")} value={draft.initialStock} onChange={(e) => setDraft({ ...draft, initialStock: e.target.value })} />
          <button type="submit" disabled={busy === "add"} className="a-btn a-btn-sm">{busy === "add" ? "…" : t("Add")}</button>
        </form>
      )}

      <div className="table-wrap">
        <table>
          <thead><tr><th>{t("SKU")}</th><th>{t("Size")}</th><th>{t("Colour")}</th><th>{t("Stock")}</th><th>{t("Warehouses")}</th><th>{t("Status")}</th><th /></tr></thead>
          <tbody>
            {rows.map((variant) => (
              <tr key={variant.id}>
                <td className="font-mono text-[11px]">{variant.sku}</td>
                <td>{variant.size ?? "—"}</td>
                <td>{variant.color ?? "—"}</td>
                <td className={`mono ${available(variant) <= 0 ? "text-danger" : ""}`}>{available(variant)}</td>
                <td className="text-[10px] text-muted">
                  {variant.inventory.map((row) => `${row.warehouse.code}: ${row.onHand - row.reserved - row.damaged}`).join(" · ") || "—"}
                </td>
                <td><span className={`text-[10px] font-semibold uppercase tracking-[0.06em] ${variant.isActive ? "text-accent" : "text-muted"}`}>{variant.isActive ? t("Active") : t("Inactive")}</span></td>
                <td className="text-right">
                  <button type="button" onClick={() => toggle(variant)} disabled={busy === variant.id} className="a-link">
                    {variant.isActive ? t("Deactivate") : t("Activate")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
