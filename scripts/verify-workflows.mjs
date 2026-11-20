// End-to-end verification of customer account, support, fulfilment, review,
// loyalty and cancellation flows that the shorter suites do not cover.
const BASE = process.env.VERIFY_API ?? "http://192.168.1.107:4000/api/v1";
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
        if (!value) jar.delete(name);
        else jar.set(name, value);
      }
      const text = await res.text();
      let body;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = text;
      }
      return { status: res.status, ok: res.ok, body };
    },
    async ok(path, options) {
      const res = await this.call(path, options);
      if (!res.ok) throw new Error(`${options?.method ?? "GET"} ${path} → ${res.status} ${JSON.stringify(res.body)}`);
      return res.body.data;
    },
  };
}

const now = Date.now();
const email = `verify-${now}@example.com`;
const password = "Verify1234!Pass";
const customer = client();
const other = client();
const admin = client();

// Authentication and account creation
const registered = await customer.ok("/auth/register", {
  method: "POST",
  body: JSON.stringify({ firstName: "Verify", lastName: "Customer", email, password }),
});
check("customer registration", registered.email === email, registered.email);
const duplicate = await client().call("/auth/register", {
  method: "POST",
  body: JSON.stringify({ firstName: "Verify", lastName: "Customer", email, password }),
});
check("duplicate registration rejected", [409, 422].includes(duplicate.status), `status ${duplicate.status}`);
const wrongLogin = await client().call("/auth/login", {
  method: "POST",
  body: JSON.stringify({ email, password: "WrongPassword1" }),
});
check("wrong password rejected", wrongLogin.status === 401, `status ${wrongLogin.status}`);
const me = await customer.ok("/auth/me");
check("session identity", me.email === email, me.email);

// Address book
const address = await customer.ok("/account/addresses", {
  method: "POST",
  body: JSON.stringify({
    label: "Home",
    firstName: "Verify",
    lastName: "Customer",
    line1: "1 Verification Street",
    city: "Brooklyn",
    state: "NY",
    postalCode: "11201",
    country: "US",
    isDefaultShipping: true,
  }),
});
const addresses = await customer.ok("/account/addresses");
check("address created and listed", addresses.some((item) => item.id === address.id), `count ${addresses.length}`);

// Catalogue selection
const cards = await customer.ok("/products?inStock=true&pageSize=12");
let product = null;
let variant = null;
for (const card of cards.items) {
  const detail = await customer.ok(`/products/${card.slug}`);
  const candidate = detail.variants.find((item) => item.inStock && item.availableStock >= 1);
  if (candidate) {
    product = detail;
    variant = candidate;
    break;
  }
}
if (!variant) throw new Error("No in-stock variant available");
const secondCard = cards.items.find((item) => item.slug !== product.slug);
const secondDetail = secondCard ? await customer.ok(`/products/${secondCard.slug}`) : null;
const secondVariant = secondDetail?.variants.find((item) => item.inStock && item.availableStock >= 1);

// Wishlist
await customer.ok("/wishlist/items", {
  method: "POST",
  body: JSON.stringify({ productId: product.id, variantId: variant.id }),
});
const wishlist = await customer.ok("/wishlist");
check("wishlist add", wishlist.items.some((item) => item.product.id === product.id));
await customer.ok(`/wishlist/items/${product.id}`, { method: "DELETE" });
const wishlistAfter = await customer.ok("/wishlist");
check("wishlist remove", !wishlistAfter.items.some((item) => item.product.id === product.id));

// Review without a delivered purchase must be rejected
const prematureReview = await customer.call("/reviews", {
  method: "POST",
  body: JSON.stringify({ productId: product.id, rating: 5, body: "This review should be rejected before delivery." }),
});
check("review requires a delivered purchase", prematureReview.status === 403, `status ${prematureReview.status}`);

// Support ticket
const ticket = await customer.ok("/support/tickets", {
  method: "POST",
  body: JSON.stringify({
    subject: "Verification ticket",
    description: "Automated end-to-end verification of the customer support flow.",
    priority: "NORMAL",
  }),
});
await customer.ok(`/support/tickets/${ticket.id}/messages`, {
  method: "POST",
  body: JSON.stringify({ body: "Customer follow-up message." }),
});
const ticketDetail = await customer.ok(`/support/tickets/${ticket.id}`);
check("support ticket and customer reply", ticketDetail.messages.length >= 2, `${ticketDetail.messages.length} messages`);

await admin.ok("/auth/staff/login", {
  method: "POST",
  body: JSON.stringify({ email: "admin@dayshift.example", password: "Admin1234!Pass" }),
});
await admin.ok(`/admin/tickets/${ticket.id}/reply`, {
  method: "POST",
  body: JSON.stringify({ body: "Support agent reply from verification.", internal: false }),
});
await admin.ok(`/admin/tickets/${ticket.id}`, { method: "PATCH", body: JSON.stringify({ status: "RESOLVED" }) });
const ticketAfter = await customer.ok(`/support/tickets/${ticket.id}`);
check(
  "support agent reply and status",
  ticketAfter.status === "RESOLVED" && ticketAfter.messages.some((m) => m.body.includes("Support agent reply")),
  ticketAfter.status,
);

