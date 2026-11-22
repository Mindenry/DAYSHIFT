import { chromium } from "@playwright/test";

const WEB = process.env.E2E_BASE_URL ?? "http://192.168.1.107:3000";
const ADMIN = process.env.E2E_ADMIN_URL ?? "http://192.168.1.107:3001";
const THAI = /[\u0E00-\u0E7F]+/g;

const browser = await chromium.launch();

async function audit(context, base, pages, label, locale) {
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "networkidle" });
  await page.context().addCookies([{ name: "ds_locale", value: locale, url: base }]);
  const out = [];
  for (const path of pages) {
    await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
    const text = await page.evaluate(() => document.body.innerText);
    const matches = [...new Set(text.match(THAI) ?? [])];
    // Ignore the language switcher label and the baht symbol.
    const filtered = matches.filter((m) => m !== "ไทย" && m !== "฿");
    out.push({ path, count: filtered.length, sample: filtered.slice(0, 8) });
  }
  console.log(label, JSON.stringify(out, null, 0));
  await page.close();
}

// Storefront, English
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await audit(ctx, WEB, ["/", "/collections/new-arrivals", "/products/the-everyday-oversized-tee", "/cart", "/support", "/track"], "storefront-en", "en");
  await ctx.close();
}

// Storefront, Thai (count Latin words in visible text as a proxy)
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.context().addCookies([{ name: "ds_locale", value: "th", url: WEB }]);
  for (const path of ["/", "/collections/new-arrivals", "/products/the-everyday-oversized-tee", "/cart"]) {
    await page.goto(`${WEB}${path}`, { waitUntil: "networkidle" });
    const text = await page.evaluate(() => document.body.innerText);
    const latin = [...new Set(text.match(/\b[A-Z][a-z]{3,}\b/g) ?? [])];
    console.log("storefront-th", path, latin.length, latin.slice(0, 15).join(", "));
  }
  await ctx.close();
}

// Admin, English and Thai
for (const locale of ["en", "th"]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${ADMIN}/login`, { waitUntil: "networkidle" });
  await page.locator('input[name="email"]').fill("admin@dayshift.example");
  await page.locator('input[name="password"]').fill("Admin1234!Pass");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(`${ADMIN}/`);
  await page.context().addCookies([{ name: "ds_locale", value: locale, url: ADMIN }]);
  for (const path of ["/products", "/categories", "/collections", "/brands", "/orders"]) {
    await page.goto(`${ADMIN}${path}`, { waitUntil: "networkidle" });
    const text = await page.evaluate(() => document.body.innerText);
    const matches = [...new Set(text.match(THAI) ?? [])].filter((m) => m !== "ไทย" && m !== "฿");
    console.log(`admin-${locale}`, path, matches.length, matches.slice(0, 8).join(" | "));
  }
  await ctx.close();
}

await browser.close();
