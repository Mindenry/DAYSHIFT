/**
 * Mobile layout audit: detects horizontal overflow, overlapping text,
 * undersized tap targets and console errors across key storefront pages.
 *
 * Usage: node tests/e2e/mobile-check.mjs
 * Env: E2E_BASE_URL (default http://localhost:3000)
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const SITE = (process.env.E2E_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const OUT = "tests/e2e/shots/mobile-audit";
mkdirSync(OUT, { recursive: true });

const pages = [
  ["home", "/"],
  ["collection", "/collections/new-arrivals"],
  ["category", "/c/women"],
  ["product", "/products/the-everyday-oversized-tee"],
  ["cart", "/cart"],
  ["search", "/search?q=linen"],
  ["login", "/login"],
  ["support", "/support"],
  ["track", "/track"],
  ["collections", "/collections"],
  ["about", "/about"],
];

const browser = await chromium.launch();
let failures = 0;

for (const [width, height, label] of [[390, 844, "390"], [320, 700, "320"]]) {
  const context = await browser.newContext({
    viewport: { width, height },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  for (const [name, path] of pages) {
    consoleErrors.length = 0;
    try {
      await page.goto(`${SITE}${path}`, { waitUntil: "networkidle", timeout: 45000 });
    } catch (error) {
      console.log(`FAIL ${label} ${name}: navigation ${error.message}`);
      failures += 1;
      continue;
    }

    const report = await page.evaluate(() => {
      const width = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      const overflowing = [];
      const smallTargets = [];
      const nodes = Array.from(document.querySelectorAll("body *"));
      for (const node of nodes) {
        const style = getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden" || style.position === "fixed") continue;
        const rect = node.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        let clipped = false;
        let parent = node.parentElement;
        while (parent && parent !== document.body) {
          const parentStyle = getComputedStyle(parent);
          if (
            (parentStyle.overflowX === "hidden" || parentStyle.overflowX === "clip") &&
            parent.getBoundingClientRect().right <= document.documentElement.clientWidth + 1
          ) {
            clipped = true;
            break;
          }
          parent = parent.parentElement;
        }
        if (rect.right > width + 1 && style.overflowX !== "hidden" && !clipped) {
          overflowing.push({
            tag: node.tagName.toLowerCase(),
            cls: (node.className && typeof node.className === "string" ? node.className : "").slice(0, 90),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
            text: (node.textContent ?? "").trim().slice(0, 50),
          });
        }
        if (["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA"].includes(node.tagName)) {
          if (rect.height < 40 || rect.width < 24) {
            smallTargets.push({
              tag: node.tagName.toLowerCase(),
              label: node.getAttribute("aria-label") ?? (node.textContent ?? "").trim().slice(0, 40),
              w: Math.round(rect.width),
              h: Math.round(rect.height),
            });
          }
        }
      }
      return {
        width,
        scrollWidth,
        overflowing: overflowing.slice(0, 8),
        overflowCount: overflowing.length,
        smallTargets: smallTargets.slice(0, 6),
        smallCount: smallTargets.length,
      };
    });

    const horizontal = report.scrollWidth > report.width + 1;
    const overlapRisk = report.overflowCount > 0;
    const status = horizontal || overlapRisk || consoleErrors.length ? "FAIL" : "PASS";
    if (status === "FAIL") failures += 1;

    console.log(
      `${status} ${label} ${name.padEnd(12)} scroll=${report.scrollWidth}/${report.width} overflow=${report.overflowCount} small=${report.smallCount} errors=${consoleErrors.length}`,
    );
    if (horizontal) console.log(`   horizontal scroll: ${report.scrollWidth - report.width}px`);
    for (const item of report.overflowing) console.log(`   overflow <${item.tag}> ${item.cls} right=${item.right} text="${item.text}"`);
    for (const item of report.smallTargets) console.log(`   small <${item.tag}> ${item.w}x${item.h} "${item.label}"`);
    for (const error of consoleErrors.slice(0, 3)) console.log(`   console: ${error.slice(0, 160)}`);

    await page.screenshot({ path: `${OUT}/${label}-${name}.png`, fullPage: false });
  }
  await context.close();
}

await browser.close();
console.log(`\n${failures === 0 ? "Mobile audit passed." : `${failures} page(s) need attention.`}`);
if (failures > 0) process.exit(1);
