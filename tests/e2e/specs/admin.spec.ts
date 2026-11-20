import { test, expect } from "@playwright/test";

const ADMIN_URL = process.env.E2E_ADMIN_URL ?? "http://localhost:3001";
const email = process.env.E2E_ADMIN_EMAIL ?? "admin@dayshift.example";
const password = process.env.E2E_ADMIN_PASSWORD ?? "Admin1234!Pass";

test.describe("Administration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`);
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(`${ADMIN_URL}/`);
  });

  test("dashboard shows live commerce metrics", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Gross sales")).toBeVisible();
    await expect(page.getByText("Top products")).toBeVisible();
    await expect(page.getByText("Recent orders")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Low stock" })).toBeVisible();
  });

  test("products and inventory are operable", async ({ page }) => {
    await page.getByRole("link", { name: "Products", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();
    await expect(page.getByText("The Everyday Oversized Tee").first()).toBeVisible();

    await page.getByRole("link", { name: "Stock", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Stock" })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();

    const adjust = page.getByRole("button", { name: "Adjust" }).first();
    await adjust.click();
    await expect(page.getByRole("heading", { name: /adjust stock/i })).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
  });

  test("orders and returns surfaces show real records", async ({ page }) => {
    await page.getByRole("link", { name: "Orders", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible();
    await expect(page.locator("table tbody tr").first()).toBeVisible();

    await page.getByRole("link", { name: "Returns & refunds", exact: true }).click();
    await expect(page.getByRole("heading", { name: /returns/i })).toBeVisible();
    await expect(page.getByText("RT-2026-000031").first()).toBeVisible();
  });

  test("settings and system health are available", async ({ page }) => {
    await page.getByRole("link", { name: "System health" }).click();
    await expect(page.getByRole("heading", { name: "System health" })).toBeVisible();
    await expect(page.getByText("PostgreSQL")).toBeVisible();

    await page.getByRole("link", { name: "Settings" }).click();
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Save settings" })).toBeVisible();
  });
});
