"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clientApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n-client";
import { enumLabel } from "@/lib/messages";
import { Modal, FormActions } from "./modal";

const emptyCoupon = {
  code: "", description: "", type: "PERCENTAGE", value: "10", minOrderSubtotal: "0",
  maxDiscount: "", startsAt: new Date().toISOString().slice(0, 10),
  endsAt: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
  usageLimitTotal: "", usageLimitPerCustomer: "", firstOrderOnly: false, isActive: true,
};

export function CouponManager({ initial }: { initial: Array<{ id: string; code: string; description: string | null; type: string; value: string; minOrderSubtotal: string; startsAt: string; endsAt: string; isActive: boolean; firstOrderOnly: boolean; _count: { redemptions: number } }> }) {
  const router = useRouter();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyCoupon });
  const [busy, setBusy] = useState(false);

  return (
    <>
      <div className="mb-3 flex justify-end"><button type="button" className="a-btn" onClick={() => setOpen(true)}>{t("New coupon")}</button></div>
      <div className="panel overflow-hidden">
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t("Code")}</th><th>{t("Discount")}</th><th>{t("Minimum")}</th><th>{t("Window")}</th><th>{t("Redemptions")}</th><th>{t("Status")}</th><th /></tr></thead>
            <tbody>
              {initial.map((coupon) => (
                <tr key={coupon.id}>
                  <td className="font-mono text-xs font-semibold">{coupon.code}</td>
                  <td className="text-xs">{coupon.type === "PERCENTAGE" ? `${Number(coupon.value)}%` : `$${Number(coupon.value).toFixed(2)}`}</td>
                  <td className="text-xs">{Number(coupon.minOrderSubtotal) ? `$${Number(coupon.minOrderSubtotal).toFixed(2)}` : t("None")}</td>
                  <td className="text-[10px] text-muted">{new Date(coupon.startsAt).toLocaleDateString()} → {new Date(coupon.endsAt).toLocaleDateString()}</td>
                  <td className="mono">{coupon._count.redemptions}</td>
                  <td><span className={`text-[10px] font-semibold uppercase ${coupon.isActive ? "text-accent" : "text-muted"}`}>{coupon.isActive ? t("Active") : t("Paused")}</span></td>
                  <td className="text-right">
                    <button type="button" className="a-link" onClick={async () => {
                      try {
                        await clientApi(`/admin/coupons/${coupon.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !coupon.isActive }) });
                        toast(coupon.isActive ? t("Coupon paused") : t("Coupon activated"));
                        router.refresh();
                      } catch (error) { toast.error(error instanceof Error ? error.message : t("Could not update coupon")); }
                    }}>{coupon.isActive ? t("Pause") : t("Activate")}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <Modal title="New coupon" onClose={() => setOpen(false)}>
          <form onSubmit={async (event) => {
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
              toast(t("Coupon created"));
              setOpen(false);
              router.refresh();
            } catch (error) { toast.error(error instanceof Error ? error.message : t("Could not create coupon")); }
            finally { setBusy(false); }
          }}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="label" htmlFor="code">{t("Code")}</label><input id="code" className="field font-mono" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required /></div>
              <div><label className="label" htmlFor="type">{t("Type")}</label><select id="type" className="field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="PERCENTAGE">{t("Percentage")}</option><option value="FIXED">{t("Fixed amount")}</option></select></div>
              <div><label className="label" htmlFor="value">{t("Value")}</label><input id="value" type="number" min="0" step="0.01" className="field" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required /></div>
              <div><label className="label" htmlFor="min">{t("Minimum spend")}</label><input id="min" type="number" min="0" className="field" value={form.minOrderSubtotal} onChange={(e) => setForm({ ...form, minOrderSubtotal: e.target.value })} /></div>
              <div><label className="label" htmlFor="max">{t("Max discount")}</label><input id="max" type="number" min="0" className="field" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} /></div>
              <div><label className="label" htmlFor="limit">{t("Total uses")}</label><input id="limit" type="number" min="1" className="field" value={form.usageLimitTotal} onChange={(e) => setForm({ ...form, usageLimitTotal: e.target.value })} /></div>
              <div><label className="label" htmlFor="per">{t("Uses per customer")}</label><input id="per" type="number" min="1" className="field" value={form.usageLimitPerCustomer} onChange={(e) => setForm({ ...form, usageLimitPerCustomer: e.target.value })} /></div>
              <div><label className="label" htmlFor="start">{t("Starts")}</label><input id="start" type="date" className="field" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} required /></div>
              <div><label className="label" htmlFor="end">{t("Ends")}</label><input id="end" type="date" className="field" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} required /></div>
              <div className="sm:col-span-2"><label className="label" htmlFor="desc">{t("Description")}</label><input id="desc" className="field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.firstOrderOnly} onChange={(e) => setForm({ ...form, firstOrderOnly: e.target.checked })} className="h-4 w-4 accent-[#2f6b4f]" /> {t("First order only")}</label>
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 accent-[#2f6b4f]" /> {t("Active")}</label>
            </div>
            <FormActions busy={busy} onCancel={() => setOpen(false)} submitLabel="Create coupon" />
          </form>
        </Modal>
      )}
    </>
  );
}

export function PromotionManager({ initial }: { initial: Array<{ id: string; name: string; type: string; value: string; scope: string; priority: number; isActive: boolean; startsAt: string; endsAt: string }> }) {
  const router = useRouter();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", type: "PERCENTAGE", value: "10", minSubtotal: "0", startsAt: new Date().toISOString().slice(0, 10), endsAt: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10), priority: "0", isActive: true });
  const [busy, setBusy] = useState(false);

  return (
    <>
      <div className="mb-3 flex justify-end"><button type="button" className="a-btn" onClick={() => setOpen(true)}>{t("New promotion")}</button></div>
      <div className="panel overflow-hidden">
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t("Name")}</th><th>{t("Discount")}</th><th>{t("Scope")}</th><th>{t("Priority")}</th><th>{t("Window")}</th><th>{t("Status")}</th><th /></tr></thead>
            <tbody>
              {initial.map((promo) => (
                <tr key={promo.id}>
                  <td className="text-xs font-semibold">{promo.name}</td>
                  <td className="text-xs">{promo.type === "PERCENTAGE" ? `${Number(promo.value)}%` : `$${Number(promo.value).toFixed(2)}`}</td>
                  <td className="text-[11px]">{t(promo.scope.toLowerCase())}</td>
                  <td className="mono">{promo.priority}</td>
                  <td className="text-[10px] text-muted">{new Date(promo.startsAt).toLocaleDateString()} → {new Date(promo.endsAt).toLocaleDateString()}</td>
                  <td><span className={`text-[10px] font-semibold uppercase ${promo.isActive ? "text-accent" : "text-muted"}`}>{promo.isActive ? t("Active") : t("Paused")}</span></td>
                  <td className="text-right"><button type="button" className="a-link" onClick={async () => {
                    try { await clientApi(`/admin/promotions/${promo.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !promo.isActive }) }); toast(t("Promotion updated")); router.refresh(); }
                    catch (error) { toast.error(error instanceof Error ? error.message : t("Could not update promotion")); }
                  }}>{promo.isActive ? t("Pause") : t("Activate")}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line p-3 text-[10px] leading-relaxed text-muted">
          {t("Automatic promotions do not stack; the best single promotion is applied per order.")}
        </p>
      </div>
      {open && (
        <Modal title="New automatic promotion" onClose={() => setOpen(false)}>
          <form onSubmit={async (event) => {
            event.preventDefault(); setBusy(true);
            try {
              await clientApi("/admin/promotions", { method: "POST", body: JSON.stringify({
                name: form.name, description: form.description || undefined, type: form.type,
                value: Number(form.value), scope: "ALL", minSubtotal: Number(form.minSubtotal || 0),
                startsAt: form.startsAt, endsAt: form.endsAt, priority: Number(form.priority || 0), isActive: form.isActive,
              }) });
              toast(t("Promotion created")); setOpen(false); router.refresh();
            } catch (error) { toast.error(error instanceof Error ? error.message : t("Could not create promotion")); }
            finally { setBusy(false); }
          }}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="label" htmlFor="pname">{t("Name")}</label><input id="pname" className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div><label className="label" htmlFor="ptype">{t("Type")}</label><select id="ptype" className="field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="PERCENTAGE">{t("Percentage")}</option><option value="FIXED">{t("Fixed")}</option></select></div>
              <div><label className="label" htmlFor="pvalue">{t("Value")}</label><input id="pvalue" type="number" step="0.01" className="field" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
              <div><label className="label" htmlFor="pmin">{t("Minimum subtotal")}</label><input id="pmin" type="number" className="field" value={form.minSubtotal} onChange={(e) => setForm({ ...form, minSubtotal: e.target.value })} /></div>
              <div><label className="label" htmlFor="ppriority">{t("Priority")}</label><input id="ppriority" type="number" className="field" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} /></div>
              <div><label className="label" htmlFor="pstart">{t("Starts")}</label><input id="pstart" type="date" className="field" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></div>
              <div><label className="label" htmlFor="pend">{t("Ends")}</label><input id="pend" type="date" className="field" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></div>
            </div>
            <FormActions busy={busy} onCancel={() => setOpen(false)} submitLabel="Create" />
          </form>
        </Modal>
      )}
    </>
  );
}

