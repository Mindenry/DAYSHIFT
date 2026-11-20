"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clientApi } from "@/lib/api";

const emptyCoupon = {
  code: "", description: "", type: "PERCENTAGE", value: "10", minOrderSubtotal: "0",
  maxDiscount: "", startsAt: new Date().toISOString().slice(0, 10),
  endsAt: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
  usageLimitTotal: "", usageLimitPerCustomer: "", firstOrderOnly: false, isActive: true,
};

export function CouponManager({ initial }: { initial: Array<{ id: string; code: string; description: string | null; type: string; value: string; minOrderSubtotal: string; startsAt: string; endsAt: string; isActive: boolean; firstOrderOnly: boolean; _count: { redemptions: number } }> }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyCoupon });
  const [busy, setBusy] = useState(false);

  return (
    <>
      <div className="mb-3 flex justify-end"><button type="button" className="a-btn" onClick={() => setOpen(true)}>New coupon</button></div>
      <div className="panel overflow-hidden">
        <table>
          <thead><tr><th>Code</th><th>Discount</th><th>Minimum</th><th>Window</th><th>Redemptions</th><th>Status</th><th /></tr></thead>
          <tbody>
            {initial.map((coupon) => (
              <tr key={coupon.id}>
                <td className="font-mono text-xs font-medium">{coupon.code}</td>
                <td className="text-xs">{coupon.type === "PERCENTAGE" ? `${Number(coupon.value)}%` : `$${Number(coupon.value).toFixed(2)}`}</td>
                <td className="text-xs">{Number(coupon.minOrderSubtotal) ? `$${Number(coupon.minOrderSubtotal).toFixed(2)}` : "None"}</td>
                <td className="text-[10px] text-muted">{new Date(coupon.startsAt).toLocaleDateString()} → {new Date(coupon.endsAt).toLocaleDateString()}</td>
                <td>{coupon._count.redemptions}</td>
                <td><span className={`text-[10px] uppercase ${coupon.isActive ? "text-accent" : "text-muted"}`}>{coupon.isActive ? "Active" : "Paused"}</span></td>
                <td className="text-right">
                  <button type="button" className="text-[11px] underline" onClick={async () => {
                    try {
                      await clientApi(`/admin/coupons/${coupon.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !coupon.isActive }) });
                      toast(coupon.isActive ? "Coupon paused" : "Coupon activated");
                      router.refresh();
                    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not update coupon"); }
                  }}>{coupon.isActive ? "Pause" : "Activate"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" role="dialog" aria-modal="true">
          <form className="w-full max-w-lg border border-line bg-panel p-6" onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            try {
              await clientApi("/admin/coupons", { method: "POST", body: JSON.stringify({
                code: form.code, description: form.description || undefined, type: form.type,
                value: Number(form.value), minOrderSubtotal: Number(form.minOrderSubtotal || 0),
                maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
                startsAt: form.startsAt, endsAt: form.endsAt,
                usageLimitTotal: form.usageLimitTotal ? Number(form.usageLimitTotal) : undefined,
                usageLimitPerCustomer: form.usageLimitPerCustomer ? Number(form.usageLimitPerCustomer) : undefined,
                firstOrderOnly: form.firstOrderOnly, isActive: form.isActive,
              }) });
              toast("Coupon created");
              setOpen(false);
              router.refresh();
            } catch (error) { toast.error(error instanceof Error ? error.message : "Could not create coupon"); }
            finally { setBusy(false); }
          }}>
            <h2 className="text-base font-medium">New coupon</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div><label className="label" htmlFor="code">Code</label><input id="code" className="field font-mono" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required /></div>
              <div><label className="label" htmlFor="type">Type</label><select id="type" className="field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed amount</option></select></div>
              <div><label className="label" htmlFor="value">Value</label><input id="value" type="number" min="0" step="0.01" className="field" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required /></div>
              <div><label className="label" htmlFor="min">Minimum spend</label><input id="min" type="number" min="0" className="field" value={form.minOrderSubtotal} onChange={(e) => setForm({ ...form, minOrderSubtotal: e.target.value })} /></div>
              <div><label className="label" htmlFor="max">Max discount</label><input id="max" type="number" min="0" className="field" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} /></div>
              <div><label className="label" htmlFor="limit">Total uses</label><input id="limit" type="number" min="1" className="field" value={form.usageLimitTotal} onChange={(e) => setForm({ ...form, usageLimitTotal: e.target.value })} /></div>
              <div><label className="label" htmlFor="per">Uses per customer</label><input id="per" type="number" min="1" className="field" value={form.usageLimitPerCustomer} onChange={(e) => setForm({ ...form, usageLimitPerCustomer: e.target.value })} /></div>
              <div><label className="label" htmlFor="start">Starts</label><input id="start" type="date" className="field" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} required /></div>
              <div><label className="label" htmlFor="end">Ends</label><input id="end" type="date" className="field" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} required /></div>
              <div className="sm:col-span-2"><label className="label" htmlFor="desc">Description</label><input id="desc" className="field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.firstOrderOnly} onChange={(e) => setForm({ ...form, firstOrderOnly: e.target.checked })} className="h-4 w-4 accent-[#3f5b4a]" /> First order only</label>
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 accent-[#3f5b4a]" /> Active</label>
            </div>
            <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="a-btn a-btn-outline">Cancel</button><button type="submit" disabled={busy} className="a-btn">{busy ? "Creating…" : "Create coupon"}</button></div>
          </form>
        </div>
      )}
    </>
  );
}

export function PromotionManager({ initial }: { initial: Array<{ id: string; name: string; type: string; value: string; scope: string; priority: number; isActive: boolean; startsAt: string; endsAt: string }> }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", type: "PERCENTAGE", value: "10", minSubtotal: "0", startsAt: new Date().toISOString().slice(0, 10), endsAt: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10), priority: "0", isActive: true });
  const [busy, setBusy] = useState(false);

  return (
    <>
      <div className="mb-3 flex justify-end"><button type="button" className="a-btn" onClick={() => setOpen(true)}>New promotion</button></div>
      <div className="panel overflow-hidden">
        <table>
          <thead><tr><th>Name</th><th>Discount</th><th>Scope</th><th>Priority</th><th>Window</th><th>Status</th><th /></tr></thead>
          <tbody>
            {initial.map((promo) => (
              <tr key={promo.id}>
                <td className="text-xs font-medium">{promo.name}</td>
                <td className="text-xs">{promo.type === "PERCENTAGE" ? `${Number(promo.value)}%` : `$${Number(promo.value).toFixed(2)}`}</td>
                <td className="text-[11px]">{promo.scope.toLowerCase()}</td>
                <td>{promo.priority}</td>
                <td className="text-[10px] text-muted">{new Date(promo.startsAt).toLocaleDateString()} → {new Date(promo.endsAt).toLocaleDateString()}</td>
                <td><span className={`text-[10px] uppercase ${promo.isActive ? "text-accent" : "text-muted"}`}>{promo.isActive ? "Active" : "Paused"}</span></td>
                <td className="text-right"><button type="button" className="text-[11px] underline" onClick={async () => {
                  try { await clientApi(`/admin/promotions/${promo.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !promo.isActive }) }); toast("Promotion updated"); router.refresh(); }
                  catch (error) { toast.error(error instanceof Error ? error.message : "Could not update promotion"); }
                }}>{promo.isActive ? "Pause" : "Activate"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="border-t border-line p-3 text-[10px] text-muted">
          Automatic promotions do not stack; the best single promotion is applied per order. Product, category and collection targeting is available through the API.
        </p>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" role="dialog" aria-modal="true">
          <form className="w-full max-w-lg border border-line bg-panel p-6" onSubmit={async (event) => {
            event.preventDefault(); setBusy(true);
            try {
              await clientApi("/admin/promotions", { method: "POST", body: JSON.stringify({
                name: form.name, description: form.description || undefined, type: form.type,
                value: Number(form.value), scope: "ALL", minSubtotal: Number(form.minSubtotal || 0),
                startsAt: form.startsAt, endsAt: form.endsAt, priority: Number(form.priority || 0), isActive: form.isActive,
              }) });
              toast("Promotion created"); setOpen(false); router.refresh();
            } catch (error) { toast.error(error instanceof Error ? error.message : "Could not create promotion"); }
            finally { setBusy(false); }
          }}>
            <h2 className="text-base font-medium">New automatic promotion</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="label" htmlFor="pname">Name</label><input id="pname" className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div><label className="label" htmlFor="ptype">Type</label><select id="ptype" className="field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed</option></select></div>
              <div><label className="label" htmlFor="pvalue">Value</label><input id="pvalue" type="number" step="0.01" className="field" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
              <div><label className="label" htmlFor="pmin">Minimum subtotal</label><input id="pmin" type="number" className="field" value={form.minSubtotal} onChange={(e) => setForm({ ...form, minSubtotal: e.target.value })} /></div>
              <div><label className="label" htmlFor="ppriority">Priority</label><input id="ppriority" type="number" className="field" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} /></div>
              <div><label className="label" htmlFor="pstart">Starts</label><input id="pstart" type="date" className="field" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></div>
              <div><label className="label" htmlFor="pend">Ends</label><input id="pend" type="date" className="field" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></div>
            </div>
            <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="a-btn a-btn-outline">Cancel</button><button type="submit" disabled={busy} className="a-btn">Create</button></div>
          </form>
        </div>
      )}
    </>
  );
}

