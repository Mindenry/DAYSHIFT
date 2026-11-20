"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clientApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n-client";
import { Modal, FormActions } from "./modal";

interface Warehouse {
  id: string; name: string; code: string; line1: string; city: string; state: string | null;
  postalCode: string; country: string; phone: string | null; isActive: boolean; isDefault: boolean;
  _count?: { inventory: number };
}

const empty = {
  name: "", code: "", line1: "", city: "", state: "", postalCode: "", country: "US",
  phone: "", isActive: true, isDefault: false,
};

export function WarehouseManager({ initial }: { initial: Warehouse[] }) {
  const router = useRouter();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [busy, setBusy] = useState(false);

  const start = (warehouse?: Warehouse) => {
    setEditing(warehouse ?? null);
    setForm(warehouse ? {
      name: warehouse.name, code: warehouse.code, line1: warehouse.line1, city: warehouse.city,
      state: warehouse.state ?? "", postalCode: warehouse.postalCode, country: warehouse.country,
      phone: warehouse.phone ?? "", isActive: warehouse.isActive, isDefault: warehouse.isDefault,
    } : { ...empty });
    setOpen(true);
  };

  return (
    <>
      <div className="mb-3 flex justify-end"><button type="button" className="a-btn" onClick={() => start()}>{t("New warehouse")}</button></div>
      <div className="panel overflow-hidden">
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t("Warehouse")}</th><th>{t("Code")}</th><th>{t("Location")}</th><th>{t("Stock lines")}</th><th>{t("Status")}</th><th /></tr></thead>
            <tbody>
              {initial.map((warehouse) => (
                <tr key={warehouse.id}>
                  <td className="font-medium">{warehouse.name}{warehouse.isDefault && <span className="ml-2 rounded-full border border-accent/20 bg-accent-soft px-1.5 py-0.5 text-[9px] uppercase text-accent">{t("Default")}</span>}</td>
                  <td className="font-mono text-[11px]">{warehouse.code}</td>
                  <td className="text-[11px] text-muted">{warehouse.city}, {warehouse.country}</td>
                  <td className="mono">{warehouse._count?.inventory ?? 0}</td>
                  <td><span className={`text-[10px] font-semibold uppercase ${warehouse.isActive ? "text-accent" : "text-muted"}`}>{warehouse.isActive ? t("Active") : t("Inactive")}</span></td>
                  <td className="text-right"><button type="button" className="a-link" onClick={() => start(warehouse)}>{t("Edit")}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <Modal title={editing ? "Edit warehouse" : "New warehouse"} onClose={() => setOpen(false)}>
          <form onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            try {
              if (editing) await clientApi(`/admin/warehouses/${editing.id}`, { method: "PATCH", body: JSON.stringify(form) });
              else await clientApi("/admin/warehouses", { method: "POST", body: JSON.stringify(form) });
              toast(editing ? t("Warehouse updated") : t("Warehouse created"));
              setOpen(false);
              router.refresh();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : t("Could not save warehouse"));
            } finally {
              setBusy(false);
            }
          }}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="label" htmlFor="w-name">{t("Name")}</label><input id="w-name" className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div><label className="label" htmlFor="w-code">{t("Code")}</label><input id="w-code" className="field font-mono text-xs" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required /></div>
              <div className="sm:col-span-2"><label className="label" htmlFor="w-line1">{t("Address")}</label><input id="w-line1" className="field" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} required /></div>
              <div><label className="label" htmlFor="w-city">{t("City")}</label><input id="w-city" className="field" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required /></div>
              <div><label className="label" htmlFor="w-state">{t("State / region")}</label><input id="w-state" className="field" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
              <div><label className="label" htmlFor="w-postal">{t("Postal code")}</label><input id="w-postal" className="field" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} required /></div>
              <div><label className="label" htmlFor="w-country">{t("Country (2)")}</label><input id="w-country" className="field" maxLength={2} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase() })} required /></div>
              <div className="sm:col-span-2"><label className="label" htmlFor="w-phone">{t("Phone")}</label><input id="w-phone" className="field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 accent-[#2f6b4f]" /> {t("Active")}</label>
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="h-4 w-4 accent-[#2f6b4f]" /> {t("Default warehouse")}</label>
            </div>
            <FormActions busy={busy} onCancel={() => setOpen(false)} submitLabel="Save warehouse" />
          </form>
        </Modal>
      )}
    </>
  );
}
