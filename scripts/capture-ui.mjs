import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const outputDirectory = path.resolve("ui-review");
fs.mkdirSync(outputDirectory, { recursive: true });

const browser = await chromium.launch();

try {
  const desktop = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  await desktop.goto("http://127.0.0.1:3100", { waitUntil: "networkidle" });
  await desktop.screenshot({ path: path.join(outputDirectory, "home-desktop.png"), fullPage: true });

  await desktop.getByRole("link", { name: "Roomi UI Test Room", exact: true }).first().click();
  await desktop.waitForURL(/\/rooms\//);
  await desktop.getByRole("heading", { name: "Roomi UI Test Room", level: 1 }).waitFor({
    state: "visible",
    timeout: 15000,
  });
  await desktop.screenshot({ path: path.join(outputDirectory, "room-desktop.png"), fullPage: true });

  await desktop.goto("http://127.0.0.1:3100/login", { waitUntil: "networkidle" });
  await desktop.getByLabel("Email").fill(process.env.UI_TEST_ADMIN_EMAIL);
  await desktop.getByLabel("Password", { exact: true }).fill(process.env.UI_TEST_ADMIN_PASSWORD);
  await desktop.getByRole("button", { name: "LOGIN" }).click();
  await desktop.waitForURL("http://127.0.0.1:3100/");
  await desktop.goto("http://127.0.0.1:3100/admin/dashboard", { waitUntil: "networkidle" });
  await desktop.screenshot({ path: path.join(outputDirectory, "dashboard-desktop.png"), fullPage: true });

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  await mobile.goto("http://127.0.0.1:3100", { waitUntil: "networkidle" });
  await mobile.screenshot({ path: path.join(outputDirectory, "home-mobile.png"), fullPage: true });
  await mobile.goto("http://127.0.0.1:3100/login", { waitUntil: "networkidle" });
  await mobile.screenshot({ path: path.join(outputDirectory, "login-mobile.png"), fullPage: true });
} finally {
  await browser.close();
}

console.log(`UI review images saved to ${outputDirectory}`);
