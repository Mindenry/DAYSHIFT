/**
 * Axe accessibility scan for the storefront and admin portal.
 * Fails (exit 1) when a critical or serious violation is found.
 *
 * URLs come from E2E_BASE_URL / E2E_ADMIN_URL so the same scan can run
 * against localhost or the LAN deployment.
 */
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const SITE = (process.env.E2E_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const ADMIN = (process.env.E2E_ADMIN_URL ?? "http://localhost:3001").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@dayshift.example";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "Admin1234!Pass";

const browser = await chromium.launch();
let failures = 0;
let scanned = 0;

async function audit(page, url, label) {
  await page.goto(url, { waitUntil: "networkidle" });
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  scanned += 1;
  const serious = result.violations.filter((v) => ["critical", "serious"].includes(v.impact));
  console.log(`${label}: ${result.violations.length} violations (${serious.length} serious/critical)`);
  for (const v of serious) {
    console.log(`- ${v.impact} ${v.id}: ${v.help} nodes=${v.nodes.length}`);
    for (const node of v.nodes.slice(0, 3)) {
      console.log(`  ${JSON.stringify(node.target)} ${node.html.slice(0, 140)}`);
    }
    failures += 1;
  }
}

async function scanPublic(url, label, viewport = { width: 1440, height: 1000 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await audit(page, url, label);
  await context.close();
}

await scanPublic(`${SITE}/`, "home desktop");
await scanPublic(`${SITE}/products/the-everyday-oversized-tee`, "product");
await scanPublic(`${SITE}/cart`, "cart");
await scanPublic(`${SITE}/`, "home mobile", { width: 390, height: 844 });

await scanPublic(`${ADMIN}/login`, "admin login");
await scanPublic(`${ADMIN}/login`, "admin login mobile", { width: 390, height: 844 });

// One signed-in context, reused for every admin route (avoids login rate limits).
const admin = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const adminPage = await admin.newPage();
await adminPage.goto(`${ADMIN}/login`);
await adminPage.locator('input[name="email"]').fill(ADMIN_EMAIL);
await adminPage.locator('input[name="password"]').fill(ADMIN_PASSWORD);
await adminPage.getByRole("button", { name: "Sign in" }).click();
await adminPage.waitForURL(`${ADMIN}/`);

for (const [route, label] of [
  ["/", "admin dashboard"],
  ["/products", "admin products"],
  ["/orders", "admin orders"],
  ["/returns", "admin returns"],
  ["/inventory", "admin inventory"],
  ["/settings", "admin settings"],
  ["/system", "admin system"],
  ["/audit", "admin audit"],
]) {
  await audit(adminPage, `${ADMIN}${route}`, label);
}

// Thai locale pass through the UI switcher.
await adminPage.goto(`${ADMIN}/`, { waitUntil: "networkidle" });
await adminPage.getByTitle("ไทย").click();
await adminPage.waitForTimeout(900);
for (const [route, label] of [
  ["/", "admin dashboard th"],
  ["/settings", "admin settings th"],
  ["/orders", "admin orders th"],
]) {
  await audit(adminPage, `${ADMIN}${route}`, label);
}

// Switch back to English so the mobile drawer uses English labels.
await adminPage.getByTitle("English").click();
await adminPage.waitForTimeout(700);

// Mobile admin reuses the signed-in storage state.
const state = await admin.storageState();
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState: state });
const mobilePage = await mobile.newPage();
await mobilePage.goto(`${ADMIN}/`, { waitUntil: "networkidle" });
await mobilePage.getByLabel("Open menu").click();
await mobilePage.waitForTimeout(500);
const drawer = await new AxeBuilder({ page: mobilePage }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
scanned += 1;
const drawerSerious = drawer.violations.filter((v) => ["critical", "serious"].includes(v.impact));
console.log(`admin mobile drawer: ${drawer.violations.length} violations (${drawerSerious.length} serious/critical)`);
for (const v of drawerSerious) {
  console.log(`- ${v.impact} ${v.id}: ${v.help} nodes=${v.nodes.length}`);
  failures += 1;
}
await mobile.close();
await admin.close();

await browser.close();
if (failures > 0) {
  console.error(`\n${failures} serious/critical accessibility violation(s) found.`);
  process.exit(1);
}
console.log(`\nNo serious or critical accessibility violations across ${scanned} scans.`);