export function LoyaltyAdjust({ accountId, current }: { accountId: string; current: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button type="button" className="text-[11px] underline" onClick={() => setOpen(true)}>Adjust</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" role="dialog" aria-modal="true">
          <form className="w-full max-w-sm border border-line bg-panel p-6" onSubmit={async (event) => {
            event.preventDefault(); setBusy(true);
            try {
              await clientApi(`/admin/loyalty/${accountId}/adjust`, { method: "POST", body: JSON.stringify({ points: Number(points), reason }) });
              toast("Points adjusted"); setOpen(false); router.refresh();
            } catch (error) { toast.error(error instanceof Error ? error.message : "Could not adjust points"); }
            finally { setBusy(false); }
          }}>
            <h2 className="text-base font-medium">Adjust loyalty points</h2>
            <p className="mt-1 text-xs text-muted">Current balance: {current} points</p>
            <div className="mt-4 space-y-3">
              <div><label className="label" htmlFor="points">Points (negative to deduct)</label><input id="points" type="number" className="field" value={points} onChange={(e) => setPoints(e.target.value)} required /></div>
              <div><label className="label" htmlFor="lreason">Reason</label><input id="lreason" className="field" value={reason} onChange={(e) => setReason(e.target.value)} required /></div>
            </div>
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="a-btn a-btn-outline">Cancel</button><button type="submit" disabled={busy} className="a-btn">Apply</button></div>
          </form>
        </div>
      )}
    </>
  );
}

