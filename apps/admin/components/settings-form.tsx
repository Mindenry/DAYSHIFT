"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clientApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n-client";

interface Settings {
  store?: { name?: string; tagline?: string; email?: string; phone?: string; address?: string };
  tax?: { rate?: number; inclusive?: boolean; label?: string };
  shipping?: { standardPrice?: number; standardFreeOver?: number; expressPrice?: number };
  returns?: { windowDays?: number; freeReturns?: boolean; finalSaleReturnable?: boolean };
  loyalty?: { pointsPerDollar?: number; centsPerPoint?: number; minRedeemPoints?: number; earnOnShipping?: boolean };
  payments?: { provider?: string; currency?: string; cashOnDelivery?: boolean };
  notifications?: { orderEmails?: boolean; marketingEmails?: boolean; lowStockAlerts?: boolean };
  features?: { guestCheckout?: boolean; reviewsRequirePurchase?: boolean; wishlistForGuests?: boolean };
}

export function SettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const { t } = useI18n();
  const [store, setStore] = useState({ name: "", tagline: "", email: "", phone: "", address: "", ...(initial.store ?? {}) });
  const [tax, setTax] = useState({ rate: 0.07, inclusive: true, label: "VAT 7%", ...(initial.tax ?? {}) });
  const [shipping, setShipping] = useState({ standardPrice: 50, standardFreeOver: 1500, expressPrice: 100, ...(initial.shipping ?? {}) });
  const [returns, setReturns] = useState({ windowDays: 30, freeReturns: true, finalSaleReturnable: false, ...(initial.returns ?? {}) });
  const [loyalty, setLoyalty] = useState({ pointsPerDollar: 0.05, centsPerPoint: 100, minRedeemPoints: 500, earnOnShipping: false, ...(initial.loyalty ?? {}) });
  const [payments, setPayments] = useState({ provider: "sandbox", currency: "THB", cashOnDelivery: true, ...(initial.payments ?? {}) });
  const [features, setFeatures] = useState({ guestCheckout: true, reviewsRequirePurchase: true, wishlistForGuests: false, ...(initial.features ?? {}) });
  const [notifications, setNotifications] = useState({ orderEmails: true, marketingEmails: true, lowStockAlerts: true, ...(initial.notifications ?? {}) });
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        try {
          await clientApi("/admin/settings", {
            method: "PATCH",
            body: JSON.stringify({ store, tax, shipping, returns, loyalty, payments, features, notifications }),
          });
          toast(t("Settings saved. Pricing and catalogue caches were invalidated."));
          router.refresh();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : t("Could not save settings"));
        } finally {
          setBusy(false);
        }
      }}
    >
      <section className="panel p-5">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("Store")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="store-name">{t("Name")}</label><input id="store-name" className="field" value={store.name} onChange={(e) => setStore({ ...store, name: e.target.value })} /></div>
          <div><label className="label" htmlFor="store-email">{t("Email")}</label><input id="store-email" className="field" value={store.email} onChange={(e) => setStore({ ...store, email: e.target.value })} /></div>
          <div><label className="label" htmlFor="store-phone">{t("Phone")}</label><input id="store-phone" className="field" value={store.phone} onChange={(e) => setStore({ ...store, phone: e.target.value })} /></div>
          <div><label className="label" htmlFor="store-address">{t("Address")}</label><input id="store-address" className="field" value={store.address} onChange={(e) => setStore({ ...store, address: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="store-tagline">{t("Tagline")}</label><input id="store-tagline" className="field" value={store.tagline} onChange={(e) => setStore({ ...store, tagline: e.target.value })} /></div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("Tax")}</h2>
          <div className="mt-4 grid gap-3">
            <div><label className="label" htmlFor="tax-rate">{t("Rate (decimal, e.g. 0.08)")}</label><input id="tax-rate" type="number" step="0.001" className="field" value={tax.rate} onChange={(e) => setTax({ ...tax, rate: Number(e.target.value) })} /></div>
            <div><label className="label" htmlFor="tax-label">{t("Label")}</label><input id="tax-label" className="field" value={tax.label} onChange={(e) => setTax({ ...tax, label: e.target.value })} /></div>
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("Shipping")}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div><label className="label" htmlFor="ship-standard">{t("Standard")}</label><input id="ship-standard" type="number" step="0.01" className="field" value={shipping.standardPrice} onChange={(e) => setShipping({ ...shipping, standardPrice: Number(e.target.value) })} /></div>
            <div><label className="label" htmlFor="ship-free">{t("Free over")}</label><input id="ship-free" type="number" className="field" value={shipping.standardFreeOver} onChange={(e) => setShipping({ ...shipping, standardFreeOver: Number(e.target.value) })} /></div>
            <div><label className="label" htmlFor="ship-express">{t("Express")}</label><input id="ship-express" type="number" step="0.01" className="field" value={shipping.expressPrice} onChange={(e) => setShipping({ ...shipping, expressPrice: Number(e.target.value) })} /></div>
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("Returns")}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div><label className="label" htmlFor="return-window">{t("Window (days)")}</label><input id="return-window" type="number" className="field" value={returns.windowDays} onChange={(e) => setReturns({ ...returns, windowDays: Number(e.target.value) })} /></div>
            <label className="flex items-end gap-2 pb-2 text-xs"><input type="checkbox" checked={returns.freeReturns} onChange={(e) => setReturns({ ...returns, freeReturns: e.target.checked })} className="h-4 w-4 accent-[#2f6b4f]" /> {t("Free returns")}</label>
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("Loyalty")}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div><label className="label" htmlFor="loy-points">{t("Points per ฿100")}</label><input id="loy-points" type="number" step="0.1" className="field" value={loyalty.pointsPerDollar * 100} onChange={(e) => setLoyalty({ ...loyalty, pointsPerDollar: Number(e.target.value) / 100 })} /></div>
            <div><label className="label" htmlFor="loy-cent">{t("Satang per point")}</label><input id="loy-cent" type="number" className="field" value={loyalty.centsPerPoint} onChange={(e) => setLoyalty({ ...loyalty, centsPerPoint: Number(e.target.value) })} /></div>
            <div><label className="label" htmlFor="loy-min">{t("Min redeem")}</label><input id="loy-min" type="number" className="field" value={loyalty.minRedeemPoints} onChange={(e) => setLoyalty({ ...loyalty, minRedeemPoints: Number(e.target.value) })} /></div>
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("Payments")}</h2>
          <p className="mt-2 text-[11px] leading-relaxed text-muted">{t("Provider: sandbox. No real payment credentials are configured in this environment.")}</p>
          <label className="mt-4 flex items-center gap-2 text-xs"><input type="checkbox" checked={payments.cashOnDelivery} onChange={(e) => setPayments({ ...payments, cashOnDelivery: e.target.checked })} className="h-4 w-4 accent-[#2f6b4f]" /> {t("Enable cash on delivery")}</label>
        </section>

        <section className="panel p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("Features & notifications")}</h2>
          <div className="mt-3 space-y-2 text-xs">
            <label className="flex items-center gap-2"><input type="checkbox" checked={features.guestCheckout} onChange={(e) => setFeatures({ ...features, guestCheckout: e.target.checked })} className="h-4 w-4 accent-[#2f6b4f]" /> {t("Allow guest checkout")}</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={features.reviewsRequirePurchase} onChange={(e) => setFeatures({ ...features, reviewsRequirePurchase: e.target.checked })} className="h-4 w-4 accent-[#2f6b4f]" /> {t("Reviews require a verified purchase")}</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={notifications.orderEmails} onChange={(e) => setNotifications({ ...notifications, orderEmails: e.target.checked })} className="h-4 w-4 accent-[#2f6b4f]" /> {t("Transactional order emails")}</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={notifications.lowStockAlerts} onChange={(e) => setNotifications({ ...notifications, lowStockAlerts: e.target.checked })} className="h-4 w-4 accent-[#2f6b4f]" /> {t("Low stock alerts")}</label>
          </div>
        </section>
      </div>

      <button type="submit" disabled={busy} className="a-btn">{busy ? t("Saving…") : t("Save settings")}</button>
    </form>
  );
}
