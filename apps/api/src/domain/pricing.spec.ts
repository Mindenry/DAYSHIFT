import { computePricing, PricingLine, PromotionRule } from "./pricing";

const baseLine: PricingLine = {
  id: "line-1",
  productId: "p1",
  categoryIds: ["c1"],
  collectionIds: ["col1"],
  unitPriceCents: 4500,
  quantity: 3,
};

const shipping = {
  methodCode: "standard",
  standardCents: 795,
  expressCents: 1495,
  freeOverCents: 15000,
};

describe("pricing engine", () => {
  it("calculates subtotal, shipping, tax and total in integer cents", () => {
    const result = computePricing({
      lines: [baseLine],
      promotions: [],
      shipping,
      taxRate: 0.08,
    });
    expect(result.subtotalCents).toBe(13500);
    expect(result.discountTotalCents).toBe(0);
    expect(result.shippingCents).toBe(795);
    expect(result.taxCents).toBe(1080);
    expect(result.totalCents).toBe(15375);
  });

  it("makes standard shipping free once the post-discount threshold is met", () => {
    const result = computePricing({
      lines: [{ ...baseLine, unitPriceCents: 8000, quantity: 2 }],
      promotions: [],
      shipping,
      taxRate: 0.08,
    });
    expect(result.shippingCents).toBe(0);
  });

  it("applies only the most valuable automatic promotion", () => {
    const promotions: PromotionRule[] = [
      {
        id: "ten-percent",
        name: "10% off",
        type: "PERCENTAGE",
        value: 10,
        scope: "ALL",
        minSubtotalCents: 0,
        priority: 1,
      },
      {
        id: "fixed-25",
        name: "$25 off",
        type: "FIXED",
        value: 2500,
        scope: "ALL",
        minSubtotalCents: 0,
        priority: 5,
      },
    ];
    const result = computePricing({
      lines: [{ ...baseLine, unitPriceCents: 4000, quantity: 1 }],
      promotions,
      shipping,
      taxRate: 0,
    });
    // 10% of 4000 = 400; the fixed $25 is worth 2500 and wins.
    expect(result.discountTotalCents).toBe(2500);
    expect(result.appliedPromotion?.id).toBe("fixed-25");
    expect(result.lines[0].finalLineTotalCents).toBe(1500);
  });

  it("skips a promotion whose minimum subtotal is not met", () => {
    const result = computePricing({
      lines: [{ ...baseLine, unitPriceCents: 5000, quantity: 1 }],
      promotions: [
        {
          id: "big-spend",
          name: "20% over $100",
          type: "PERCENTAGE",
          value: 20,
          scope: "ALL",
          minSubtotalCents: 10000,
          priority: 1,
        },
      ],
      shipping,
      taxRate: 0,
    });
    expect(result.discountTotalCents).toBe(0);
  });

  it("applies a coupon on top of the automatic promotion with a maximum cap", () => {
    const result = computePricing({
      lines: [{ ...baseLine, unitPriceCents: 8000, quantity: 2 }],
      promotions: [
        {
          id: "essentials",
          name: "10% essentials",
          type: "PERCENTAGE",
          value: 10,
          scope: "COLLECTION",
          collectionId: "col1",
          minSubtotalCents: 0,
          priority: 1,
        },
      ],
      coupon: {
        code: "TAKE20",
        type: "PERCENTAGE",
        value: 20,
        minOrderSubtotalCents: 12000,
        maxDiscountCents: 2000,
      },
      shipping,
      taxRate: 0,
    });
    // Base 16000, promotion −1600 → 14400; 20% = 2880 but capped at 2000.
    expect(result.promotionDiscountCents).toBe(1600);
    expect(result.couponDiscountCents).toBe(2000);
    expect(result.discountTotalCents).toBe(3600);
    expect(result.appliedCoupon?.code).toBe("TAKE20");
  });

  it("ignores a coupon below its minimum order value", () => {
    const result = computePricing({
      lines: [{ ...baseLine, unitPriceCents: 5000, quantity: 1 }],
      promotions: [],
      coupon: {
        code: "MIN100",
        type: "FIXED",
        value: 1000,
        minOrderSubtotalCents: 10000,
      },
      shipping,
      taxRate: 0,
    });
    expect(result.couponDiscountCents).toBe(0);
    expect(result.appliedCoupon).toBeNull();
    expect(result.totalCents).toBe(5795);
  });

  it("caps a fixed coupon at the eligible line value", () => {
    const result = computePricing({
      lines: [{ ...baseLine, unitPriceCents: 1000, quantity: 1 }],
      promotions: [],
      coupon: {
        code: "BIG",
        type: "FIXED",
        value: 5000,
        minOrderSubtotalCents: 0,
      },
      shipping,
      taxRate: 0,
    });
    expect(result.discountTotalCents).toBe(1000);
    expect(result.totalCents).toBe(795);
  });

  it("only discounts lines matching coupon restrictions", () => {
    const result = computePricing({
      lines: [
        { ...baseLine, id: "a", productId: "p1", unitPriceCents: 5000, quantity: 1 },
        { ...baseLine, id: "b", productId: "p2", unitPriceCents: 5000, quantity: 1 },
      ],
      promotions: [],
      coupon: {
        code: "P1ONLY",
        type: "PERCENTAGE",
        value: 50,
        minOrderSubtotalCents: 0,
        eligibleProductIds: ["p1"],
      },
      shipping,
      taxRate: 0,
    });
    expect(result.couponDiscountCents).toBe(2500);
    expect(result.lines.find((line) => line.id === "b")?.couponDiscountCents).toBe(0);
  });
});
