/**
 * Authoritative pricing engine.
 *
 * All arithmetic is performed in integer cents. The storefront never submits
 * prices; checkout loads the cart from the database and calls this module.
 *
 * Promotion policy (documented in docs/business/BUSINESS_WORKFLOWS.md):
 *  - Automatic promotions are non-stacking. The single most valuable
 *    applicable promotion is applied order-wide.
 *  - One coupon may be applied per order, on top of the automatic promotion.
 *  - Coupons are capped by their maxDiscount and by the eligible line value.
 *  - Shipping thresholds are measured on merchandise after all discounts.
 *  - Tax is calculated on discounted merchandise; shipping is not taxed.
 */

export type DiscountType = "PERCENTAGE" | "FIXED";
export type PromotionScope = "ALL" | "CATEGORY" | "PRODUCT" | "COLLECTION";

export interface PricingLine {
  id: string;
  productId: string;
  categoryIds: string[];
  collectionIds: string[];
  unitPriceCents: number;
  quantity: number;
}

export interface PromotionRule {
  id: string;
  name: string;
  type: DiscountType;
  value: number;
  scope: PromotionScope;
  categoryId?: string | null;
  productId?: string | null;
  collectionId?: string | null;
  minSubtotalCents: number;
  priority: number;
}

export interface CouponRule {
  code: string;
  type: DiscountType;
  value: number;
  minOrderSubtotalCents: number;
  maxDiscountCents?: number | null;
  eligibleProductIds?: string[];
  eligibleCategoryIds?: string[];
  eligibleCollectionIds?: string[];
}

export interface ShippingRules {
  methodCode: string;
  standardCents: number;
  expressCents: number;
  freeOverCents: number | null;
}

export interface PricingRequest {
  lines: PricingLine[];
  promotions: PromotionRule[];
  coupon?: CouponRule | null;
  shipping: ShippingRules;
  taxRate: number;
}

export interface PricedLine {
  id: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  promotionDiscountCents: number;
  couponDiscountCents: number;
  discountCents: number;
  finalLineTotalCents: number;
}

export interface PricingResult {
  lines: PricedLine[];
  subtotalCents: number;
  promotionDiscountCents: number;
  couponDiscountCents: number;
  discountTotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  appliedPromotion: { id: string; name: string; amountCents: number } | null;
  appliedCoupon: { code: string; amountCents: number } | null;
}

function round(value: number): number {
  return Math.round(value);
}

function discountAmount(type: DiscountType, value: number, baseCents: number): number {
  if (baseCents <= 0) return 0;
  const raw = type === "PERCENTAGE" ? (baseCents * value) / 100 : value;
  return Math.max(0, Math.min(baseCents, round(raw)));
}

function lineTotal(line: PricingLine): number {
  return line.unitPriceCents * line.quantity;
}

function matchesPromotion(promo: PromotionRule, line: PricingLine): boolean {
  switch (promo.scope) {
    case "ALL":
      return true;
    case "CATEGORY":
      return !!promo.categoryId && line.categoryIds.includes(promo.categoryId);
    case "PRODUCT":
      return !!promo.productId && line.productId === promo.productId;
    case "COLLECTION":
      return !!promo.collectionId && line.collectionIds.includes(promo.collectionId);
    default:
      return false;
  }
}

/** Allocates an order-level amount across lines proportionally to their base. */
function allocate(amount: number, entries: Array<{ id: string; base: number }>): Map<string, number> {
  const result = new Map<string, number>();
  const totalBase = entries.reduce((sum, e) => sum + e.base, 0);
  if (amount <= 0 || totalBase <= 0) {
    entries.forEach((e) => result.set(e.id, 0));
    return result;
  }
  let allocated = 0;
  entries.forEach((entry, index) => {
    const isLast = index === entries.length - 1;
    const share = isLast
      ? Math.max(0, amount - allocated)
      : Math.min(entry.base, round((amount * entry.base) / totalBase));
    allocated += share;
    result.set(entry.id, share);
  });
  return result;
}

function couponMatches(coupon: CouponRule, line: PricingLine): boolean {
  const products = coupon.eligibleProductIds ?? [];
  const categories = coupon.eligibleCategoryIds ?? [];
  const collections = coupon.eligibleCollectionIds ?? [];
  if (!products.length && !categories.length && !collections.length) return true;
  if (products.includes(line.productId)) return true;
  if (categories.some((id) => line.categoryIds.includes(id))) return true;
  if (collections.some((id) => line.collectionIds.includes(id))) return true;
  return false;
}

