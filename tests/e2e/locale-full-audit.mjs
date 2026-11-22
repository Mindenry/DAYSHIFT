import { chromium } from "@playwright/test";

const WEB = process.env.E2E_BASE_URL ?? "http://192.168.1.107:3000";
const THAI = /[\u0E00-\u0E7F]+/g;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.context().addCookies([{ name: "ds_locale", value: "en", url: WEB }]);

await page.goto(`${WEB}/login`, { waitUntil: "networkidle" });
await page.locator('input[name="email"]').fill("customer@dayshift.example");
await page.locator('input[name="password"]').fill("Customer1234!Pass");
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL(`${WEB}/account`);

const routes = [
  "/", "/collections", "/collections/new-arrivals", "/c/women", "/c/shoes",
  "/products/the-everyday-oversized-tee", "/search?q=linen", "/cart",
  "/login", "/register", "/forgot-password", "/support", "/track",
  "/about", "/about/materials", "/help/delivery-returns", "/help/size-guide",
  "/legal/privacy", "/legal/terms",
  "/account", "/account/orders", "/account/returns", "/account/loyalty",
  "/account/addresses", "/account/settings", "/account/support", "/account/wishlist",
];

for (const path of routes) {
  const res = await page.goto(`${WEB}${path}`, { waitUntil: "networkidle" });
  const text = await page.evaluate(() => document.body.innerText);
  const matches = [...new Set(text.match(THAI) ?? [])].filter((m) => m !== "ไทย" && m !== "฿");
  console.log(`${res?.status()} ${path} thai=${matches.length} ${matches.slice(0, 10).join(" | ")}`);
}

// Order detail for the seeded completed order
await page.goto(`${WEB}/account/orders`, { waitUntil: "networkidle" });
const orderLink = page.locator('a[href^="/account/orders/DS-"]').first();
if (await orderLink.count()) {
  await orderLink.click();
  await page.waitForLoadState("networkidle");
  const text = await page.evaluate(() => document.body.innerText);
  const matches = [...new Set(text.match(THAI) ?? [])].filter((m) => m !== "ไทย" && m !== "฿");
  console.log(`order-detail thai=${matches.length} ${matches.slice(0, 12).join(" | ")}`);
}

await browser.close();