// Order, payment and loyalty
await customer.ok("/cart", { method: "DELETE" });
await customer.ok("/cart/items", { method: "POST", body: JSON.stringify({ variantId: variant.id, quantity: 1 }) });
const checkout = await customer.ok("/checkout", {
  method: "POST",
  body: JSON.stringify({
    email,
    shippingAddress: {
      firstName: "Verify",
      lastName: "Customer",
      line1: "1 Verification Street",
      city: "Brooklyn",
      state: "NY",
      postalCode: "11201",
      country: "US",
    },
    shippingMethod: "standard",
    paymentMethod: "SANDBOX_CARD",
    idempotencyKey: `verify-order-${now}`,
  }),
});
const orderNumber = checkout.order.orderNumber;
await customer.ok("/payments/sandbox/confirm", {
  method: "POST",
  body: JSON.stringify({ reference: checkout.payment.reference, outcome: "success", email }),
});
const paid = await customer.ok(`/orders/${orderNumber}`);
check("paid order", paid.paymentStatus === "PAID", `${paid.status}/${paid.paymentStatus}`);
const loyalty = await customer.ok("/account/loyalty");
check("loyalty points awarded", loyalty.pointsBalance > 0, `${loyalty.pointsBalance} points`);

// Fulfilment to delivered
for (const status of ["PROCESSING", "PICKING", "PACKED"]) {
  await admin.ok(`/admin/orders/${orderNumber}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, reason: "Verification fulfilment" }),
  });
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
  await admin.ok(`/admin/shipments/${shipment.id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, description }),
  });
}
const delivered = await customer.ok(`/orders/${orderNumber}`);
check("order delivered and returnable", delivered.status === "DELIVERED" && delivered.canReturn, delivered.status);

// IDOR: another customer must not read the order
await other.ok("/auth/login", {
  method: "POST",
  body: JSON.stringify({ email: "james@example.com", password: "Customer1234!Pass" }),
});
const idor = await other.call(`/orders/${orderNumber}`);
check("another customer cannot read the order", idor.status === 404, `status ${idor.status}`);

// Review after delivery, then admin approval
const review = await customer.ok("/reviews", {
  method: "POST",
  body: JSON.stringify({
    productId: product.id,
    rating: 5,
    title: "Verified purchase review",
    body: "Comfortable, well cut and exactly as described after delivery.",
  }),
});
check("verified review accepted", review.status === "PENDING", review.status);
await admin.ok(`/admin/reviews/${review.id}`, { method: "PATCH", body: JSON.stringify({ status: "APPROVED" }) });
const productAfter = await customer.ok(`/products/${product.slug}`);
check(
  "approved review is public",
  (productAfter.reviews ?? []).some((item) => item.id === review.id),
  `${(productAfter.reviews ?? []).length} reviews`,
);

// Customer cancellation with refund
if (secondVariant) {
  await customer.ok("/cart", { method: "DELETE" });
  await customer.ok("/cart/items", { method: "POST", body: JSON.stringify({ variantId: secondVariant.id, quantity: 1 }) });
  const cancelCheckout = await customer.ok("/checkout", {
    method: "POST",
    body: JSON.stringify({
      email,
      shippingAddress: {
        firstName: "Verify",
        lastName: "Customer",
        line1: "1 Verification Street",
        city: "Brooklyn",
        state: "NY",
        postalCode: "11201",
        country: "US",
      },
      shippingMethod: "standard",
      paymentMethod: "SANDBOX_CARD",
      idempotencyKey: `verify-cancel-${now}`,
    }),
  });
  await customer.ok("/payments/sandbox/confirm", {
    method: "POST",
    body: JSON.stringify({ reference: cancelCheckout.payment.reference, outcome: "success", email }),
  });
  const cancelled = await customer.call(`/orders/${cancelCheckout.order.orderNumber}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason: "Verification cancellation" }),
  });
  const cancelledOrder = await customer.ok(`/orders/${cancelCheckout.order.orderNumber}`);
  check(
    "customer cancellation and refund",
    cancelled.ok && cancelledOrder.status === "CANCELLED" && cancelledOrder.refunds.length > 0,
    `${cancelledOrder.status}/${cancelledOrder.refunds.length} refunds`,
  );
}

// Account export and notification surfaces
const exported = await customer.ok("/account/export");
check("account data export", exported.profile?.email === email && Array.isArray(exported.orders));
const notifications = await customer.ok("/account/notifications");
check("notification list", Array.isArray(notifications.items));

const failed = results.filter((ok) => !ok).length;
console.log(`\n${results.length - failed}/${results.length} workflow checks passed`);
if (failed) process.exit(1);
