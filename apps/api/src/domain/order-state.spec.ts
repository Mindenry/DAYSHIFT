import { canTransition, INVENTORY_COMMITTED_STATUSES, isTerminalStatus } from "@dayshift/config";
import { toCents, centsToDecimalString, resolveShippingCents, COMMERCE } from "@dayshift/config";

describe("order state machine", () => {
  it("allows the fulfilment chain", () => {
    expect(canTransition("PENDING_PAYMENT", "PAID")).toBe(true);
    expect(canTransition("PAID", "PROCESSING")).toBe(true);
    expect(canTransition("PROCESSING", "PICKING")).toBe(true);
    expect(canTransition("PICKING", "PACKED")).toBe(true);
    expect(canTransition("PACKED", "SHIPPED")).toBe(true);
    expect(canTransition("SHIPPED", "DELIVERED")).toBe(true);
    expect(canTransition("DELIVERED", "COMPLETED")).toBe(true);
  });

  it("rejects skipped and backwards transitions", () => {
    expect(canTransition("PENDING_PAYMENT", "SHIPPED")).toBe(false);
    expect(canTransition("PAID", "PICKING")).toBe(false);
    expect(canTransition("DELIVERED", "SHIPPED")).toBe(false);
    expect(canTransition("CANCELLED", "PAID")).toBe(false);
  });

  it("treats cancelled and refunded as terminal", () => {
    expect(isTerminalStatus("CANCELLED")).toBe(true);
    expect(isTerminalStatus("REFUNDED")).toBe(true);
    expect(isTerminalStatus("PAID")).toBe(false);
  });

  it("holds inventory for paid, unshipped and delivered orders", () => {
    expect(INVENTORY_COMMITTED_STATUSES).toContain("PAID");
    expect(INVENTORY_COMMITTED_STATUSES).toContain("COMPLETED");
    expect(INVENTORY_COMMITTED_STATUSES).not.toContain("PENDING_PAYMENT");
    expect(INVENTORY_COMMITTED_STATUSES).not.toContain("CANCELLED");
  });
});

describe("money helpers", () => {
  it("parses decimal strings without floating point drift", () => {
    expect(toCents("0.1")).toBe(10);
    expect(toCents("19.99")).toBe(1999);
    expect(toCents("1234.5")).toBe(123450);
    expect(centsToDecimalString(1999)).toBe("19.99");
    expect(centsToDecimalString(10)).toBe("0.10");
  });

  it("round-trips the price of every seeded order value", () => {
    for (const value of ["45.00", "167.40", "0.99", "1299.95"]) {
      expect(centsToDecimalString(toCents(value))).toBe(value);
    }
  });

  it("rejects malformed monetary input", () => {
    expect(() => toCents("12.345")).toThrow();
    expect(() => toCents("abc")).toThrow();
  });

  it("applies the free-shipping threshold after discounts", () => {
    expect(resolveShippingCents("standard", 14999)).toBe(COMMERCE.shipping.standard.priceCents);
    expect(resolveShippingCents("standard", 15000)).toBe(0);
    expect(resolveShippingCents("express", 50000)).toBe(COMMERCE.shipping.express.priceCents);
  });
});
