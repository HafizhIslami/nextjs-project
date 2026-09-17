import fs from "node:fs";
import path from "node:path";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

const browserRoot = path.resolve(
  process.env.PLAYWRIGHT_BROWSERS_PATH || ".playwright-browsers"
);
const chromiumDirectory = fs
  .readdirSync(browserRoot, { withFileTypes: true })
  .find((entry) => entry.isDirectory() && entry.name.startsWith("chromium-"));

if (!chromiumDirectory) {
  throw new Error("Chromium is missing. Run npm run ui:install first.");
}

const chromePath = path.join(
  browserRoot,
  chromiumDirectory.name,
  "chrome-win",
  "chrome.exe"
);
const outputDirectory = path.resolve("lighthouse-reports");
fs.mkdirSync(outputDirectory, { recursive: true });

const chrome = await chromeLauncher.launch({
  chromePath,
  chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"],
});

const thresholds = {
  performance: 0.85,
  accessibility: 0.95,
  "best-practices": 0.9,
  seo: 0.9,
};
let failed = false;

try {
  for (const [name, route] of [
    ["home", "/"],
    ["search", "/search"],
    ["login", "/login"],
  ]) {
    const result = await lighthouse(`http://127.0.0.1:3100${route}`, {
      port: chrome.port,
      output: "json",
      logLevel: "error",
      onlyCategories: Object.keys(thresholds),
    });

    if (!result) throw new Error(`Lighthouse returned no result for ${route}`);
    fs.writeFileSync(path.join(outputDirectory, `${name}.json`), result.report);

    const scores = Object.fromEntries(
      Object.entries(thresholds).map(([category, threshold]) => {
        const score = result.lhr.categories[category].score ?? 0;
        if (score < threshold) failed = true;
        return [category, Math.round(score * 100)];
      })
    );
    console.log(`${name}: ${JSON.stringify(scores)}`);
  }
} finally {
  try {
    await chrome.kill();
  } catch (error) {
    if (error instanceof Error && error.message.includes("EPERM")) {
      console.warn("Chrome stopped; Windows deferred cleanup of its temporary profile.");
    } else {
      failed = true;
      console.error("Chrome cleanup failed.", error);
    }
  }
}

if (failed) {
  console.error("One or more Lighthouse scores are below the project thresholds.");
}

process.exit(failed ? 1 : 0);
