import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const WEB = process.env.E2E_BASE_URL ?? "http://192.168.1.107:3000";
const OUT = "../../docs/screenshots";
mkdirSync(OUT, { recursive: true });

const ROUTES = [
  ["/", "storefront-home"],
  ["/collections/new-arrivals", "storefront-listing"],
  ["/products/the-everyday-oversized-tee", "storefront-product"],
  ["/cart", "storefront-cart"],
  ["/login", "storefront-login"],
  ["/support", "storefront-support"],
];

const browser = await chromium.launch();
const problems = [];
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
page.on("response", (r) => r.status() >= 400 && problems.push(`${r.status()} ${r.url()}`));

const results = [];
await page.goto(`${WEB}/`, { waitUntil: "networkidle" });
await page.getByTitle("ไทย").first().click();
await page.waitForTimeout(900);
const thaiHome = await page.getByRole("heading", { level: 1 }).innerText();
await page.screenshot({ path: `${OUT}/storefront-home-th.png`, fullPage: true });
await page.getByTitle("English").first().click();
await page.waitForTimeout(900);

for (const [route, name] of ROUTES) {
  await page.goto(`${WEB}${route}`, { waitUntil: "networkidle" });
  const heading = await page.locator("h1").first().innerText().catch(() => "");
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  results.push({ route, heading });
}

// Thai pass over the same routes
await page.goto(`${WEB}/`, { waitUntil: "networkidle" });
await page.getByTitle("ไทย").first().click();
await page.waitForTimeout(900);
for (const [route, name] of ROUTES) {
  await page.goto(`${WEB}${route}`, { waitUntil: "networkidle" });
  const heading = await page.locator("h1").first().innerText().catch(() => "");
  await page.screenshot({ path: `${OUT}/${name}-th.png`, fullPage: true });
  const en = results.find((r) => r.route === route);
  if (en) en.th = heading;
}

// Mobile pass at 390 and 320 in Thai
const overflow = [];
for (const width of [390, 320]) {
  const mobile = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true });
  const mpage = await mobile.newPage();
  for (const [route, name] of ROUTES) {
    await mpage.goto(`${WEB}${route}`, { waitUntil: "networkidle" });
    const m = await mpage.evaluate(() => ({ w: document.documentElement.clientWidth, s: document.documentElement.scrollWidth }));
    if (m.s > m.w + 1) overflow.push(`${width} ${name}: ${m.s}`);
    if (width === 390 && ["storefront-home", "storefront-product"].includes(name)) {
      await mpage.screenshot({ path: `${OUT}/${name}-mobile.png`, fullPage: true });
    }
  }
  await mobile.close();
}

await browser.close();
const untranslated = results.filter((r) => r.heading && r.th && r.heading === r.th);
console.log(JSON.stringify({
  thaiHome,
  untranslatedHeadings: untranslated.map((r) => `${r.route}: ${r.heading}`),
  overflow,
  problems: [...new Set(problems)].filter((p) => !(p.includes("_rsc=") && p.includes("ERR_ABORTED"))).slice(0, 20),
}, null, 2));