export function LoyaltyAdjust({ accountId, current }: { accountId: string; current: number }) {
  const router = useRouter();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button type="button" className="a-link" onClick={() => setOpen(true)}>{t("Adjust")}</button>
      {open && (
        <Modal title="Adjust loyalty points" onClose={() => setOpen(false)}>
          <form onSubmit={async (event) => {
            event.preventDefault(); setBusy(true);
            try {
              await clientApi(`/admin/loyalty/${accountId}/adjust`, { method: "POST", body: JSON.stringify({ points: Number(points), reason }) });
              toast(t("Points adjusted")); setOpen(false); router.refresh();
            } catch (error) { toast.error(error instanceof Error ? error.message : t("Could not adjust points")); }
            finally { setBusy(false); }
          }}>
            <p className="text-xs text-muted">{t("Current balance: {points} points", { points: current })}</p>
            <div className="mt-4 space-y-3">
              <div><label className="label" htmlFor="points">{t("Points (negative to deduct)")}</label><input id="points" type="number" className="field" value={points} onChange={(e) => setPoints(e.target.value)} required /></div>
              <div><label className="label" htmlFor="lreason">{t("Reason")}</label><input id="lreason" className="field" value={reason} onChange={(e) => setReason(e.target.value)} required /></div>
            </div>
            <FormActions busy={busy} onCancel={() => setOpen(false)} submitLabel="Apply" />
          </form>
        </Modal>
      )}
    </>
  );
}

