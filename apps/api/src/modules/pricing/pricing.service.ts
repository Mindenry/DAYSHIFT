import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.module";
import { CacheService } from "../../redis/cache.service";
import { COMMERCE, toCents } from "@dayshift/config";
import { AppError } from "../../common/app-error";
import {
  computePricing,
  CouponRule,
  PricingLine,
  PricingResult,
  PromotionRule,
} from "../../domain/pricing";

export interface PricingItem {
  id: string;
  productId: string;
  categoryIds: string[];
  collectionIds: string[];
  unitPrice: { toString(): string };
  quantity: number;
}

export interface QuoteOptions {
  items: PricingItem[];
  couponCode?: string | null;
  userId?: string | null;
  email?: string | null;
  shippingMethod?: string;
  strict?: boolean;
}

export interface QuoteResult {
  pricing: PricingResult;
  coupon: {
    code: string;
    description: string | null;
    amount: string;
    valid: boolean;
    reason?: string;
  } | null;
  taxRate: number;
}

@Injectable()
export class PricingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  private async commerceSettings() {
    const cached = await this.cache.get<{ taxRate: number; freeOver: number; standard: number; express: number }>(
      "settings:commerce",
    );
    if (cached) return cached;
    const rows = await this.prisma.setting.findMany({
      where: { key: { in: ["tax", "shipping"] } },
    });
    const tax = rows.find((r) => r.key === "tax")?.value as { rate?: number } | undefined;
    const shipping = rows.find((r) => r.key === "shipping")?.value as
      | { standardPrice?: number; standardFreeOver?: number; expressPrice?: number }
      | undefined;
    const settings = {
      taxRate: tax?.rate ?? COMMERCE.taxRate,
      freeOver: toCents(shipping?.standardFreeOver ?? COMMERCE.shipping.standard.freeOverCents / 100),
      standard: toCents(shipping?.standardPrice ?? COMMERCE.shipping.standard.priceCents / 100),
      express: toCents(shipping?.expressPrice ?? COMMERCE.shipping.express.priceCents / 100),
    };
    await this.cache.set("settings:commerce", settings, 120);
    return settings;
  }

  async activePromotions(): Promise<PromotionRule[]> {
    const now = new Date();
    const promotions = await this.prisma.promotion.findMany({
      where: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
      orderBy: { priority: "desc" },
    });
    return promotions.map((promo) => ({
      id: promo.id,
      name: promo.name,
      type: promo.type,
      value: Number(promo.value.toString()),
      scope: promo.scope,
      categoryId: promo.categoryId,
      productId: promo.productId,
      collectionId: promo.collectionId,
      minSubtotalCents: toCents(promo.minSubtotal),
      priority: promo.priority,
    }));
  }

  private async couponRule(code: string, userId?: string | null, email?: string | null, subtotalCents = 0, strict = false) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
      include: {
        products: true,
        categories: true,
        collections: true,
        _count: { select: { redemptions: true } },
      },
    });
    if (!coupon || !coupon.isActive) {
      if (strict) throw AppError.validation("This discount code isn't valid.");
      return null;
    }
    const now = new Date();
    if (coupon.startsAt > now || coupon.endsAt < now) {
      if (strict) throw AppError.validation("This discount code has expired.");
      return null;
    }
    if (subtotalCents < toCents(coupon.minOrderSubtotal)) {
      if (strict) {
        throw AppError.validation(
          `This code requires a minimum spend of $${Number(coupon.minOrderSubtotal).toFixed(2)}.`,
        );
      }
      return null;
    }
    if (coupon.usageLimitTotal !== null && coupon._count.redemptions >= coupon.usageLimitTotal) {
      if (strict) throw AppError.validation("This discount code has reached its usage limit.");
      return null;
    }
    if (coupon.usageLimitPerCustomer !== null) {
      if (userId) {
        const used = await this.prisma.couponRedemption.count({
          where: { couponId: coupon.id, userId },
        });
        if (used >= coupon.usageLimitPerCustomer) {
          if (strict) throw AppError.validation("You've already used this code the maximum number of times.");
          return null;
        }
      } else if (email) {
        const used = await this.prisma.order.count({
          where: { couponCode: coupon.code, email: email.toLowerCase(), status: { notIn: ["CANCELLED", "PAYMENT_FAILED"] } },
        });
        if (used >= coupon.usageLimitPerCustomer) {
          if (strict) throw AppError.validation("This code has already been used with this email address.");
          return null;
        }
      }
    }
    if (coupon.firstOrderOnly) {
      if (userId) {
        const orderCount = await this.prisma.order.count({
          where: { userId, status: { notIn: ["CANCELLED", "PAYMENT_FAILED"] } },
        });
        if (orderCount > 0) {
          if (strict) throw AppError.validation("This code is valid on your first order only.");
          return null;
        }
      }
    }

    const rule: CouponRule = {
      code: coupon.code,
      type: coupon.type,
      value: Number(coupon.value.toString()),
      minOrderSubtotalCents: toCents(coupon.minOrderSubtotal),
      maxDiscountCents: coupon.maxDiscount ? toCents(coupon.maxDiscount) : null,
      eligibleProductIds: coupon.products.map((p) => p.productId),
      eligibleCategoryIds: coupon.categories.map((c) => c.categoryId),
      eligibleCollectionIds: coupon.collections.map((c) => c.collectionId),
    };
    return { coupon, rule };
  }

  async quote(options: QuoteOptions): Promise<QuoteResult> {
    const settings = await this.commerceSettings();
    const promotions = await this.activePromotions();
    const lines: PricingLine[] = options.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      categoryIds: item.categoryIds,
      collectionIds: item.collectionIds,
      unitPriceCents: toCents(item.unitPrice),
      quantity: item.quantity,
    }));
    const subtotalCents = lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);

    let couponRule: CouponRule | null = null;
    let couponMeta: { code: string; description: string | null } | null = null;
    if (options.couponCode) {
      try {
        const found = await this.couponRule(
          options.couponCode,
          options.userId,
          options.email,
          subtotalCents,
          options.strict,
        );
        if (found) {
          couponRule = found.rule;
          couponMeta = { code: found.coupon.code, description: found.coupon.description };
        }
      } catch (error) {
        if (options.strict) throw error;
        couponRule = null;
      }
    }

    const pricing = computePricing({
      lines,
      promotions,
      coupon: couponRule,
      taxRate: settings.taxRate,
      shipping: {
        methodCode: options.shippingMethod ?? "standard",
        standardCents: settings.standard,
        expressCents: settings.express,
        freeOverCents: settings.freeOver,
      },
    });

    return {
      pricing,
      coupon: couponMeta
        ? {
            code: couponMeta.code,
            description: couponMeta.description,
            amount: (pricing.appliedCoupon?.amountCents ?? 0).toFixed(2) === "0.00"
              ? "0.00"
              : (pricing.appliedCoupon!.amountCents / 100).toFixed(2),
            valid: !!pricing.appliedCoupon,
            reason: pricing.appliedCoupon ? undefined : "No eligible items for this code.",
          }
        : null,
      taxRate: settings.taxRate,
    };
  }

  async availableCoupon(code: string, userId?: string | null) {
    const normalized = code.trim().toUpperCase();
    const found = await this.prisma.coupon.findUnique({
      where: { code: normalized },
      select: { code: true, description: true, minOrderSubtotal: true, endsAt: true, isActive: true },
    });
    if (!found || !found.isActive || found.endsAt < new Date()) {
      throw AppError.validation("This discount code isn't valid.");
    }
    return { code: found.code, description: found.description };
  }

  /** Invalidates cached pricing settings after an admin settings update. */
  async invalidate() {
    await this.cache.del("settings:commerce");
  }
}
