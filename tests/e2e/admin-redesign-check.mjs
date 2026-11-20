import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const ADMIN = process.env.E2E_ADMIN_URL ?? "http://localhost:3001";
const OUT = "../../docs/screenshots";
mkdirSync(OUT, { recursive: true });

const ROUTES = [
  ["/", "dashboard"],
  ["/products", "products"],
  ["/orders", "orders"],
  ["/returns", "returns"],
  ["/inventory", "inventory"],
  ["/customers", "customers"],
  ["/tickets", "tickets"],
  ["/reviews", "reviews"],
  ["/coupons", "coupons"],
  ["/promotions", "promotions"],
  ["/loyalty", "loyalty"],
  ["/staff", "staff"],
  ["/roles", "roles"],
  ["/audit", "audit"],
  ["/settings", "settings"],
  ["/system", "system"],
  ["/reports", "reports"],
  ["/categories", "categories"],
  ["/collections", "collections"],
  ["/brands", "brands"],
  ["/warehouses", "warehouses"],
  ["/suppliers", "suppliers"],
  ["/purchase-orders", "purchase-orders"],
];

// Only a representative set is archived to docs/screenshots; every route is still checked.
const SHOT = new Set(["dashboard", "products", "orders", "returns", "inventory", "settings", "system", "audit"]);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const problems = [];
page.on("console", (msg) => {
  if (msg.type() === "error") problems.push(`console: ${msg.text()}`);
});
page.on("requestfailed", (req) => problems.push(`failed: ${req.url()} ${req.failure()?.errorText}`));
page.on("response", (res) => {
  if (res.status() >= 400) problems.push(`http ${res.status()}: ${res.url()}`);
});

await page.goto(`${ADMIN}/login`, { waitUntil: "networkidle" });
await page.screenshot({ path: `${OUT}/admin-login-en.png`, fullPage: true });
await page.getByTitle("ไทย").click();
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/admin-login-th.png`, fullPage: true });
const thaiLogin = await page.getByText("เข้าสู่ระบบปฏิบัติการ").isVisible();
await page.getByTitle("English").click();
await page.waitForTimeout(800);

await page.locator('input[name="email"]').fill("admin@dayshift.example");
await page.locator('input[name="password"]').fill("Admin1234!Pass");
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL(`${ADMIN}/`);
await page.waitForLoadState("networkidle");

const results = [];
for (const [route, name] of ROUTES) {
  await page.goto(`${ADMIN}${route}`, { waitUntil: "networkidle" });
  const heading = await page.locator("h1").first().innerText().catch(() => "");
  if (SHOT.has(name)) await page.screenshot({ path: `${OUT}/admin-${name}-en.png`, fullPage: true });
  results.push({ route, name, en: heading });
}

// Switch to Thai through the UI switcher in the shell.
await page.goto(`${ADMIN}/`, { waitUntil: "networkidle" });
await page.getByTitle("ไทย").click();
await page.waitForTimeout(900);
const thaiDashboard = await page.getByRole("heading", { name: "แดชบอร์ด" }).isVisible();
await page.screenshot({ path: `${OUT}/admin-dashboard-th.png`, fullPage: true });

for (const [route, name] of ROUTES) {
  await page.goto(`${ADMIN}${route}`, { waitUntil: "networkidle" });
  const heading = await page.locator("h1").first().innerText().catch(() => "");
  if (SHOT.has(name)) await page.screenshot({ path: `${OUT}/admin-${name}-th.png`, fullPage: true });
  const th = results.find((r) => r.route === route);
  if (th) th.th = heading;
}

await page.goto(`${ADMIN}/`, { waitUntil: "networkidle" });
await page.getByTitle("English").click();
await page.waitForTimeout(900);

// Command palette
await page.keyboard.press("Control+k");
await page.waitForTimeout(500);
const paletteOpen = await page.getByRole("dialog", { name: /Command menu/i }).isVisible().catch(() => false);
await page.screenshot({ path: `${OUT}/admin-command-palette.png`, fullPage: true });
await page.keyboard.press("Escape");

// Mobile audit
const overflow = [];
const smallTargets = [];
for (const width of [390, 320]) {
  const mobile = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true });
  const mpage = await mobile.newPage();
  await mpage.goto(`${ADMIN}/login`, { waitUntil: "networkidle" });
  await mpage.locator('input[name="email"]').fill("admin@dayshift.example");
  await mpage.locator('input[name="password"]').fill("Admin1234!Pass");
  await mpage.getByRole("button", { name: "Sign in" }).click();
  await mpage.waitForURL(`${ADMIN}/`);
  await mpage.waitForLoadState("networkidle");
  for (const [route, name] of ROUTES) {
    await mpage.goto(`${ADMIN}${route}`, { waitUntil: "networkidle" });
    const metrics = await mpage.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      const small = [];
      for (const node of Array.from(document.querySelectorAll("a,button,select,input,textarea"))) {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden") continue;
        if (rect.width === 0 || rect.height === 0) continue;
        if (rect.height < 24 || rect.width < 24) {
          small.push({
            tag: node.tagName.toLowerCase(),
            label: (node.getAttribute("aria-label") ?? node.textContent ?? "").trim().slice(0, 30),
            w: Math.round(rect.width),
            h: Math.round(rect.height),
          });
        }
      }
      return { docWidth, scrollWidth: document.documentElement.scrollWidth, small };
    });
    if (metrics.scrollWidth > metrics.docWidth + 1) overflow.push(`${width} ${name}: ${metrics.scrollWidth}px`);
    if (metrics.small.length) smallTargets.push({ width, name, count: metrics.small.length, sample: metrics.small.slice(0, 2) });
    if (width === 390 && ["dashboard", "products", "orders", "inventory", "settings"].includes(name)) {
      await mpage.screenshot({ path: `${OUT}/admin-${name}-mobile.png`, fullPage: true });
    }
  }
  if (width === 390) {
    await mpage.getByLabel("Open menu").click();
    await mpage.waitForTimeout(500);
    await mpage.screenshot({ path: `${OUT}/admin-mobile-nav.png` });
  }
  await mobile.close();
}

await browser.close();

const untranslated = results.filter((r) => r.en && r.th && r.en === r.th);
console.log(JSON.stringify({
  thaiLogin,
  thaiDashboard,
  paletteOpen,
  routes: results.length,
  untranslatedHeadings: untranslated.map((r) => `${r.name}: ${r.en}`),
  mobileOverflow: overflow,
  mobileSmallTargets: smallTargets,
  problems: [...new Set(problems)].filter((p) => !(p.includes("_rsc=") && p.includes("ERR_ABORTED"))),
}, null, 2));
