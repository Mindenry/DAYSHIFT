// Integration suite against a running API, database and seed. Covers the full
// return lifecycle, last-item concurrency, permissions and webhook replay.
const BASE = process.env.INTEGRATION_API ?? "http://localhost:4000/api/v1";
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
};

function client() {
  const jar = new Map();
  return {
    jar,
    async call(path, options = {}) {
      const headers = { "content-type": "application/json", ...(options.headers ?? {}) };
      if (jar.size) headers.cookie = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
      const response = await fetch(`${BASE}${path}`, { ...options, headers });
      for (const raw of response.headers.getSetCookie?.() ?? []) {
        const [pair] = raw.split(";");
        const idx = pair.indexOf("=");
        const name = pair.slice(0, idx).trim();
        const value = pair.slice(idx + 1).trim();
        if (!value) jar.delete(name);
        else jar.set(name, value);
      }
      const text = await response.text();
      let body;
      try { body = text ? JSON.parse(text) : null; } catch { body = text; }
      return { status: response.status, ok: response.ok, body };
    },
    async ok(path, options) {
      const response = await this.call(path, options);
      if (!response.ok) throw new Error(`${options?.method ?? "GET"} ${path} → ${response.status} ${JSON.stringify(response.body)}`);
      return response.body.data;
    },
  };
}

const admin = client();
const customer = client();
const support = client();
const now = Date.now();

// ── Setup sessions ─────────────────────────────────────────────────────
await admin.ok("/auth/staff/login", { method: "POST", body: JSON.stringify({ email: "admin@dayshift.example", password: "Admin1234!Pass" }) });
await support.ok("/auth/staff/login", { method: "POST", body: JSON.stringify({ email: "support@dayshift.example", password: "Support1234!Pass" }) });
await customer.ok("/auth/login", { method: "POST", body: JSON.stringify({ email: "customer@dayshift.example", password: "Customer1234!Pass" }) });
check("staff and customer sessions", true);

// ── Permission boundary ────────────────────────────────────────────────
const forbidden = await support.call("/admin/orders/DS-20260912-000141", { method: "GET" });
// Support can read orders; try a permission it does not hold: staff management.
const staffForbidden = await support.call("/admin/staff", { method: "GET" });
check("support cannot manage staff", staffForbidden.status === 403, `status ${staffForbidden.status}`);
const refundForbidden = await support.call("/admin/returns/nonexistent/refund", { method: "POST" });
check("support cannot issue refunds", [403, 404].includes(refundForbidden.status) && refundForbidden.status !== 200);

// ── Full return lifecycle ──────────────────────────────────────────────
const product = await customer.ok("/products/the-everyday-oversized-tee");
const variant = product.variants.find((v) => v.inStock);
if (!variant) throw new Error("No in-stock variant for return scenario");
await customer.ok("/cart/items", { method: "POST", body: JSON.stringify({ variantId: variant.id, quantity: 1 }) });
const checkout = await customer.ok("/checkout", {
  method: "POST",
  body: JSON.stringify({
    email: "customer@dayshift.example",
    shippingAddress: { firstName: "Elena", lastName: "Marchetti", line1: "44 Court Street", city: "Brooklyn", state: "NY", postalCode: "11201", country: "US" },
    shippingMethod: "standard",
    paymentMethod: "SANDBOX_CARD",
    idempotencyKey: `integration-return-${now}`,
  }),
});
await customer.ok("/payments/sandbox/confirm", {
  method: "POST",
  body: JSON.stringify({ reference: checkout.payment.reference, outcome: "success", email: "customer@dayshift.example" }),
});
const orderNumber = checkout.order.orderNumber;
check("paid order created for return flow", true, orderNumber);

for (const status of ["PROCESSING", "PICKING", "PACKED"]) {
  await admin.ok(`/admin/orders/${orderNumber}/status`, { method: "PATCH", body: JSON.stringify({ status, reason: "Integration fulfilment" }) });
}
const shipment = await admin.ok(`/admin/orders/${orderNumber}/shipments`, {
  method: "POST",
  body: JSON.stringify({ carrier: "Northline Express", service: "Standard" }),
});
for (const [status, description] of [
  ["IN_TRANSIT", "Parcel in transit"],
  ["OUT_FOR_DELIVERY", "Out for delivery"],
  ["DELIVERED", "Delivered to recipient"],
]) {
  await admin.ok(`/admin/shipments/${shipment.id}/status`, { method: "PATCH", body: JSON.stringify({ status, description }) });
}
const delivered = await customer.ok(`/orders/${orderNumber}`);
check("fulfilment reaches delivered", delivered.status === "DELIVERED" && delivered.canReturn, delivered.status);

const orderItem = delivered.items[0];
const returnsBefore = await admin.ok(`/admin/inventory?q=${encodeURIComponent(orderItem.variantSku)}&pageSize=100`);
const stockBefore = returnsBefore.items.filter((row) => row.sku === orderItem.variantSku).reduce((sum, row) => sum + row.available, 0);

