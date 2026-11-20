// End-to-end exchange workflow against the live API.
const BASE = process.env.EXCHANGE_API ?? "http://localhost:4000/api/v1";
const results = [];
const check = (name, ok, detail = "") => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
};

function client() {
  const jar = new Map();
  return {
    async call(path, options = {}) {
      const headers = { "content-type": "application/json", ...(options.headers ?? {}) };
      if (jar.size) headers.cookie = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
      const res = await fetch(`${BASE}${path}`, { ...options, headers });
      for (const raw of res.headers.getSetCookie?.() ?? []) {
        const [pair] = raw.split(";");
        const i = pair.indexOf("=");
        const name = pair.slice(0, i).trim();
        const value = pair.slice(i + 1).trim();
        if (!value) jar.delete(name); else jar.set(name, value);
      }
      const text = await res.text();
      let body; try { body = text ? JSON.parse(text) : null; } catch { body = text; }
      return { status: res.status, ok: res.ok, body };
    },
    async ok(path, options) {
      const r = await this.call(path, options);
      if (!r.ok) throw new Error(`${options?.method ?? "GET"} ${path} → ${r.status} ${JSON.stringify(r.body)}`);
      return r.body.data;
    },
  };
}

const admin = client();
const customer = client();
const now = Date.now();
await admin.ok("/auth/staff/login", { method: "POST", body: JSON.stringify({ email: "admin@dayshift.example", password: "Admin1234!Pass" }) });
await customer.ok("/auth/login", { method: "POST", body: JSON.stringify({ email: "customer@dayshift.example", password: "Customer1234!Pass" }) });

const cards = await customer.ok("/products?inStock=true&pageSize=30");
let product = null;
let original = null;
for (const card of cards.items) {
  const detail = await customer.ok(`/products/${card.slug}`);
  const inStock = detail.variants.filter((variant) => variant.inStock);
  if (inStock.length >= 2) {
    product = detail;
    original = inStock[0];
    break;
  }
}
if (!original) throw new Error("No product with two in-stock variants for exchange test");
const replacement = product.variants.find((variant) => variant.inStock && variant.id !== original.id);

const stockOf = async (sku) => {
  const rows = await admin.ok(`/admin/inventory?q=${encodeURIComponent(sku)}&pageSize=100`);
  return rows.items.filter((row) => row.sku === sku).reduce((sum, row) => sum + row.available, 0);
};
const originalBefore = await stockOf(original.sku);
const replacementBefore = await stockOf(replacement.sku);

await customer.ok("/cart", { method: "DELETE" });
await customer.ok("/cart/items", { method: "POST", body: JSON.stringify({ variantId: original.id, quantity: 1 }) });
const checkout = await customer.ok("/checkout", {
  method: "POST",
  body: JSON.stringify({
    email: "customer@dayshift.example",
    shippingAddress: { firstName: "Elena", lastName: "Marchetti", line1: "44 Court Street", city: "Brooklyn", state: "NY", postalCode: "11201", country: "US" },
    shippingMethod: "standard",
    paymentMethod: "SANDBOX_CARD",
    idempotencyKey: `exchange-${now}`,
  }),
});
await customer.ok("/payments/sandbox/confirm", {
  method: "POST",
  body: JSON.stringify({ reference: checkout.payment.reference, outcome: "success", email: "customer@dayshift.example" }),
});
const orderNumber = checkout.order.orderNumber;
for (const status of ["PROCESSING", "PICKING", "PACKED"]) {
  await admin.ok(`/admin/orders/${orderNumber}/status`, { method: "PATCH", body: JSON.stringify({ status, reason: "Exchange fulfilment" }) });
}
const shipment = await admin.ok(`/admin/orders/${orderNumber}/shipments`, { method: "POST", body: JSON.stringify({ carrier: "Northline Express", service: "Standard" }) });
for (const [status, description] of [["IN_TRANSIT", "In transit"], ["OUT_FOR_DELIVERY", "Out for delivery"], ["DELIVERED", "Delivered"]]) {
  await admin.ok(`/admin/shipments/${shipment.id}/status`, { method: "PATCH", body: JSON.stringify({ status, description }) });
}
const order = await customer.ok(`/orders/${orderNumber}`);
check("order delivered and returnable", order.status === "DELIVERED" && order.canReturn);
const originalBeforeReturn = await stockOf(original.sku);
const replacementBeforeReturn = await stockOf(replacement.sku);

const request = await customer.ok("/returns", {
  method: "POST",
  body: JSON.stringify({
    orderId: order.id,
    resolution: "EXCHANGE",
    reason: "WRONG_SIZE",
    customerNote: "Exchange for the other variant",
    items: [{ orderItemId: order.items[0].id, quantity: 1, exchangeVariantId: replacement.id }],
  }),
});
check("exchange request accepted", request.resolution === "EXCHANGE" && request.items[0].exchangeVariant, replacement.sku);

for (const status of ["APPROVED", "RECEIVED", "INSPECTED"]) {
  await admin.ok(`/admin/returns/${request.id}/status`, { method: "PATCH", body: JSON.stringify({ status, adminNote: "Exchange inspection" }) });
}
const inspected = await admin.ok(`/admin/returns/${request.id}`);
check("exchange inspected and replacement recorded", inspected.status === "INSPECTED" && inspected.items[0].exchangeVariant?.id === replacement.id);

const originalAfter = await stockOf(original.sku);
const replacementAfter = await stockOf(replacement.sku);
check("returned item restocked", originalAfter === originalBeforeReturn + 1, `${originalBeforeReturn} → ${originalAfter}`);
check("replacement stock consumed", replacementAfter === replacementBeforeReturn - 1, `${replacementBeforeReturn} → ${replacementAfter}`);

const orderAfter = await customer.ok(`/orders/${orderNumber}`);
check("order reflects returned state", ["RETURNED", "PARTIALLY_RETURNED"].includes(orderAfter.status), orderAfter.status);
check("no refund was issued for an exchange", orderAfter.refunds.length === 0);

await admin.ok(`/admin/returns/${request.id}/status`, { method: "PATCH", body: JSON.stringify({ status: "CLOSED", adminNote: "Exchange complete" }) });
check("exchange can be closed", true);

const failed = results.filter((ok) => !ok).length;
console.log(`\n${results.length - failed}/${results.length} exchange checks passed`);
if (failed) process.exit(1);
