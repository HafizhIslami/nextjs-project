import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const merchantUrl = "http://sayur-segar.localhost:3100";

test.describe("merchant hostname storefront", () => {
  const userEmail = process.env.UI_TEST_USER_EMAIL ?? "";
  const userPassword = process.env.UI_TEST_USER_PASSWORD ?? "";
  test("tenant APIs do not expose another merchant's offering", async ({ request }) => {
    const merchantResponse = await request.get(`${merchantUrl}/api/storefront/offerings`);
    expect(merchantResponse.ok()).toBeTruthy();
    expect(JSON.stringify(await merchantResponse.json())).toContain("VEG-TOMATO-1KG");

    const defaultResponse = await request.get(
      "http://127.0.0.1:3100/api/storefront/offerings/tomat-segar-1kg"
    );
    expect(defaultResponse.status()).toBe(404);
  });

  test("unknown merchant host does not fall back to Roomi", async ({ page }) => {
    const response = await page.goto("http://unknown-merchant.localhost:3100");
    expect(response?.status()).toBe(404);
    await expect(page.getByText("Roomi UI Test Room")).toHaveCount(0);
  });

  test("resolves merchant from hostname and renders its catalog", async ({ page }) => {
    await page.goto(merchantUrl);
    await expect(page.getByRole("heading", { name: "Sayur Segar", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tomat Segar 1 kg" })).toBeVisible();
    await expect(page.getByText("Roomi UI Test Room")).toHaveCount(0);
  });

  test("opens a tenant-scoped product detail", async ({ page }) => {
    await page.goto(merchantUrl);
    await page
      .getByRole("article")
      .filter({ has: page.getByRole("heading", { name: "Tomat Segar 1 kg" }) })
      .getByRole("link", { name: "View product" })
      .click();
    await expect(page).toHaveURL(/\/products\/tomat-segar-1kg$/);
    await expect(page.getByRole("heading", { name: "Tomat Segar 1 kg", level: 1 })).toBeVisible();
    await expect(page.getByText(/Rp\s*28\.000/)).toBeVisible();
  });

  test("creates a tenant order using server-side catalog pricing", async ({ page }) => {
    await page.goto(`${merchantUrl}/login`);
    await page.getByLabel("Email").fill(userEmail);
    await page.getByLabel("Password", { exact: true }).fill(userPassword);
    await page.getByRole("button", { name: "LOGIN" }).click();
    await expect(page).toHaveURL(`${merchantUrl}/`);

    const result = await page.evaluate(async () => {
      const catalogResponse = await fetch("/api/storefront/offerings");
      const catalog = await catalogResponse.json();
      const tomato = catalog.catalog.offerings.find(
        (offering: { code: string }) => offering.code === "VEG-TOMATO-1KG"
      );
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelCode: "retail",
          items: [{ offeringId: tomato.id, quantity: 2 }],
          amountMinor: 1,
        }),
      });
      return { status: orderResponse.status, payload: await orderResponse.json() };
    });

    expect(result.status).toBe(201);
    expect(result.payload.order.totals.grandTotalMinor).toBe(56_000);
    await page.goto(`${merchantUrl}/orders/${result.payload.order._id}`);
    await expect(page.getByText(result.payload.order.orderNumber)).toBeVisible();
    await expect(
      page.locator(".order-total").getByText(/Rp\s*56\.000/)
    ).toBeVisible();
  });

  test("merchant storefront has no serious accessibility violations", async ({ page }) => {
    await page.goto(merchantUrl);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
  });

  test("merchant storefront fits a mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(merchantUrl);
    const dimensions = await page.locator("html").evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  });
});
