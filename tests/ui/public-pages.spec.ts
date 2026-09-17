import { expect, test } from "@playwright/test";

test.describe("public UI", () => {
  const userEmail = process.env.UI_TEST_USER_EMAIL ?? "";
  const userPassword = process.env.UI_TEST_USER_PASSWORD ?? "";
  const adminEmail = process.env.UI_TEST_ADMIN_EMAIL ?? "";
  const adminPassword = process.env.UI_TEST_ADMIN_PASSWORD ?? "";

  test("renders the search form and navigates with filters", async ({ page }) => {
    await page.goto("/search");

    await expect(
      page.getByRole("heading", { name: "Search rooms" })
    ).toBeVisible();
    await page.getByLabel("Location").fill("New York");
    await page.getByLabel("Guests").selectOption("2");
    await page.getByLabel("Room Type").selectOption("King");
    await page.getByRole("button", { name: "Search rooms" }).click();

    await expect(page).toHaveURL(/location=New%20York|location=New\+York/);
    await expect(page).toHaveURL(/guests=2/);
    await expect(page).toHaveURL(/category=King/);
  });

  test("renders the login form", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Forgot Password?" })
    ).toBeVisible();
  });

  test("allows the seeded user to log in", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(userEmail);
    await page.getByLabel("Password", { exact: true }).fill(userPassword);
    await page.getByRole("button", { name: "LOGIN" }).click();

    await expect(page).toHaveURL(/\/$/);
  });

  test("allows the seeded admin to open the dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(adminEmail);
    await page.getByLabel("Password", { exact: true }).fill(adminPassword);
    await page.getByRole("button", { name: "LOGIN" }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/admin/dashboard");

    await expect(
      page.getByRole("heading", { name: "Sales history" })
    ).toBeVisible();
  });

  test("keeps the login form within a mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");

    const scrollWidth = await page
      .locator("body")
      .evaluate((body) => body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(390);
  });
});