export function computePricing(request: PricingRequest): PricingResult {
  const lines = request.lines;
  const subtotalCents = lines.reduce((sum, line) => sum + lineTotal(line), 0);

  // 1. Choose the best applicable automatic promotion.
  let best: { promo: PromotionRule; amount: number; eligible: PricingLine[] } | null = null;
  for (const promo of request.promotions) {
    const eligible = lines.filter((line) => matchesPromotion(promo, line));
    const eligibleBase = eligible.reduce((sum, line) => sum + lineTotal(line), 0);
    if (eligibleBase < promo.minSubtotalCents) continue;
    const amount = discountAmount(promo.type, promo.value, eligibleBase);
    if (amount <= 0) continue;
    if (
      !best ||
      amount > best.amount ||
      (amount === best.amount && promo.priority > best.promo.priority)
    ) {
      best = { promo, amount, eligible };
    }
  }

  const promotionByLine = new Map<string, number>();
  lines.forEach((line) => promotionByLine.set(line.id, 0));
  if (best) {
    const allocations = allocate(
      best.amount,
      best.eligible.map((line) => ({ id: line.id, base: lineTotal(line) })),
    );
    allocations.forEach((value, id) => promotionByLine.set(id, value));
  }
  const promotionDiscountCents = Array.from(promotionByLine.values()).reduce((a, b) => a + b, 0);

  // 2. Coupon on the remaining eligible merchandise value.
  const couponByLine = new Map<string, number>();
  lines.forEach((line) => couponByLine.set(line.id, 0));
  let couponDiscountCents = 0;
  let appliedCoupon: PricingResult["appliedCoupon"] = null;

  if (request.coupon && subtotalCents >= request.coupon.minOrderSubtotalCents) {
    const eligible = lines.filter((line) => couponMatches(request.coupon!, line));
    const bases = eligible.map((line) => ({
      id: line.id,
      base: Math.max(0, lineTotal(line) - (promotionByLine.get(line.id) ?? 0)),
    }));
    const eligibleBase = bases.reduce((sum, entry) => sum + entry.base, 0);
    let amount = discountAmount(request.coupon.type, request.coupon.value, eligibleBase);
    if (request.coupon.maxDiscountCents != null) {
      amount = Math.min(amount, request.coupon.maxDiscountCents);
    }
    amount = Math.min(amount, eligibleBase);
    if (amount > 0) {
      const allocations = allocate(amount, bases);
      allocations.forEach((value, id) => couponByLine.set(id, value));
      couponDiscountCents = amount;
      appliedCoupon = { code: request.coupon.code, amountCents: amount };
    }
  }

  const pricedLines: PricedLine[] = lines.map((line) => {
    const total = lineTotal(line);
    const promoDiscount = Math.min(total, promotionByLine.get(line.id) ?? 0);
    const couponDiscount = Math.min(total - promoDiscount, couponByLine.get(line.id) ?? 0);
    const discount = promoDiscount + couponDiscount;
    return {
      id: line.id,
      unitPriceCents: line.unitPriceCents,
      quantity: line.quantity,
      lineTotalCents: total,
      promotionDiscountCents: promoDiscount,
      couponDiscountCents: couponDiscount,
      discountCents: discount,
      finalLineTotalCents: Math.max(0, total - discount),
    };
  });

  const discountTotalCents = Math.min(subtotalCents, promotionDiscountCents + couponDiscountCents);
  const merchandiseAfterDiscount = Math.max(0, subtotalCents - discountTotalCents);

  const shippingBase =
    request.shipping.methodCode === "express"
      ? request.shipping.expressCents
      : request.shipping.standardCents;
  const shippingCents =
    request.shipping.freeOverCents !== null && merchandiseAfterDiscount >= request.shipping.freeOverCents
      ? 0
      : shippingBase;

  const taxCents = Math.max(0, round(merchandiseAfterDiscount * request.taxRate));
  const totalCents = merchandiseAfterDiscount + shippingCents + taxCents;

  return {
    lines: pricedLines,
    subtotalCents,
    promotionDiscountCents: Math.min(promotionDiscountCents, subtotalCents),
    couponDiscountCents,
    discountTotalCents,
    shippingCents,
    taxCents,
    totalCents,
    appliedPromotion: best
      ? { id: best.promo.id, name: best.promo.name, amountCents: best.amount }
      : null,
    appliedCoupon,
  };
}
