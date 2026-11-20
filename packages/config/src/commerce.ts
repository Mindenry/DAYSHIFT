/** Currency-safe money helpers. All authoritative arithmetic is integer cents. */
export function toCents(value: string | number | { toString(): string }): number {
  const raw = typeof value === "string" ? value : value.toString();
  const trimmed = raw.trim();
  if (!/^-?\d+(\.\d{1,2})?$/.test(trimmed)) {
    throw new Error(`Invalid monetary value: ${raw}`);
  }
  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const [whole, fraction = ""] = unsigned.split(".");
  const cents = Number(whole) * 100 + Number((fraction + "00").slice(0, 2));
  return negative ? -cents : cents;
}

export function centsToDecimalString(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.round(cents));
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

export function formatMoney(cents: number, currency = "THB"): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function applyPercentage(amountCents: number, percentage: number): number {
  return Math.round((amountCents * percentage) / 100);
}

export const COMMERCE = {
  currency: "THB",
  taxRate: 0.07,
  shipping: {
    standard: {
      code: "standard",
      label: "Standard delivery",
      description: "2–4 business days",
      priceCents: 5000,
      freeOverCents: 150000,
    },
    express: {
      code: "express",
      label: "Express delivery",
      description: "Next business day",
      priceCents: 10000,
      freeOverCents: null as number | null,
    },
  },
  returnWindowDays: 30,
  maxQuantityPerItem: 10,
  reservationMinutes: 15,
  loyalty: {
    // 0.05 points per baht = 1 point per ฿20; 1 point redeems for ฿1.
    pointsPerDollar: 0.05,
    centsPerPoint: 100,
    minRedeemPoints: 500,
    tiers: [
      { tier: "BRONZE", threshold: 0 },
      { tier: "SILVER", threshold: 500 },
      { tier: "GOLD", threshold: 2000 },
      { tier: "PLATINUM", threshold: 5000 },
    ],
  },
  lowStockThreshold: 5,
} as const;

export const SHIPPING_METHODS = Object.values(COMMERCE.shipping);

export function resolveShippingCents(
  methodCode: string,
  merchandiseAfterDiscountCents: number,
): number {
  const method =
    COMMERCE.shipping[methodCode as keyof typeof COMMERCE.shipping] ??
    COMMERCE.shipping.standard;
  if (method.freeOverCents !== null && merchandiseAfterDiscountCents >= method.freeOverCents) {
    return 0;
  }
  return method.priceCents;
}

export function generateOrderNumber(date = new Date(), random = Math.random): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const suffix = String(Math.floor(random() * 1_000_000)).padStart(6, "0");
  return `DS-${y}${m}${d}-${suffix}`;
}

export function generateReturnNumber(date = new Date(), random = Math.random): string {
  const y = date.getUTCFullYear();
  const suffix = String(Math.floor(random() * 1_000_000)).padStart(6, "0");
  return `RT-${y}-${suffix}`;
}
