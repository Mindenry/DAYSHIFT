"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { clientApi } from "@/lib/api";

interface Address {
  id: string;
  label: string | null;
  firstName: string;
  lastName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  phone: string | null;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

const empty = {
  label: "",
  firstName: "",
  lastName: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "US",
  phone: "",
  isDefaultShipping: false,
  isDefaultBilling: false,
};

export function AddressesView() {
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      setAddresses(await clientApi<Address[]>("/account/addresses"));
    } catch {
      setAddresses([]);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const startAdd = () => {
    setEditing(null);
    setForm({ ...empty });
    setOpen(true);
  };

  const startEdit = (address: Address) => {
    setEditing(address.id);
    setForm({
      label: address.label ?? "",
      firstName: address.firstName,
      lastName: address.lastName,
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      state: address.state ?? "",
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone ?? "",
      isDefaultShipping: address.isDefaultShipping,
      isDefaultBilling: address.isDefaultBilling,
    });
    setOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (editing) {
        await clientApi(`/account/addresses/${editing}`, { method: "PATCH", body: JSON.stringify(form) });
        toast("Address updated");
      } else {
        await clientApi("/account/addresses", { method: "POST", body: JSON.stringify(form) });
        toast("Address saved");
      }
      setOpen(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save address");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Remove this address?")) return;
    try {
      await clientApi(`/account/addresses/${id}`, { method: "DELETE" });
      toast("Address removed");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove address");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between border-b border-line pb-4">
        <p className="text-sm text-muted">Saved delivery addresses</p>
        <button type="button" onClick={startAdd} className="btn btn-outline !min-h-10 !px-4">Add address</button>
      </div>

      {addresses === null ? (
        <div className="mt-6 h-40 animate-pulse bg-sand" />
      ) : addresses.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-display text-2xl">No saved addresses yet.</p>
          <p className="mt-2 text-sm text-muted">Add one to speed up your next checkout.</p>
          <button type="button" onClick={startAdd} className="btn btn-primary mt-6">Add an address</button>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <li key={address.id} className="border border-line p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="overline text-muted">{address.label || "Address"}</p>
                <div className="flex gap-2 text-[10px] uppercase tracking-[0.08em]">
                  {address.isDefaultShipping && <span className="border border-line px-2 py-0.5">Default</span>}
                </div>
              </div>
              <address className="mt-3 text-sm not-italic leading-relaxed">
                {address.firstName} {address.lastName}<br />
                {address.line1}<br />
                {address.line2 && <>{address.line2}<br /></>}
                {address.city}{address.state ? `, ${address.state}` : ""} {address.postalCode}<br />
                {address.country}
                {address.phone && <><br />{address.phone}</>}
              </address>
              <div className="mt-4 flex gap-4 text-[11px] uppercase tracking-[0.1em]">
                <button type="button" onClick={() => startEdit(address)} className="underline">Edit</button>
                <button type="button" onClick={() => remove(address.id)} className="text-muted underline">Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" role="dialog" aria-modal="true" aria-label="Address form">
          <form onSubmit={save} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-paper p-6 md:p-8">
            <div className="flex items-start justify-between">
              <h2 className="font-display text-3xl">{editing ? "Edit address" : "Add an address"}</h2>
              <button type="button" onClick={() => setOpen(false)} className="text-sm underline">Close</button>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label htmlFor="label" className="label">Label (optional)</label>
                <input id="label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="field" placeholder="Home, studio…" />
              </div>
              <div>
                <label htmlFor="a-first" className="label">First name</label>
                <input id="a-first" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="field" />
              </div>
              <div>
                <label htmlFor="a-last" className="label">Last name</label>
                <input id="a-last" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="field" />
              </div>
              <div className="col-span-2">
                <label htmlFor="a-line1" className="label">Address</label>
                <input id="a-line1" required value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} className="field" />
              </div>
              <div className="col-span-2">
                <label htmlFor="a-line2" className="label">Apartment (optional)</label>
                <input id="a-line2" value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} className="field" />
              </div>
              <div>
                <label htmlFor="a-city" className="label">City</label>
                <input id="a-city" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="field" />
              </div>
              <div>
                <label htmlFor="a-state" className="label">State / region</label>
                <input id="a-state" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="field" />
              </div>
              <div>
                <label htmlFor="a-postal" className="label">Postal code</label>
                <input id="a-postal" required value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} className="field" />
              </div>
              <div>
                <label htmlFor="a-country" className="label">Country</label>
                <input id="a-country" required minLength={2} maxLength={2} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase() })} className="field" />
              </div>
              <div className="col-span-2">
                <label htmlFor="a-phone" className="label">Phone (optional)</label>
                <input id="a-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="field" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <label className="flex items-center gap-3 text-sm">
                <input type="checkbox" checked={form.isDefaultShipping} onChange={(e) => setForm({ ...form, isDefaultShipping: e.target.checked })} className="h-4 w-4 accent-[#1a1917]" />
                Use as default delivery address
              </label>
              <label className="flex items-center gap-3 text-sm">
                <input type="checkbox" checked={form.isDefaultBilling} onChange={(e) => setForm({ ...form, isDefaultBilling: e.target.checked })} className="h-4 w-4 accent-[#1a1917]" />
                Use as default billing address
              </label>
            </div>
            <button type="submit" disabled={busy} className="btn btn-primary mt-6 w-full">{busy ? "Saving…" : "Save address"}</button>
          </form>
        </div>
      )}
    </div>
  );
}
