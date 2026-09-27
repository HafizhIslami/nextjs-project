import assert from "node:assert/strict";
import test from "node:test";
import { getPlatformHostnames, isPlatformHostname } from "../backend/platform/host";

test("platform console accepts only configured root hosts", () => {
  const previous = {
    root: process.env.PLATFORM_ROOT_DOMAIN,
    console: process.env.PLATFORM_CONSOLE_URL,
  };
  process.env.PLATFORM_ROOT_DOMAIN = "example.test";
  process.env.PLATFORM_CONSOLE_URL = "https://control.example.test";
  try {
    assert.equal(isPlatformHostname("example.test:443"), true);
    assert.equal(isPlatformHostname("control.example.test"), true);
    assert.equal(isPlatformHostname("merchant.example.test"), false);
    assert.ok(getPlatformHostnames().includes("example.test"));
  } finally {
    process.env.PLATFORM_ROOT_DOMAIN = previous.root;
    process.env.PLATFORM_CONSOLE_URL = previous.console;
  }
});
