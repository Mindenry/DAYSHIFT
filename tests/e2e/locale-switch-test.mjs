import { chromium } from "@playwright/test";

const WEB = process.env.E2E_BASE_URL ?? "http://192.168.1.107:3000";
async function settle(page) {
  await page.addStyleTag({ content: "[data-reveal]{opacity:1!important;transform:none!important;}" }).catch(() => {});
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(400);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto(WEB, { waitUntil: "networkidle" });
const enBefore = await page.evaluate(() => document.body.innerText);

await page.getByTitle("ไทย").first().click();
await page.waitForTimeout(900);
const thHome = await page.evaluate(() => document.body.innerText);
await settle(page);
await page.screenshot({ path: "../../docs/screenshots/storefront-home-th.png", fullPage: true });

await page.goto(`${WEB}/products/the-everyday-oversized-tee`, { waitUntil: "networkidle" });
const thProduct = await page.evaluate(() => document.body.innerText);
await settle(page);
await page.screenshot({ path: "../../docs/screenshots/storefront-product-th.png", fullPage: true });

await page.goto(`${WEB}/legal/privacy`, { waitUntil: "networkidle" });
const thPrivacy = await page.evaluate(() => document.body.innerText);

await page.goto(`${WEB}/`, { waitUntil: "networkidle" });
await page.getByTitle("English").first().click();
await page.waitForTimeout(900);
const enHome = await page.evaluate(() => document.body.innerText);
await settle(page);
await page.screenshot({ path: "../../docs/screenshots/storefront-home.png", fullPage: true });

await page.goto(`${WEB}/products/the-everyday-oversized-tee`, { waitUntil: "networkidle" });
const enProduct = await page.evaluate(() => document.body.innerText);
await settle(page);
await page.screenshot({ path: "../../docs/screenshots/storefront-product.png", fullPage: true });

await page.goto(`${WEB}/legal/privacy`, { waitUntil: "networkidle" });
const enPrivacy = await page.evaluate(() => document.body.innerText);

const checks = {
  enHomeEnglish: enBefore.includes("Women") && enBefore.includes("Everyday style."),
  enHomeNoThaiMerch: !/[\u0E00-\u0E7F]/.test(enBefore.replace(/ไทย|฿/g, "")),
  thHomeThai: thHome.includes("ผู้หญิง") && thHome.includes("แต่งตัวง่าย"),
  thProductThaiName: thProduct.includes("เสื้อยืดโอเวอร์ไซซ์ Everyday"),
  thPrivacyThai: thPrivacy.includes("นโยบายความเป็นส่วนตัว"),
  backToEnglish: enHome.includes("Women") && enHome.includes("Everyday style."),
  enProductEnglish: enProduct.includes("The Everyday Oversized Tee") && enProduct.includes("Cut from 240gsm"),
  enPrivacyEnglish: enPrivacy.includes("Privacy policy") && enPrivacy.includes("What we collect"),
};
console.log(JSON.stringify(checks, null, 2));
await browser.close();
