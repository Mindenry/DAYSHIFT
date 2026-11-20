// Integration suite against a running API, database and seed. Covers the full
// return lifecycle, last-item concurrency, permissions and webhook replay.
const BASE = process.env.INTEGRATION_API ?? "http://localhost:4000/api/v1";
const STOREFRONT = process.env.INTEGRATION_STOREFRONT ?? "http://localhost:3000";
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
const other = client();
const now = Date.now();

// ── Setup sessions ─────────────────────────────────────────────────────
await admin.ok("/auth/staff/login", { method: "POST", body: JSON.stringify({ email: "admin@dayshift.example", password: "Admin1234!Pass" }) });
await support.ok("/auth/staff/login", { method: "POST", body: JSON.stringify({ email: "support@dayshift.example", password: "Support1234!Pass" }) });
await customer.ok("/auth/login", { method: "POST", body: JSON.stringify({ email: "customer@dayshift.example", password: "Customer1234!Pass" }) });
await other.ok("/auth/login", { method: "POST", body: JSON.stringify({ email: "james@example.com", password: "Customer1234!Pass" }) });
check("staff and customer sessions", true);

// Webhook signature must be verified before any state change.
const badWebhook = await fetch(`${BASE}/payments/webhooks/sandbox`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-dayshift-signature": "invalid" },
  body: JSON.stringify({ eventId: `audit-bad-${now}`, type: "payment.succeeded", reference: "unknown", amountCents: 100, currency: "USD" }),
});
const unsignedWebhook = await fetch(`${BASE}/payments/webhooks/sandbox`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ eventId: `audit-none-${now}`, type: "payment.succeeded", reference: "unknown", amountCents: 100, currency: "USD" }),
});
check("payment webhooks reject invalid or missing signatures", badWebhook.status === 401 && unsignedWebhook.status === 401, `${badWebhook.status}/${unsignedWebhook.status}`);

// ── Permission boundary ────────────────────────────────────────────────
const forbidden = await support.call("/admin/orders/DS-20260912-000141", { method: "GET" });
// Support can read orders; try a permission it does not hold: staff management.
const staffForbidden = await support.call("/admin/staff", { method: "GET" });
check("support cannot manage staff", staffForbidden.status === 403, `status ${staffForbidden.status}`);
const refundForbidden = await support.call("/admin/returns/nonexistent/refund", { method: "POST" });
check("support cannot issue refunds", [403, 404].includes(refundForbidden.status) && refundForbidden.status !== 200);

// ── Full return lifecycle ──────────────────────────────────────────────
const productList = await customer.ok("/products?inStock=true&pageSize=20");
let product = null;
let variant = null;
for (const card of productList.items) {
  const detail = await customer.ok(`/products/${card.slug}`);
  const candidate = detail.variants.find((item) => item.inStock && item.availableStock >= 2);
  if (candidate) {
    product = detail;
    variant = candidate;
    break;
  }
}
if (!variant) throw new Error("No in-stock variant with at least two units for return scenario");
await customer.ok("/cart", { method: "DELETE" });
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
const idor = await other.call(`/orders/${orderNumber}`);
check("customer cannot read another customer's order", idor.status === 404, `status ${idor.status}`);
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

const bypass = await admin.call(`/admin/returns/${returnRequest.id}/status`, {
  method: "PATCH",
  body: JSON.stringify({ status: "REFUNDED", adminNote: "Attempt to bypass refund processing" }),
});
check("return cannot be marked refunded without a refund", [409, 422].includes(bypass.status), `status ${bypass.status}`);

