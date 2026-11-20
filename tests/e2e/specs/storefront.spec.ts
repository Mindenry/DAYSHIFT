import { test, expect } from "@playwright/test";

test.describe("Customer purchase journey", () => {
  test("browses a product, applies a coupon, checks out and pays with the sandbox", async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`;

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Everyday");

    await page.goto("/collections/new-arrivals");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("New Arrivals");

    await page.goto("/products/the-everyday-oversized-tee");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("The Everyday Oversized Tee");

    // Select an in-stock size and three units so the DAYSHIFT15 minimum is met.
    await page.getByRole("button", { name: "L", exact: true }).click();
    await page.getByRole("button", { name: "Increase quantity" }).click();
    await page.getByRole("button", { name: "Increase quantity" }).click();
    await page.getByRole("button", { name: "Add to bag" }).click();

    await page.goto("/cart");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Shopping bag");
    await expect(page.getByText("The Everyday Oversized Tee").first()).toBeVisible();

    await page.locator("#coupon").fill("DAYSHIFT15");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText("DAYSHIFT15")).toBeVisible();

    await page.getByRole("link", { name: /checkout/i }).first().click();
    await page.waitForURL("**/checkout");
    await page.locator("#email").fill(email);
    await page.locator("#firstName").fill("Test");
    await page.locator("#lastName").fill("Shopper");
    await page.locator("#line1").fill("44 Court Street");
    await page.locator("#city").fill("Brooklyn");
    await page.locator("#state").fill("NY");
    await page.locator("#postalCode").fill("11201");

    await page.getByRole("button", { name: /continue to payment/i }).click();
    await page.waitForURL("**/checkout/payment**");

    await page.getByRole("button", { name: /^Pay \$/ }).click();
    await page.waitForURL("**/checkout/confirmation**");

    await expect(page.getByText(/Thank you,/)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Payment received/)).toBeVisible();
    const orderNumber = await page.locator("strong").first().textContent();
    expect(orderNumber).toMatch(/^DS-/);
  });

  test("cart rejects an ineligible coupon with a clear message", async ({ page }) => {
    await page.goto("/products/classic-sneaker");
    await page.getByRole("button", { name: "42", exact: true }).click();
    await page.getByRole("button", { name: "Add to bag" }).click();
    await page.goto("/cart");
    await page.locator("#coupon").fill("NOTACODE");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText(/isn't valid|not valid|could not be applied/i)).toBeVisible();
  });

  test("search returns relevant products", async ({ page }) => {
    await page.goto("/search?q=linen");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("linen");
    await expect(page.getByText("Relaxed Linen Shirt").first()).toBeVisible();
  });
});