export function StaffManager({ initial, roles, currentUserId }: { initial: Array<{ id: string; email: string; firstName: string; lastName: string; status: string; staffProfile: { role: { name: string }; jobTitle: string | null; isActive: boolean } | null }>; roles: string[]; currentUserId: string }) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "", password: "", roleName: "CUSTOMER_SUPPORT", jobTitle: "" });
  const [busy, setBusy] = useState(false);
  return (
    <>
      <div className="mb-3 flex justify-end"><button type="button" className="a-btn" onClick={() => setOpen(true)}>{t("Invite staff")}</button></div>
      <div className="panel overflow-hidden">
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t("Name")}</th><th>{t("Email")}</th><th>{t("Role")}</th><th>{t("Title")}</th><th>{t("Status")}</th><th /></tr></thead>
            <tbody>
              {initial.map((member) => (
                <tr key={member.id}>
                  <td className="text-xs font-semibold">{member.firstName} {member.lastName}{member.id === currentUserId && <span className="ml-2 text-[9px] uppercase text-muted">{t("you")}</span>}</td>
                  <td className="text-[11px] text-muted">{member.email}</td>
                  <td>
                    <select className="field !min-h-0 !w-auto !py-1 text-[11px]" value={member.staffProfile?.role.name} onChange={async (event) => {
                      try { await clientApi(`/admin/staff/${member.id}`, { method: "PATCH", body: JSON.stringify({ roleName: event.target.value }) }); toast(t("Role updated")); router.refresh(); }
                      catch (error) { toast.error(error instanceof Error ? error.message : t("Could not update role")); }
                    }}>
                      {roles.map((role) => <option key={role} value={role}>{enumLabel(locale, role)}</option>)}
                    </select>
                  </td>
                  <td className="text-[11px] text-muted">{member.staffProfile?.jobTitle ?? "—"}</td>
                  <td><span className={`text-[10px] font-semibold uppercase ${member.status === "ACTIVE" && member.staffProfile?.isActive ? "text-accent" : "text-danger"}`}>{member.status === "ACTIVE" && member.staffProfile?.isActive ? t("Active") : t("Disabled")}</span></td>
                  <td className="text-right">
                    {member.id !== currentUserId && (
                      <button type="button" className="a-link" onClick={async () => {
                        const next = !(member.status === "ACTIVE" && member.staffProfile?.isActive);
                        try { await clientApi(`/admin/staff/${member.id}`, { method: "PATCH", body: JSON.stringify({ isActive: next, status: next ? "ACTIVE" : "SUSPENDED" }) }); toast(next ? t("Staff enabled") : t("Staff disabled")); router.refresh(); }
                        catch (error) { toast.error(error instanceof Error ? error.message : t("Could not update staff")); }
                      }}>{member.status === "ACTIVE" && member.staffProfile?.isActive ? t("Disable") : t("Enable")}</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {open && (
        <Modal title="Create staff account" onClose={() => setOpen(false)}>
          <form onSubmit={async (event) => {
            event.preventDefault(); setBusy(true);
            try {
              await clientApi("/admin/staff", { method: "POST", body: JSON.stringify(form) });
              toast(t("Staff account created")); setOpen(false); router.refresh();
            } catch (error) { toast.error(error instanceof Error ? error.message : t("Could not create staff")); }
            finally { setBusy(false); }
          }}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="label" htmlFor="s-first">{t("First name")}</label><input id="s-first" className="field" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></div>
              <div><label className="label" htmlFor="s-last">{t("Last name")}</label><input id="s-last" className="field" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></div>
              <div className="sm:col-span-2"><label className="label" htmlFor="s-email">{t("Email")}</label><input id="s-email" type="email" className="field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
              <div className="sm:col-span-2"><label className="label" htmlFor="s-password">{t("Temporary password")}</label><input id="s-password" type="password" minLength={10} className="field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
              <div><label className="label" htmlFor="s-role">{t("Role")}</label><select id="s-role" className="field" value={form.roleName} onChange={(e) => setForm({ ...form, roleName: e.target.value })}>{roles.map((role) => <option key={role} value={role}>{enumLabel(locale, role)}</option>)}</select></div>
              <div><label className="label" htmlFor="s-title">{t("Job title")}</label><input id="s-title" className="field" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} /></div>
            </div>
            <FormActions busy={busy} onCancel={() => setOpen(false)} submitLabel="Create" />
          </form>
        </Modal>
      )}
    </>
  );
}

export function SupplierManager({ initial }: { initial: Array<{ id: string; name: string; code: string; contactName: string | null; email: string | null; isActive: boolean; _count: { purchaseOrders: number } }> }) {
  const router = useRouter();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", contactName: "", email: "", phone: "", address: "", notes: "" });
  const [busy, setBusy] = useState(false);
  return (
    <>
      <div className="mb-3 flex justify-end"><button type="button" className="a-btn" onClick={() => setOpen(true)}>{t("New supplier")}</button></div>
      <div className="panel overflow-hidden">
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t("Supplier")}</th><th>{t("Code")}</th><th>{t("Contact")}</th><th>{t("Purchase orders")}</th><th>{t("Status")}</th></tr></thead>
            <tbody>
              {initial.map((supplier) => (
                <tr key={supplier.id}>
                  <td className="text-xs font-semibold">{supplier.name}</td>
                  <td className="font-mono text-[11px]">{supplier.code}</td>
                  <td className="text-[11px] text-muted">{supplier.contactName ?? "—"} {supplier.email ?? ""}</td>
                  <td className="mono">{supplier._count.purchaseOrders}</td>
                  <td><span className={`text-[10px] font-semibold uppercase ${supplier.isActive ? "text-accent" : "text-muted"}`}>{supplier.isActive ? t("Active") : t("Inactive")}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {open && (
        <Modal title="New supplier" onClose={() => setOpen(false)}>
          <form onSubmit={async (event) => {
            event.preventDefault(); setBusy(true);
            try { await clientApi("/admin/suppliers", { method: "POST", body: JSON.stringify(form) }); toast(t("Supplier created")); setOpen(false); router.refresh(); }
            catch (error) { toast.error(error instanceof Error ? error.message : t("Could not create supplier")); }
            finally { setBusy(false); }
          }}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="label" htmlFor="sup-name">{t("Name")}</label><input id="sup-name" className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div><label className="label" htmlFor="sup-code">{t("Code")}</label><input id="sup-code" className="field font-mono" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required /></div>
              <div><label className="label" htmlFor="sup-contact">{t("Contact")}</label><input id="sup-contact" className="field" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></div>
              <div><label className="label" htmlFor="sup-email">{t("Email")}</label><input id="sup-email" type="email" className="field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className="label" htmlFor="sup-address">{t("Address")}</label><input id="sup-address" className="field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className="label" htmlFor="sup-notes">{t("Notes")}</label><textarea id="sup-notes" rows={2} className="field" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <FormActions busy={busy} onCancel={() => setOpen(false)} submitLabel="Create" />
          </form>
        </Modal>
      )}
    </>
  );
}

export function ReceivePurchaseOrder({ id, disabled }: { id: string; disabled: boolean }) {
  const router = useRouter();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  return (
    <button type="button" disabled={disabled || busy} className="a-btn a-btn-sm" onClick={async () => {
      if (!window.confirm(t("Receive all items? This writes stock-in movements for every line."))) return;
      setBusy(true);
      try { await clientApi(`/admin/purchase-orders/${id}/receive`, { method: "POST" }); toast(t("Purchase order received")); router.refresh(); }
      catch (error) { toast.error(error instanceof Error ? error.message : t("Could not receive order")); }
      finally { setBusy(false); }
    }}>{busy ? t("Receiving…") : t("Receive")}</button>
  );
}