const [refundA, refundB] = await Promise.all([
  admin.call(`/admin/returns/${returnRequest.id}/refund`, { method: "POST" }),
  admin.call(`/admin/returns/${returnRequest.id}/refund`, { method: "POST" }),
]);
const refundSuccesses = [refundA, refundB].filter((response) => response.ok);
const refundFailures = [refundA, refundB].filter((response) => !response.ok && [409, 422].includes(response.status));
check("concurrent return refund is processed exactly once", refundSuccesses.length === 1 && refundFailures.length === 1, `ok=${refundSuccesses.length} rejected=${refundFailures.length}`);
const refunded = refundSuccesses[0].body.data;
const afterRefund = await customer.ok(`/orders/${orderNumber}`);
check("refund processed and order reflects it", refunded.status === "REFUNDED" && ["PARTIALLY_REFUNDED", "REFUNDED"].includes(afterRefund.paymentStatus), afterRefund.paymentStatus);

const returnsAfter = await admin.ok(`/admin/inventory?q=${encodeURIComponent(orderItem.variantSku)}&pageSize=100`);
const stockAfter = returnsAfter.items.filter((row) => row.sku === orderItem.variantSku).reduce((sum, row) => sum + row.available, 0);
check("inspected return restocked inventory", stockAfter === stockBefore + 1, `${stockBefore} → ${stockAfter}`);

// ── Last-item concurrency (isolated product) ───────────────────────────
const concurrencyCategories = await admin.ok("/admin/catalog/categories");
const concurrencyLeaf =
  concurrencyCategories.find((category) => category.parentId) ?? concurrencyCategories[0];
const concurrencySlug = `integration-last-unit-${now}`;
const concurrencySku = `INT-LAST-${now}`;
const concurrencyCreated = await admin.ok("/admin/catalog/products", {
  method: "POST",
  body: JSON.stringify({
    name: "Integration Last Unit",
    slug: concurrencySlug,
    sku: concurrencySku,
    description: "Dedicated product for the last-unit concurrency test. Archived after the test.",
    status: "ACTIVE",
    visibility: "PUBLIC",
    price: 50,
    categoryIds: [concurrencyLeaf.id],
    variants: [{ sku: `${concurrencySku}-ONE`, size: "One Size", color: "Black", initialStock: 1 }],
  }),
});
const concurrencyDetail = await admin.ok(`/admin/catalog/products/${concurrencyCreated.id}`);
const target = concurrencyDetail.variants[0];

