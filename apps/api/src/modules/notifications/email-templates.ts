const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export function money(cents: number, currency = "THB") {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(cents / 100);
}

function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#F2EEE5;font-family:Helvetica,Arial,sans-serif;color:#1A1917">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px">
    <div style="letter-spacing:6px;font-size:14px;margin-bottom:36px">DAYSHIFT</div>
    <h1 style="font-size:26px;font-weight:400;line-height:1.25;margin:0 0 20px">${escapeHtml(title)}</h1>
    ${body}
    <p style="margin-top:40px;font-size:12px;color:#7a756c;line-height:1.6">DAYSHIFT — Everyday style. Your way.<br/>This is a demonstration message from a local development environment.</p>
  </div></body></html>`;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export function renderEmail(
  template: string,
  data: Record<string, unknown>,
  storeName = "DAYSHIFT",
): RenderedEmail {
  const name = escapeHtml(data.firstName ?? "there");
  switch (template) {
    case "welcome":
      return {
        subject: `Welcome to ${storeName}`,
        html: layout(
          `Welcome, ${name}.`,
          `<p style="font-size:15px;line-height:1.7;color:#3d3a35">Your account is ready. Browse new arrivals, save pieces to your wishlist and track every order from your account.</p>
           <p style="margin:28px 0"><a href="${escapeHtml(data.url)}" style="background:#1A1917;color:#F6F2E9;padding:14px 26px;text-decoration:none;font-size:12px;letter-spacing:2px">START SHOPPING</a></p>`,
        ),
        text: `Welcome to ${storeName}, ${data.firstName ?? "there"}. Your account is ready.`,
      };
    case "verify-email":
      return {
        subject: "Verify your email address",
        html: layout(
          "Confirm your email",
          `<p style="font-size:15px;line-height:1.7;color:#3d3a35">Confirm your email to finish setting up your DAYSHIFT account. This link expires in 24 hours.</p>
           <p style="margin:28px 0"><a href="${escapeHtml(data.url)}" style="background:#1A1917;color:#F6F2E9;padding:14px 26px;text-decoration:none;font-size:12px;letter-spacing:2px">VERIFY EMAIL</a></p>`,
        ),
        text: `Verify your email: ${data.url}`,
      };
    case "password-reset":
      return {
        subject: "Reset your DAYSHIFT password",
        html: layout(
          "Reset your password",
          `<p style="font-size:15px;line-height:1.7;color:#3d3a35">We received a request to reset your password. This link expires in one hour. If this wasn't you, you can ignore this email.</p>
           <p style="margin:28px 0"><a href="${escapeHtml(data.url)}" style="background:#1A1917;color:#F6F2E9;padding:14px 26px;text-decoration:none;font-size:12px;letter-spacing:2px">CHOOSE A NEW PASSWORD</a></p>`,
        ),
        text: `Reset your password: ${data.url}`,
      };
    case "order-confirmation":
      return {
        subject: `Order ${data.orderNumber} confirmed`,
        html: layout(
          `Thank you, ${name}.`,
          `<p style="font-size:15px;line-height:1.7;color:#3d3a35">We've received your order and are preparing it now.</p>
           <p style="font-size:13px;color:#7a756c">Order ${escapeHtml(data.orderNumber)} · ${escapeHtml(money(Number(data.totalCents), String(data.currency ?? "USD")))}</p>
           <p style="margin:28px 0"><a href="${escapeHtml(data.url)}" style="background:#1A1917;color:#F6F2E9;padding:14px 26px;text-decoration:none;font-size:12px;letter-spacing:2px">VIEW ORDER</a></p>`,
        ),
        text: `Order ${data.orderNumber} confirmed. Total ${money(Number(data.totalCents), String(data.currency ?? "USD"))}.`,
      };
    case "payment-failed":
      return {
        subject: `Payment for order ${data.orderNumber} failed`,
        html: layout(
          "Your payment did not go through",
          `<p style="font-size:15px;line-height:1.7;color:#3d3a35">We couldn't complete the payment for order ${escapeHtml(data.orderNumber)}. Your items have been released. You can try again from your order page.</p>
           <p style="margin:28px 0"><a href="${escapeHtml(data.url)}" style="background:#1A1917;color:#F6F2E9;padding:14px 26px;text-decoration:none;font-size:12px;letter-spacing:2px">RETRY PAYMENT</a></p>`,
        ),
        text: `Payment for order ${data.orderNumber} failed.`,
      };
    case "order-shipped":
      return {
        subject: `Order ${data.orderNumber} is on its way`,
        html: layout(
          "Your order has shipped",
          `<p style="font-size:15px;line-height:1.7;color:#3d3a35">Order ${escapeHtml(data.orderNumber)} left our studio${data.trackingNumber ? ` with tracking number <strong>${escapeHtml(data.trackingNumber)}</strong>` : ""}.</p>
           <p style="margin:28px 0"><a href="${escapeHtml(data.url)}" style="background:#1A1917;color:#F6F2E9;padding:14px 26px;text-decoration:none;font-size:12px;letter-spacing:2px">TRACK ORDER</a></p>`,
        ),
        text: `Order ${data.orderNumber} has shipped.`,
      };
    case "return-updated":
      return {
        subject: `Return ${data.returnNumber}: ${String(data.statusLabel ?? data.status)}`,
        html: layout(
          "An update on your return",
          `<p style="font-size:15px;line-height:1.7;color:#3d3a35">Return ${escapeHtml(data.returnNumber)} is now <strong>${escapeHtml(data.statusLabel ?? data.status)}</strong>.</p>
           ${data.message ? `<p style="font-size:14px;line-height:1.7;color:#3d3a35">${escapeHtml(data.message)}</p>` : ""}
           <p style="margin:28px 0"><a href="${escapeHtml(data.url)}" style="background:#1A1917;color:#F6F2E9;padding:14px 26px;text-decoration:none;font-size:12px;letter-spacing:2px">VIEW RETURN</a></p>`,
        ),
        text: `Return ${data.returnNumber} is now ${data.statusLabel ?? data.status}.`,
      };
    case "refund-processed":
      return {
        subject: `Refund processed for order ${data.orderNumber}`,
        html: layout(
          "Your refund has been processed",
          `<p style="font-size:15px;line-height:1.7;color:#3d3a35">We've refunded ${escapeHtml(money(Number(data.amountCents), String(data.currency ?? "USD")))} for order ${escapeHtml(data.orderNumber)}. Depending on your bank, it may take 3–5 business days to appear.</p>`,
        ),
        text: `Refund of ${money(Number(data.amountCents), String(data.currency ?? "USD"))} processed for ${data.orderNumber}.`,
      };
    case "low-stock":
      return {
        subject: `Low stock: ${data.productName}`,
        html: layout(
          "Low stock alert",
          `<p style="font-size:15px;line-height:1.7;color:#3d3a35">${escapeHtml(data.productName)} (${escapeHtml(data.sku)}) has ${escapeHtml(data.available)} units available at ${escapeHtml(data.warehouse)}.</p>`,
        ),
        text: `Low stock: ${data.productName} (${data.sku}) at ${data.warehouse}.`,
      };
    case "support-reply":
      return {
        subject: `Re: ${data.subject}`,
        html: layout(
          "A reply to your support request",
          `<p style="font-size:15px;line-height:1.7;color:#3d3a35">${escapeHtml(data.body)}</p>
           <p style="margin:28px 0"><a href="${escapeHtml(data.url)}" style="background:#1A1917;color:#F6F2E9;padding:14px 26px;text-decoration:none;font-size:12px;letter-spacing:2px">VIEW CONVERSATION</a></p>`,
        ),
        text: String(data.body ?? ""),
      };
    default:
      return {
        subject: String(data.subject ?? storeName),
        html: layout(String(data.subject ?? "A message from DAYSHIFT"), `<p>${escapeHtml(data.body)}</p>`),
        text: String(data.body ?? ""),
      };
  }
}