export function StaffManager({ initial, roles, currentUserId }: { initial: Array<{ id: string; email: string; firstName: string; lastName: string; status: string; staffProfile: { role: { name: string }; jobTitle: string | null; isActive: boolean } | null }>; roles: string[]; currentUserId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "", password: "", roleName: "CUSTOMER_SUPPORT", jobTitle: "" });
  const [busy, setBusy] = useState(false);
  return (
    <>
      <div className="mb-3 flex justify-end"><button type="button" className="a-btn" onClick={() => setOpen(true)}>Invite staff</button></div>
      <div className="panel overflow-hidden">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Title</th><th>Status</th><th /></tr></thead>
          <tbody>
            {initial.map((member) => (
              <tr key={member.id}>
                <td className="text-xs font-medium">{member.firstName} {member.lastName}{member.id === currentUserId && <span className="ml-2 text-[9px] uppercase text-muted">you</span>}</td>
                <td className="text-[11px] text-muted">{member.email}</td>
                <td>
                  <select className="field !min-h-0 !py-1 text-[11px]" value={member.staffProfile?.role.name} onChange={async (event) => {
                    try { await clientApi(`/admin/staff/${member.id}`, { method: "PATCH", body: JSON.stringify({ roleName: event.target.value }) }); toast("Role updated"); router.refresh(); }
                    catch (error) { toast.error(error instanceof Error ? error.message : "Could not update role"); }
                  }}>
                    {roles.map((role) => <option key={role} value={role}>{role.replace(/_/g, " ")}</option>)}
                  </select>
                </td>
                <td className="text-[11px] text-muted">{member.staffProfile?.jobTitle ?? "—"}</td>
                <td><span className={`text-[10px] uppercase ${member.status === "ACTIVE" && member.staffProfile?.isActive ? "text-accent" : "text-danger"}`}>{member.status === "ACTIVE" && member.staffProfile?.isActive ? "Active" : "Disabled"}</span></td>
                <td className="text-right">
                  {member.id !== currentUserId && (
                    <button type="button" className="text-[11px] underline" onClick={async () => {
                      const next = !(member.status === "ACTIVE" && member.staffProfile?.isActive);
                      try { await clientApi(`/admin/staff/${member.id}`, { method: "PATCH", body: JSON.stringify({ isActive: next, status: next ? "ACTIVE" : "SUSPENDED" }) }); toast(next ? "Staff enabled" : "Staff disabled"); router.refresh(); }
                      catch (error) { toast.error(error instanceof Error ? error.message : "Could not update staff"); }
                    }}>{member.status === "ACTIVE" && member.staffProfile?.isActive ? "Disable" : "Enable"}</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" role="dialog" aria-modal="true">
          <form className="w-full max-w-md border border-line bg-panel p-6" onSubmit={async (event) => {
            event.preventDefault(); setBusy(true);
            try {
              await clientApi("/admin/staff", { method: "POST", body: JSON.stringify(form) });
              toast("Staff account created"); setOpen(false); router.refresh();
            } catch (error) { toast.error(error instanceof Error ? error.message : "Could not create staff"); }
            finally { setBusy(false); }
          }}>
            <h2 className="text-base font-medium">Create staff account</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div><label className="label" htmlFor="s-first">First name</label><input id="s-first" className="field" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></div>
              <div><label className="label" htmlFor="s-last">Last name</label><input id="s-last" className="field" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></div>
              <div className="sm:col-span-2"><label className="label" htmlFor="s-email">Email</label><input id="s-email" type="email" className="field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
              <div className="sm:col-span-2"><label className="label" htmlFor="s-password">Temporary password</label><input id="s-password" type="password" minLength={10} className="field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
              <div><label className="label" htmlFor="s-role">Role</label><select id="s-role" className="field" value={form.roleName} onChange={(e) => setForm({ ...form, roleName: e.target.value })}>{roles.map((role) => <option key={role} value={role}>{role.replace(/_/g, " ")}</option>)}</select></div>
              <div><label className="label" htmlFor="s-title">Job title</label><input id="s-title" className="field" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} /></div>
            </div>
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="a-btn a-btn-outline">Cancel</button><button type="submit" disabled={busy} className="a-btn">Create</button></div>
          </form>
        </div>
      )}
    </>
  );
}

export function SupplierManager({ initial }: { initial: Array<{ id: string; name: string; code: string; contactName: string | null; email: string | null; isActive: boolean; _count: { purchaseOrders: number } }> }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", contactName: "", email: "", phone: "", address: "", notes: "" });
  const [busy, setBusy] = useState(false);
  return (
    <>
      <div className="mb-3 flex justify-end"><button type="button" className="a-btn" onClick={() => setOpen(true)}>New supplier</button></div>
      <div className="panel overflow-hidden">
        <table>
          <thead><tr><th>Supplier</th><th>Code</th><th>Contact</th><th>Purchase orders</th><th>Status</th></tr></thead>
          <tbody>
            {initial.map((supplier) => (
              <tr key={supplier.id}>
                <td className="text-xs font-medium">{supplier.name}</td>
                <td className="font-mono text-[11px]">{supplier.code}</td>
                <td className="text-[11px] text-muted">{supplier.contactName ?? "—"} {supplier.email ?? ""}</td>
                <td>{supplier._count.purchaseOrders}</td>
                <td><span className={`text-[10px] uppercase ${supplier.isActive ? "text-accent" : "text-muted"}`}>{supplier.isActive ? "Active" : "Inactive"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" role="dialog" aria-modal="true">
          <form className="w-full max-w-md border border-line bg-panel p-6" onSubmit={async (event) => {
            event.preventDefault(); setBusy(true);
            try { await clientApi("/admin/suppliers", { method: "POST", body: JSON.stringify(form) }); toast("Supplier created"); setOpen(false); router.refresh(); }
            catch (error) { toast.error(error instanceof Error ? error.message : "Could not create supplier"); }
            finally { setBusy(false); }
          }}>
            <h2 className="text-base font-medium">New supplier</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div><label className="label" htmlFor="sup-name">Name</label><input id="sup-name" className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div><label className="label" htmlFor="sup-code">Code</label><input id="sup-code" className="field font-mono" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required /></div>
              <div><label className="label" htmlFor="sup-contact">Contact</label><input id="sup-contact" className="field" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></div>
              <div><label className="label" htmlFor="sup-email">Email</label><input id="sup-email" type="email" className="field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className="label" htmlFor="sup-address">Address</label><input id="sup-address" className="field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className="label" htmlFor="sup-notes">Notes</label><textarea id="sup-notes" rows={2} className="field" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="a-btn a-btn-outline">Cancel</button><button type="submit" disabled={busy} className="a-btn">Create</button></div>
          </form>
        </div>
      )}
    </>
  );
}

export function ReceivePurchaseOrder({ id, disabled }: { id: string; disabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button type="button" disabled={disabled || busy} className="a-btn a-btn-sm" onClick={async () => {
      if (!window.confirm("Receive all items? This writes stock-in movements for every line.")) return;
      setBusy(true);
      try { await clientApi(`/admin/purchase-orders/${id}/receive`, { method: "POST" }); toast("Purchase order received"); router.refresh(); }
      catch (error) { toast.error(error instanceof Error ? error.message : "Could not receive order"); }
      finally { setBusy(false); }
    }}>{busy ? "Receiving…" : "Receive"}</button>
  );
}
