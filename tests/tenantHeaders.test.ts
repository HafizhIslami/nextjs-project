import assert from "node:assert/strict";
import test from "node:test";
import {
  signTenantHostname,
  verifyTenantHostnameSignature,
} from "../backend/tenancy/internalHeaders";

test("internal tenant forwarding accepts a valid signature", () => {
  const previous = process.env.TENANT_INTERNAL_SECRET;
  process.env.TENANT_INTERNAL_SECRET = "unit-test-tenant-secret";
  try {
    const signature = signTenantHostname("Shop.Example.com:443");
    assert.ok(signature);
    assert.equal(
      verifyTenantHostnameSignature("shop.example.com", signature),
      "shop.example.com"
    );
  } finally {
    if (previous === undefined) delete process.env.TENANT_INTERNAL_SECRET;
    else process.env.TENANT_INTERNAL_SECRET = previous;
  }
});

test("internal tenant forwarding rejects a forged signature", () => {
  const previous = process.env.TENANT_INTERNAL_SECRET;
  process.env.TENANT_INTERNAL_SECRET = "unit-test-tenant-secret";
  try {
    assert.equal(verifyTenantHostnameSignature("shop.example.com", "deadbeef"), null);
  } finally {
    if (previous === undefined) delete process.env.TENANT_INTERNAL_SECRET;
    else process.env.TENANT_INTERNAL_SECRET = previous;
  }
});
