import { chromium } from "@playwright/test";

const ADMIN = process.env.E2E_ADMIN_URL ?? "http://192.168.1.107:3001";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto(`${ADMIN}/login`, { waitUntil: "networkidle" });
await page.locator('input[name="email"]').fill("admin@dayshift.example");
await page.locator('input[name="password"]').fill("Admin1234!Pass");
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL(`${ADMIN}/`);

// English (default)
await page.goto(`${ADMIN}/products?q=DS-TEE-001`, { waitUntil: "networkidle" });
const enProducts = await page.evaluate(() => document.body.innerText);
await page.goto(`${ADMIN}/categories`, { waitUntil: "networkidle" });
const enCategories = await page.evaluate(() => document.body.innerText);

// Switch to Thai through the UI
await page.getByTitle("ไทย").first().click();
await page.waitForTimeout(900);
await page.goto(`${ADMIN}/products?q=DS-TEE-001`, { waitUntil: "networkidle" });
const thProducts = await page.evaluate(() => document.body.innerText);
await page.goto(`${ADMIN}/categories`, { waitUntil: "networkidle" });
const thCategories = await page.evaluate(() => document.body.innerText);

// Product editor exposes both languages
await page.goto(`${ADMIN}/products?q=DS-TEE-001`, { waitUntil: "networkidle" });
await page.getByRole("link", { name: "แก้ไข" }).first().click();
await page.waitForLoadState("networkidle");
const nameTh = await page.locator("#name").inputValue();
const nameEn = await page.locator("#nameEn").inputValue();
await page.waitForTimeout(300);
const editor = await page.evaluate(() => document.body.innerText);

console.log(JSON.stringify({
  enProductsEnglish: enProducts.includes("The Everyday Oversized Tee"),
  enProductsNoThai: !/[\u0E00-\u0E7F]/.test(enProducts.replace(/ไทย|฿|ณัฐพงษ์|ศรีสุวรรณ|ณศ/g, "")),
  enCategoriesEnglish: enCategories.includes("Women") && enCategories.includes("Shoes"),
  enCategoriesNoThai: !/[\u0E00-\u0E7F]/.test(enCategories.replace(/ไทย|฿|ณัฐพงษ์|ศรีสุวรรณ|ณศ/g, "")),
  thProductsThai: thProducts.includes("เสื้อยืดโอเวอร์ไซซ์ Everyday"),
  thCategoriesThai: thCategories.includes("ผู้หญิง") && thCategories.includes("รองเท้า"),
  editorThaiSection: /THAI CONTENT|เนื้อหาภาษาไทย/i.test(editor),
  editorEnglishSection: /ENGLISH CONTENT|เนื้อหาภาษาอังกฤษ/i.test(editor),
  nameTh,
  nameEn,
}, null, 2));
await browser.close();
