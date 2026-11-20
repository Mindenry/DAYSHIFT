"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clientApi, money } from "@/lib/api";
import { useI18n } from "@/lib/i18n-client";

interface ReturnItem {
  orderItemId: string;
  productSlug: string;
  variantId: string | null;
  productName: string;
  size: string | null;
  color: string | null;
  imageUrl: string | null;
  returnableQuantity: number;
  unitPrice: string;
  discountAllocated: string;
  exchangeVariants: Array<{ id: string; size: string | null; color: string | null; availableStock: number }>;
}

const REASONS = [
  ["WRONG_SIZE", "Wrong size"],
  ["DOES_NOT_FIT", "Doesn't fit as expected"],
  ["WRONG_COLOR", "Wrong colour"],
  ["NOT_AS_DESCRIBED", "Not as described"],
  ["DAMAGED", "Arrived damaged"],
  ["DEFECTIVE", "Faulty"],
  ["CHANGED_MIND", "Changed my mind"],
  ["OTHER", "Other"],
];

export function ReturnForm({
  orderId,
  orderNumber,
  items,
}: {
  orderId: string;
  orderNumber: string;
  items: ReturnItem[];
}) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<Record<string, { checked: boolean; quantity: number; exchangeVariantId: string }>>(
    Object.fromEntries(items.map((item) => [item.orderItemId, { checked: false, quantity: 1, exchangeVariantId: "" }])),
  );
  const [resolution, setResolution] = useState<"REFUND" | "EXCHANGE" | "STORE_CREDIT">("REFUND");
  const [reason, setReason] = useState("WRONG_SIZE");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const chosen = items.filter((item) => selected[item.orderItemId]?.checked);
  const estimate = chosen.reduce((sum, item) => {
    const perUnit = (Number(item.unitPrice) * item.returnableQuantity - Number(item.discountAllocated)) / item.returnableQuantity;
    return sum + perUnit * (selected[item.orderItemId]?.quantity ?? 1);
  }, 0);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!chosen.length) {
      setError(t("Select at least one piece to return."));
      return;
    }
    if (resolution === "EXCHANGE") {
      const missing = chosen.find((item) => !selected[item.orderItemId]?.exchangeVariantId);
      if (missing) {
        setError(t("Choose a replacement for {name}.", { name: missing.productName }));
        return;
      }
    }
    setBusy(true);
    setError(null);
    try {
      const payload = {
        orderId,
        resolution,
        reason,
        customerNote: note || undefined,
        items: chosen.map((item) => ({
          orderItemId: item.orderItemId,
          quantity: selected[item.orderItemId].quantity,
          exchangeVariantId:
            resolution === "EXCHANGE" ? selected[item.orderItemId].exchangeVariantId : undefined,
        })),
      };
      await clientApi("/returns", { method: "POST", body: JSON.stringify(payload) });
      toast(t("Return request submitted"));
      router.push("/account/returns");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("Could not submit return"));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_0.7fr]">
      <div>
        {error && <div role="alert" className="mb-4 border border-sale/40 bg-sale/5 p-3 text-sm text-sale">{error}</div>}
        <fieldset>
          <legend className="overline mb-4">{t("Choose your pieces")}</legend>
          <ul className="divide-y divide-line border-y border-line">
            {items.map((item) => {
              const state = selected[item.orderItemId];
              return (
                <li key={item.orderItemId} className="py-5">
                  <div className="flex gap-4">
                    <div className="h-24 w-20 shrink-0 overflow-hidden bg-sand">
                      {item.imageUrl && (
                         
                        <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          checked={state?.checked ?? false}
                          onChange={(event) => setSelected((prev) => ({
                            ...prev,
                            [item.orderItemId]: { ...prev[item.orderItemId], checked: event.target.checked },
                          }))}
                          className="mt-1 h-4 w-4 accent-[#1a1917]"
                        />
                        <span>
                          <span className="block font-display text-lg">{item.productName}</span>
                          <span className="mt-0.5 block text-xs text-muted">{item.color} {item.size && `· ${item.size}`}</span>
                          <span className="mt-1 block text-xs text-muted">{t("Returnable")}: {item.returnableQuantity} · {money(item.unitPrice)} {t("each")}</span>
                        </span>
                      </label>
                      {state?.checked && (
                        <div className="mt-3 flex flex-wrap items-end gap-4 pl-7">
                          <div>
                            <label htmlFor={`qty-${item.orderItemId}`} className="label">{t("Quantity")}</label>
                            <select
                              id={`qty-${item.orderItemId}`}
                              value={state.quantity}
                              onChange={(event) => setSelected((prev) => ({
                                ...prev,
                                [item.orderItemId]: { ...prev[item.orderItemId], quantity: Number(event.target.value) },
                              }))}
                              className="field !min-h-10 w-24 py-1"
                            >
                              {Array.from({ length: item.returnableQuantity }, (_, i) => i + 1).map((n) => (
                                <option key={n} value={n}>{n}</option>
                              ))}
                            </select>
                          </div>
                          {resolution === "EXCHANGE" && (
                            <div className="min-w-48 flex-1">
                              <label htmlFor={`exchange-${item.orderItemId}`} className="label">{t("Replacement size / colour")}</label>
                              <select
                                id={`exchange-${item.orderItemId}`}
                                value={state.exchangeVariantId}
                                onChange={(event) => setSelected((prev) => ({
                                  ...prev,
                                  [item.orderItemId]: { ...prev[item.orderItemId], exchangeVariantId: event.target.value },
                                }))}
                                className="field !min-h-10 py-1"
                              >
                                <option value="">{t("Choose a replacement")}</option>
                                {item.exchangeVariants.map((variant) => (
                                  <option key={variant.id} value={variant.id}>
                                    {[variant.color, variant.size].filter(Boolean).join(" / ")} — {variant.availableStock} {t("available")}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </fieldset>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <fieldset>
            <legend className="label">{t("What would you like?")}</legend>
            <div className="space-y-2">
              {[
                ["REFUND", t("Refund to original payment")],
                ["EXCHANGE", t("Exchange for another size or colour")],
                ["STORE_CREDIT", t("Store credit")],
              ].map(([value, label]) => (
                <label key={value} className="flex cursor-pointer items-center gap-3 text-sm">
                  <input
                    type="radio"
                    name="resolution"
                    value={value}
                    checked={resolution === value}
                    onChange={() => setResolution(value as typeof resolution)}
                    className="h-4 w-4 accent-[#1a1917]"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="return-reason" className="label">{t("Reason")}</label>
            <select id="return-reason" value={reason} onChange={(event) => setReason(event.target.value)} className="field">
              {REASONS.map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-6">
          <label htmlFor="return-note" className="label">{t("Anything we should know? (optional)")}</label>
          <textarea id="return-note" value={note} onChange={(event) => setNote(event.target.value)} rows={4} maxLength={1000} className="field resize-y" />
        </div>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="border border-line p-6">
          <p className="overline">{t("Return summary")}</p>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>{chosen.length} {chosen.length === 1 ? t("piece") : t("pieces")}</span><span>{money(estimate)}</span></div>
            <div className="flex justify-between text-muted"><span>{t("Delivery")}</span><span>{t("Free")}</span></div>
            <div className="flex justify-between border-t border-line pt-3 text-base"><span>{t("Estimated refund")}</span><span>{money(estimate)}</span></div>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-muted">
            {t("The final refund is confirmed after inspection and includes any tax paid. Original shipping is refunded only for faulty or incorrect items.")}
          </p>
          <button type="submit" disabled={busy || !chosen.length} className="btn btn-primary mt-6 w-full">
            {busy ? t("Submitting…") : resolution === "EXCHANGE" ? t("Request exchange") : t("Submit return request")}
          </button>
          <p className="mt-3 text-[11px] text-muted">{t("Order {order}. You will receive an email when the status changes.", { order: orderNumber })}</p>
        </div>
      </aside>
    </form>
  );
}
