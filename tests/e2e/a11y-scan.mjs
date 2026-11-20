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

async function scan(url, label, setup, viewport = { width: 1440, height: 1000 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  if (setup) await setup(page);
  await page.goto(url, { waitUntil: "networkidle" });
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const serious = result.violations.filter((v) => ["critical", "serious"].includes(v.impact));
  console.log(`${label}: ${result.violations.length} violations (${serious.length} serious/critical)`);
  for (const v of serious) {
    console.log(`- ${v.impact} ${v.id}: ${v.help} nodes=${v.nodes.length}`);
    failures += 1;
  }
  await context.close();
}

await scan(`${SITE}/`, "home desktop");
await scan(`${SITE}/products/the-everyday-oversized-tee`, "product");
await scan(`${SITE}/cart`, "cart");
await scan(`${SITE}/`, "home mobile", undefined, { width: 390, height: 844 });
await scan(`${ADMIN}/login`, "admin login");
await scan(`${ADMIN}/`, "admin dashboard", async (page) => {
  await page.goto(`${ADMIN}/login`);
  await page.locator('input[name="email"]').fill(ADMIN_EMAIL);
  await page.locator('input[name="password"]').fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(`${ADMIN}/`);
});

await browser.close();
if (failures > 0) {
  console.error(`\n${failures} serious/critical accessibility violation(s) found.`);
  process.exit(1);
}
console.log("\nNo serious or critical accessibility violations.");
