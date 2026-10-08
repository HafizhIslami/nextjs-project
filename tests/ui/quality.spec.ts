import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("UI quality", () => {
  const userEmail = process.env.UI_TEST_USER_EMAIL ?? "";
  const userPassword = process.env.UI_TEST_USER_PASSWORD ?? "";

  test("submits the visible default search filters", async ({ page }) => {
    await page.goto("/search");

    await expect(page.getByLabel("Guests")).toHaveValue("1");
    await expect(page.getByLabel("Room Type")).toHaveValue("King");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Search rooms" }).click();

    await expect(page).toHaveURL(/guests=1/);
    await expect(page).toHaveURL(/category=King/);
  });

  for (const route of ["/", "/search", "/login", "/register"]) {
    test(`${route} has no serious accessibility violations`, async ({ page }) => {
      await page.goto(route);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();

      const seriousViolations = results.violations.filter(
        ({ impact }) => impact === "critical" || impact === "serious"
      );
      expect(seriousViolations).toEqual([]);
    });
  }

  test("core public pages do not overflow the viewport", async ({ page }) => {
    for (const route of ["/", "/search", "/login", "/register"]) {
      await page.goto(route);
      const dimensions = await page.locator("html").evaluate((element) => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }));
      expect(dimensions.scrollWidth, `${route} overflows horizontally`).toBeLessThanOrEqual(
        dimensions.clientWidth
      );
    }
  });

  test("room details expose content without serious accessibility violations", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Roomi UI Test Room", exact: true }).first().click();
    await expect(
      page.getByRole("heading", { name: "Roomi UI Test Room", level: 1 })
    ).toBeVisible();
    await expect(page.getByText("Breakfast")).toBeVisible();
    await expect(page.getByText("Included").first()).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const seriousViolations = results.violations.filter(
      ({ impact }) => impact === "critical" || impact === "serious"
    );
    expect(seriousViolations).toEqual([]);
  });

  test("canceling payment review never starts checkout", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(userEmail);
    await page.getByLabel("Password", { exact: true }).fill(userPassword);
    await page.getByRole("button", { name: "LOGIN" }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.getByRole("link", { name: "Roomi UI Test Room", exact: true }).first().click();
    await expect(
      page.getByRole("heading", { name: "Roomi UI Test Room", level: 1 })
    ).toBeVisible();

    const availableDays = page.locator(
      ".react-datepicker__day:not(.react-datepicker__day--disabled):not(.react-datepicker__day--outside-month)"
    );
    await availableDays.nth(1).click();
    await availableDays.nth(3).click();
    await expect(page.getByText(/^Available for/)).toBeVisible();
    await page.getByRole("button", { name: /Review and continue/ }).click();
    const paymentDialog = page
      .getByRole("dialog")
      .filter({ hasText: "Review payment details" });
    await expect(paymentDialog).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(paymentDialog).toBeHidden();
    await expect(page).toHaveURL(/\/rooms\//);
  });
});