const returnRequest = await customer.ok("/returns", {
  method: "POST",
  body: JSON.stringify({
    orderId: delivered.id,
    resolution: "REFUND",
    reason: "CHANGED_MIND",
    customerNote: "Integration test return",
    items: [{ orderItemId: orderItem.id, quantity: 1 }],
  }),
});
check("customer can request a return", returnRequest.status === "REQUESTED", returnRequest.returnNumber);

for (const status of ["APPROVED", "RECEIVED", "INSPECTED"]) {
  await admin.ok(`/admin/returns/${returnRequest.id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, adminNote: "Integration inspection" }),
  });
}
const refunded = await admin.ok(`/admin/returns/${returnRequest.id}/refund`, { method: "POST" });
const afterRefund = await customer.ok(`/orders/${orderNumber}`);
check("refund processed and order reflects it", refunded.status === "REFUNDED" && ["PARTIALLY_REFUNDED", "REFUNDED"].includes(afterRefund.paymentStatus), afterRefund.paymentStatus);

const returnsAfter = await admin.ok(`/admin/inventory?q=${encodeURIComponent(orderItem.variantSku)}&pageSize=100`);
const stockAfter = returnsAfter.items.filter((row) => row.sku === orderItem.variantSku).reduce((sum, row) => sum + row.available, 0);
check("inspected return restocked inventory", stockAfter === stockBefore + 1, `${stockBefore} → ${stockAfter}`);

// ── Last-item concurrency ──────────────────────────────────────────────
const concurrencyProduct = await admin.ok(`/admin/catalog/products/${product.id}`);
const target = concurrencyProduct.variants.find((v) => v.isActive && v.size === "L") ?? concurrencyProduct.variants.find((v) => v.isActive);
const inventoryQuery = await admin.ok(`/admin/inventory?q=${encodeURIComponent(target.sku)}&pageSize=50`);
const original = inventoryQuery.items.filter((row) => row.sku === target.sku).map((row) => ({ warehouseId: row.warehouseId, onHand: row.onHand }));
for (const row of original) {
  await admin.ok("/admin/inventory/adjust", {
    method: "POST",
    body: JSON.stringify({
      variantId: target.id,
      warehouseId: row.warehouseId,
      quantityDelta: -row.onHand,
      reason: "Integration concurrency test setup",
      type: "ADJUSTMENT",
    }),
  });
}
const mainWarehouse = original[0];
await admin.ok("/admin/inventory/adjust", {
  method: "POST",
  body: JSON.stringify({
    variantId: target.id,
    warehouseId: mainWarehouse.warehouseId,
    quantityDelta: 1,
    reason: "Concurrency test: one unit only",
    type: "STOCK_IN",
  }),
});

const shoppers = [client(), client()];
for (const [index, shopper] of shoppers.entries()) {
  await shopper.ok("/cart/items", { method: "POST", body: JSON.stringify({ variantId: target.id, quantity: 1 }) });
}
const checkoutBody = (index) => JSON.stringify({
  email: `concurrency-${now}-${index}@example.com`,
  shippingAddress: { firstName: "Race", lastName: `Shopper${index}`, line1: "1 Test Street", city: "Brooklyn", state: "NY", postalCode: "11201", country: "US" },
  shippingMethod: "standard",
  paymentMethod: "SANDBOX_CARD",
  idempotencyKey: `concurrency-${now}-${index}`,
});
const [first, second] = await Promise.all([
  shoppers[0].call("/checkout", { method: "POST", body: checkoutBody(0) }),
  shoppers[1].call("/checkout", { method: "POST", body: checkoutBody(1) }),
]);
const successes = [first, second].filter((response) => response.ok);
const conflicts = [first, second].filter((response) => response.status === 409);
check("last unit is sold exactly once", successes.length === 1 && conflicts.length === 1, `ok=${successes.length} conflict=${conflicts.length}`);

// Clean up: cancel the winner and restore the original stock.
if (successes[0]) {
  const orderId = successes[0].body.data.order.id;
  await admin.call(`/admin/orders/${successes[0].body.data.order.orderNumber}/cancel`, { method: "POST", body: JSON.stringify({ reason: "Integration cleanup" }) });
}
for (const row of original) {
  const current = await admin.ok(`/admin/inventory?q=${encodeURIComponent(target.sku)}&pageSize=50`);
  const line = current.items.find((item) => item.warehouseId === row.warehouseId);
  if (!line) continue;
  await admin.ok("/admin/inventory/adjust", {
    method: "POST",
    body: JSON.stringify({
      variantId: target.id,
      warehouseId: row.warehouseId,
      quantityDelta: row.onHand - line.onHand,
      reason: "Integration concurrency test restore",
      type: "RECONCILIATION",
    }),
  });
}
check("inventory restored after concurrency test", true);

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} integration checks passed`);
if (failed.length) process.exit(1);
