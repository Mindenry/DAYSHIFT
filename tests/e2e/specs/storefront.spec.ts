import { test, expect, type APIRequestContext } from "@playwright/test";

const API = process.env.E2E_API_URL ?? "http://localhost:4000/api/v1";

async function pickInStockProduct(request: APIRequestContext) {
  const list = await request.get(`${API}/products?inStock=true&pageSize=30`);
  const cards = (await list.json()).data.items as Array<{ slug: string }>;
  for (const card of cards) {
    const response = await request.get(`${API}/products/${card.slug}`);
    if (!response.ok()) continue;
    const product = (await response.json()).data;
    const variant = product.variants.find((item: { inStock: boolean }) => item.inStock);
    if (variant) return { product, variant };
  }
  throw new Error("No in-stock variant available for E2E purchase");
}

test.describe("Customer purchase journey", () => {
  test("browses a product, applies a coupon, checks out and pays with the sandbox", async ({ page, request }) => {
    const email = `e2e-${Date.now()}@example.com`;
    const { product, variant } = await pickInStockProduct(request);

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Everyday");

    await page.goto("/collections/new-arrivals");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("New Arrivals");

    await page.goto(`/products/${product.slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(product.name);

    // Choose a live in-stock size rather than a fixed, depletable fixture.
    await page.getByRole("button", { name: variant.size, exact: true }).click();
    await page.getByRole("button", { name: "Add to bag" }).click();

    await page.goto("/cart");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Shopping bag");
    await expect(page.getByText(product.name).first()).toBeVisible();

    await page.locator("#coupon").fill("WELCOME10");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText("WELCOME10")).toBeVisible();

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

  test("cart rejects an ineligible coupon with a clear message", async ({ page, request }) => {
    const { product, variant } = await pickInStockProduct(request);
    await page.goto(`/products/${product.slug}`);
    await page.getByRole("button", { name: variant.size, exact: true }).click();
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
