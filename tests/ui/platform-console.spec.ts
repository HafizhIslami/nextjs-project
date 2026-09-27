import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const userEmail = process.env.UI_TEST_USER_EMAIL ?? "";
const userPassword = process.env.UI_TEST_USER_PASSWORD ?? "";
const adminEmail = process.env.UI_TEST_ADMIN_EMAIL ?? "";
const adminPassword = process.env.UI_TEST_ADMIN_PASSWORD ?? "";

const login = async (page: import("@playwright/test").Page, email: string, password: string) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "LOGIN" }).click();
  await expect(page).toHaveURL(/\/$/);
};

test.describe("platform console", () => {
  test("does not grant platform access to a normal user", async ({ page }) => {
    await login(page, userEmail, userPassword);
    await page.goto("/platform");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Platform operations" })).toHaveCount(0);
  });

  test("platform console is accessible and fits the viewport", async ({ page }) => {
    await login(page, adminEmail, adminPassword);
    await page.goto("/platform");
    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      accessibility.violations.filter(({ impact }) => impact === "critical" || impact === "serious")
    ).toEqual([]);
    const dimensions = await page.locator("html").evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  });

  test("platform owner provisions and suspends an isolated merchant", async ({ page }, testInfo) => {
    const suffix = testInfo.project.name === "chromium" ? "desktop" : "mobile";
    const code = `platform-e2e-${suffix}`;
    const name = `Platform E2E ${suffix}`;
    await login(page, adminEmail, adminPassword);
    await page.goto("/platform/merchants/new");
    await expect(page.getByRole("heading", { name: "Platform operations" })).toBeVisible();

    await page.getByLabel("Display name").fill(name);
    await page.getByLabel("Merchant code").fill(code);
    await page.getByLabel("Business template").selectOption("physical-products");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Owner name").fill("UI Test User");
    await page.getByLabel("Owner email").fill(userEmail);
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Create merchant" }).click();

    await expect(page.getByRole("heading", { name: `${name} is ready` })).toBeVisible();
    await page.getByRole("link", { name: "Open merchant record" }).click();
    await expect(page.getByRole("heading", { name })).toBeVisible();

    const merchantUrl = `http://${code}.localhost:3100`;
    const storefront = await page.context().newPage();
    await storefront.goto(merchantUrl);
    await expect(storefront.getByRole("heading", { name, level: 1 })).toBeVisible();
    const blockedApi = await storefront.request.get(`${merchantUrl}/api/platform/merchants`);
    expect(blockedApi.status()).toBe(404);
    await storefront.close();

    page.once("dialog", (dialog) => dialog.accept("Automated isolation test"));
    await page.getByRole("button", { name: "Suspend" }).click();
    await expect(page.getByText("suspended", { exact: true })).toBeVisible();
    const suspended = await page.request.get(merchantUrl);
    expect(suspended.status()).toBe(404);
  });

  test("provisioning is idempotent and an invited owner can activate", async ({ page, browser }, testInfo) => {
    const suffix = testInfo.project.name === "chromium" ? "desktop" : "mobile";
    const merchantCode = `platform-e2e-invite-${suffix}`;
    const ownerEmail = `platform.owner.${suffix}@example.test`;
    const password = "PlatformOwner123!";
    const idempotencyKey = `platform-invitation-${suffix}`;
    await login(page, adminEmail, adminPassword);

    const requestBody = {
      merchantCode,
      name: `Invited Owner ${suffix}`,
      ownerName: `Invited Owner ${suffix}`,
      ownerEmail,
      businessType: "services",
      currency: "IDR",
      channels: ["retail"],
      modules: ["catalog", "commerce", "quotation"],
    };
    const first = await page.evaluate(async ({ body, key }) => {
      const response = await fetch("/api/platform/merchants", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": key },
        body: JSON.stringify(body),
      });
      return { status: response.status, payload: await response.json() };
    }, { body: requestBody, key: idempotencyKey });
    expect(first.status).toBe(201);
    expect(first.payload.ownerInvited).toBe(true);
    expect(first.payload.activationUrl).toContain("/activate/");

    const replay = await page.evaluate(async ({ body, key }) => {
      const response = await fetch("/api/platform/merchants", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": key },
        body: JSON.stringify(body),
      });
      return { status: response.status, payload: await response.json() };
    }, { body: requestBody, key: idempotencyKey });
    expect(replay.status).toBe(200);
    expect(replay.payload.reused).toBe(true);
    expect(replay.payload.merchant._id).toBe(first.payload.merchant._id);

    const second = await page.evaluate(async ({ body, key }) => {
      const response = await fetch("/api/platform/merchants", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": `${key}-second` },
        body: JSON.stringify({ ...body, merchantCode: `${body.merchantCode}-second`, name: `${body.name} Second` }),
      });
      return { status: response.status, payload: await response.json() };
    }, { body: requestBody, key: idempotencyKey });
    expect(second.status).toBe(201);
    expect(second.payload.ownerInvited).toBe(true);

    const firstToken = new URL(first.payload.activationUrl).pathname.split("/").pop();
    const staleActivation = await page.request.post("/api/auth/activate", {
      data: { token: firstToken, password },
    });
    expect(staleActivation.status()).toBe(404);

    const activationUrl = new URL(second.payload.activationUrl);
    const token = activationUrl.pathname.split("/").pop();
    const activation = await page.request.post("/api/auth/activate", {
      data: { token, password },
    });
    expect(activation.status()).toBe(200);

    const ownerContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();
    const merchantUrl = `http://${merchantCode}.localhost:3100`;
    await ownerPage.goto(`${merchantUrl}/login`);
    await ownerPage.getByLabel("Email").fill(ownerEmail);
    await ownerPage.getByLabel("Password", { exact: true }).fill(password);
    await ownerPage.getByRole("button", { name: "LOGIN" }).click();
    await expect(ownerPage).toHaveURL(`${merchantUrl}/`);
    await ownerPage.goto(`${merchantUrl}/admin/dashboard`);
    await expect(ownerPage.getByRole("heading", { name: /dashboard/i })).toBeVisible();
    await ownerContext.close();
  });
});