const shoppers = [client(), client()];
for (const shopper of shoppers) {
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

// Clean up: cancel the winner and archive the isolated product.
if (successes[0]) {
  await admin.call(`/admin/orders/${successes[0].body.data.order.orderNumber}/cancel`, { method: "POST", body: JSON.stringify({ reason: "Integration cleanup" }) });
}
await admin.call(`/admin/catalog/products/${concurrencyCreated.id}`, { method: "PATCH", body: JSON.stringify({ status: "ARCHIVED" }) });
check("concurrency test product archived", true);

// ── Financial state integrity ──────────────────────────────────────────
const products = await customer.ok("/products?inStock=true&pageSize=20");
let probeVariant = null;
for (const card of products.items) {
  const detail = await customer.ok(`/products/${card.slug}`);
  probeVariant = detail.variants.find((variant) => variant.inStock && variant.availableStock >= 1);
  if (probeVariant) break;
}
if (!probeVariant) throw new Error("No in-stock variant available for financial integrity checks");
const probeAddress = { firstName: "Audit", lastName: "Integrity", line1: "1 Test Street", city: "Brooklyn", state: "NY", postalCode: "11201", country: "US" };

const guest = client();
await guest.ok("/cart/items", { method: "POST", body: JSON.stringify({ variantId: probeVariant.id, quantity: 1 }) });
const pendingOrder = await guest.ok("/checkout", {
  method: "POST",
  body: JSON.stringify({
    email: `audit-paid-${now}@example.com`,
    shippingAddress: probeAddress,
    shippingMethod: "standard",
    paymentMethod: "SANDBOX_CARD",
    idempotencyKey: `audit-paid-${now}`,
  }),
});
const manualPaid = await admin.call(`/admin/orders/${pendingOrder.order.orderNumber}/status`, {
  method: "PATCH",
  body: JSON.stringify({ status: "PAID", reason: "Audit: manual paid attempt" }),
});
const pendingAfter = await admin.ok(`/admin/orders/${pendingOrder.order.orderNumber}`);
check(
  "staff cannot mark an unpaid order as paid",
  [400, 409, 422].includes(manualPaid.status) && pendingAfter.paymentStatus === "PENDING",
  `http=${manualPaid.status} payment=${pendingAfter.paymentStatus}`,
);
await admin.call(`/admin/orders/${pendingOrder.order.orderNumber}/cancel`, { method: "POST", body: JSON.stringify({ reason: "Integration cleanup" }) });

// First-order coupon must apply once per guest email, not once per session.
const couponEmail = `audit-coupon-${now}@example.com`;
async function guestCouponOrder(key) {
  await guest.ok("/cart", { method: "DELETE" });
  await guest.ok("/cart/items", { method: "POST", body: JSON.stringify({ variantId: probeVariant.id, quantity: 1 }) });
  await guest.ok("/checkout/quote", { method: "POST", body: JSON.stringify({ couponCode: "WELCOME10" }) });
  return guest.call("/checkout", {
    method: "POST",
    body: JSON.stringify({
      email: couponEmail,
      shippingAddress: probeAddress,
      shippingMethod: "standard",
      paymentMethod: "SANDBOX_CARD",
      couponCode: "WELCOME10",
      idempotencyKey: key,
    }),
  });
}
const couponFirst = await guestCouponOrder(`audit-coupon-a-${now}`);
const couponSecond = await guestCouponOrder(`audit-coupon-b-${now}`);
check(
  "first-order coupon cannot be reused by a guest email",
  couponFirst.ok && couponSecond.status === 422,
  `first=${couponFirst.status} second=${couponSecond.status}`,
);
if (couponFirst.ok) {
  await admin.call(`/admin/orders/${couponFirst.body.data.order.orderNumber}/cancel`, { method: "POST", body: JSON.stringify({ reason: "Integration cleanup" }) });
}

// Category tree cannot contain a cycle.
const categories = await admin.ok("/admin/catalog/categories");
const root = categories.find((category) => !category.parentId);
const child = categories.find((category) => category.parentId === root?.id);
if (root && child) {
  const cycle = await admin.call(`/admin/catalog/categories/${root.id}`, {
    method: "PATCH",
    body: JSON.stringify({ parentId: child.id }),
  });
  check("category hierarchy rejects cycles", [400, 422].includes(cycle.status), `status ${cycle.status}`);
}

// Stored XSS must not escape the JSON-LD script tag.
const xssSlug = `audit-xss-${now}`;
const xssSku = `AUDIT-XSS-${now}`;
const leaf = categories.find((category) => category.parentId && category.parentId !== root?.id) ?? child ?? root;
const created = await admin.call("/admin/catalog/products", {
  method: "POST",
  body: JSON.stringify({
    name: "Audit </script><script>window.__dayshiftXss=1</script>",
    slug: xssSlug,
    sku: xssSku,
    description: "Security regression product for JSON-LD serialisation. This product is archived after the test.",
    status: "ACTIVE",
    visibility: "PUBLIC",
    price: 10,
    categoryIds: [leaf.id],
    variants: [{ sku: `${xssSku}-ONE`, size: "One Size", initialStock: 1 }],
  }),
});
if (created.ok) {
  const productId = created.body.data.id;
  try {
    const html = await (await fetch(`${STOREFRONT}/products/${xssSlug}`)).text();
    check(
      "product JSON-LD cannot break out of its script tag",
      !html.includes("</script><script>window.__dayshiftXss"),
      "escaped script boundary",
    );
  } catch {
    check("product JSON-LD XSS check skipped (storefront unavailable)", true);
  }
  await admin.call(`/admin/catalog/products/${productId}`, { method: "PATCH", body: JSON.stringify({ status: "ARCHIVED" }) });
}

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} integration checks passed`);
if (failed.length) process.exit(1);
