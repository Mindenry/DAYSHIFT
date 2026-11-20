"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clientApi } from "@/lib/api";

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
      <div className="mb-3 flex justify-end"><button type="button" className="a-btn" onClick={() => start()}>New warehouse</button></div>
      <div className="panel overflow-hidden">
        <table>
          <thead><tr><th>Warehouse</th><th>Code</th><th>Location</th><th>Stock lines</th><th>Status</th><th /></tr></thead>
          <tbody>
            {initial.map((warehouse) => (
              <tr key={warehouse.id}>
                <td className="font-medium">{warehouse.name}{warehouse.isDefault && <span className="ml-2 border border-line px-1.5 py-0.5 text-[9px] uppercase text-muted">Default</span>}</td>
                <td className="font-mono text-[11px]">{warehouse.code}</td>
                <td className="text-[11px] text-muted">{warehouse.city}, {warehouse.country}</td>
                <td>{warehouse._count?.inventory ?? 0}</td>
                <td><span className={`text-[10px] uppercase ${warehouse.isActive ? "text-accent" : "text-muted"}`}>{warehouse.isActive ? "Active" : "Inactive"}</span></td>
                <td className="text-right"><button type="button" className="text-[11px] underline" onClick={() => start(warehouse)}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" role="dialog" aria-modal="true">
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              try {
                if (editing) await clientApi(`/admin/warehouses/${editing.id}`, { method: "PATCH", body: JSON.stringify(form) });
                else await clientApi("/admin/warehouses", { method: "POST", body: JSON.stringify(form) });
                toast(editing ? "Warehouse updated" : "Warehouse created");
                setOpen(false);
                router.refresh();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Could not save warehouse");
              } finally {
                setBusy(false);
              }
            }}
            className="w-full max-w-lg border border-line bg-panel p-6"
          >
            <h2 className="text-base font-medium">{editing ? "Edit warehouse" : "New warehouse"}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><label className="label" htmlFor="w-name">Name</label><input id="w-name" className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div><label className="label" htmlFor="w-code">Code</label><input id="w-code" className="field font-mono text-xs" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required /></div>
              <div className="sm:col-span-2"><label className="label" htmlFor="w-line1">Address</label><input id="w-line1" className="field" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} required /></div>
              <div><label className="label" htmlFor="w-city">City</label><input id="w-city" className="field" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required /></div>
              <div><label className="label" htmlFor="w-state">State / region</label><input id="w-state" className="field" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
              <div><label className="label" htmlFor="w-postal">Postal code</label><input id="w-postal" className="field" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} required /></div>
              <div><label className="label" htmlFor="w-country">Country (2)</label><input id="w-country" className="field" maxLength={2} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase() })} required /></div>
              <div className="sm:col-span-2"><label className="label" htmlFor="w-phone">Phone</label><input id="w-phone" className="field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div className="mt-4 flex gap-6">
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 accent-[#3f5b4a]" /> Active</label>
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="h-4 w-4 accent-[#3f5b4a]" /> Default warehouse</label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="a-btn a-btn-outline">Cancel</button>
              <button type="submit" disabled={busy} className="a-btn">{busy ? "Saving…" : "Save warehouse"}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
