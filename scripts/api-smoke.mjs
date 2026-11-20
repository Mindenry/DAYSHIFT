// Live API smoke test: exercises the real commerce workflow end to end.
const BASE = process.env.SMOKE_API ?? "http://localhost:4000/api/v1";
const jar = new Map();

function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}
function storeCookies(res) {
  const set = res.headers.getSetCookie?.() ?? [];
  for (const raw of set) {
    const [pair] = raw.split(";");
    const idx = pair.indexOf("=");
    const name = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    if (value === "") jar.delete(name);
    else jar.set(name, value);
  }
}
async function api(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(jar.size ? { cookie: cookieHeader() } : {}),
      ...(options.headers ?? {}),
    },
  });
  storeCookies(res);
  const text = await res.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) throw new Error(`${options.method ?? "GET"} ${path} -> ${res.status} ${JSON.stringify(body)}`);
  return body;
}
const money = (v) => Number(v);

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}

// Public catalogue
const cats = await api("/categories");
check("category tree", Array.isArray(cats.data) && cats.data.length >= 5, `${cats.data.length} roots`);
const products = await api("/products?pageSize=6&sort=newest");
check("product listing", products.data.items.length === 6 && products.data.meta.total >= 30, `${products.data.meta.total} products`);
const slug = products.data.items[0].slug;
const detail = await api(`/products/${slug}`);
check("product detail", detail.data.variants.length > 0, `${detail.data.name} / ${detail.data.variants.length} variants`);
const inStock = detail.data.variants.find((v) => v.inStock);
check("variant availability", !!inStock, inStock?.sku);
const facets = await api(`/products/facets?category=women`);
check("facets", facets.data.sizes.length > 0 && facets.data.colors.length > 0);

// Guest cart
const added = await api("/cart/items", { method: "POST", body: JSON.stringify({ variantId: inStock.id, quantity: 1 }) });
check("guest cart add", added.data.lines.length === 1 && jar.has("ds_cart"), `subtotal ${added.data.subtotal}`);
const quote = await api("/checkout/quote", { method: "POST", body: JSON.stringify({ shippingMethod: "standard" }) });
check("checkout quote", money(quote.data.total) > 0, `total ${quote.data.total}`);

// Login merges guest cart
const login = await api("/auth/login", { method: "POST", body: JSON.stringify({ email: "customer@dayshift.example", password: "Customer1234!Pass" }) });
check("customer login", login.data.kind === "customer", login.data.email);
const cartAfter = await api("/cart");
check("cart merged after login", cartAfter.data.lines.length >= 1);
const overview = await api("/account/overview");
check("account overview", overview.data.orderCount >= 4, `${overview.data.orderCount} orders`);

// Checkout
const idemKey = `smoke-${Date.now()}`;
const email = "customer@dayshift.example";
const checkoutBody = {
  email,
  shippingAddress: {
    firstName: "Elena", lastName: "Marchetti", line1: "44 Court Street", line2: "Apt 3B",
    city: "Brooklyn", state: "NY", postalCode: "11201", country: "US", phone: "+1 555 0100",
  },
  shippingMethod: "standard",
  paymentMethod: "SANDBOX_CARD",
  customerNote: "Smoke test order",
  idempotencyKey: idemKey,
  saveAddress: false,
};
const order = await api("/checkout", { method: "POST", body: JSON.stringify(checkoutBody) });
check("order created", order.data.order.status === "PENDING_PAYMENT", order.data.order.orderNumber);
const duplicate = await api("/checkout", { method: "POST", body: JSON.stringify(checkoutBody) });
check("checkout idempotency", duplicate.data.duplicate === true && duplicate.data.order.orderNumber === order.data.order.orderNumber);

const confirm = await api("/payments/sandbox/confirm", {
  method: "POST",
  body: JSON.stringify({ reference: order.data.payment.reference, outcome: "success", email }),
});
check("sandbox payment", confirm.data.order?.paymentStatus === "PAID", confirm.data.order?.status);
const paidOrder = await api(`/orders/${order.data.order.orderNumber}`);
check("paid order readback", paidOrder.data.paymentStatus === "PAID", paidOrder.data.status);

// Replay the webhook with the same id (idempotency)
const webhookBody = JSON.stringify({ eventId: "smoke-dup-event", type: "payment.succeeded", reference: order.data.payment.reference, amountCents: Math.round(money(order.data.order.grandTotal) * 100), currency: "USD" });
const { createHmac } = await import("node:crypto");
const signature = createHmac("sha256", "dev-only-sandbox-payment-secret-9b1e7d").update(webhookBody).digest("hex");
const w1 = await api("/payments/webhooks/sandbox", { method: "POST", body: webhookBody, headers: { "x-dayshift-signature": signature } });
const w2 = await api("/payments/webhooks/sandbox", { method: "POST", body: webhookBody, headers: { "x-dayshift-signature": signature } });
check("webhook signature + duplicate protection", w1.data.received && w2.data.duplicate === true);

// Admin
jar.clear();
const admin = await api("/auth/staff/login", { method: "POST", body: JSON.stringify({ email: "admin@dayshift.example", password: "Admin1234!Pass" }) });
check("staff login", admin.data.kind === "staff" && admin.data.permissions.length > 10, admin.data.staffRole);
const dash = await api("/admin/dashboard");
check("admin dashboard", money(dash.data.grossSales) > 0, `gross ${dash.data.grossSales}`);
const adminOrders = await api("/admin/orders?pageSize=5");
check("admin orders", adminOrders.data.items.length > 0, `${adminOrders.data.meta.total} orders`);
const audit = await api("/admin/audit");
check("audit log", audit.data.items.length > 0, `${audit.data.meta.total} entries`);
const inv = await api("/admin/inventory?pageSize=5");
check("admin inventory", inv.data.items.length === 5, `${inv.data.meta.total} rows`);
const customers = await api("/admin/customers");
check("admin customers", customers.data.items.length > 0);
const lowStock = await api("/admin/inventory/low-stock");
check("low stock view", Array.isArray(lowStock.data));
const returns = await api("/admin/returns");
check("admin returns", Array.isArray(returns.data.items));

// Unauthorized check (customer hitting admin API)
jar.clear();
await api("/auth/login", { method: "POST", body: JSON.stringify({ email: "customer@dayshift.example", password: "Customer1234!Pass" }) });
try {
  await api("/admin/dashboard");
  check("customer blocked from admin", false);
} catch (error) {
  check("customer blocked from admin", String(error).includes("403"));
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) process.exit(1);
