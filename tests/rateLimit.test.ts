import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { enforceRateLimit } from "../backend/utils/rateLimit";

test("enforceRateLimit blocks requests after the configured limit", async () => {
  const name = `test-rate-limit-${Date.now()}`;
  const request = new NextRequest("http://localhost/api/test", {
    headers: { "x-forwarded-for": "198.51.100.10" },
  });
  const options = { limit: 2, windowMs: 60_000 };

  assert.equal(enforceRateLimit(request, name, options), null);
  assert.equal(enforceRateLimit(request, name, options), null);

  const response = enforceRateLimit(request, name, options);
  assert.ok(response);
  assert.equal(response.status, 429);
  assert.match(response.headers.get("Retry-After") ?? "", /^\d+$/);
});
