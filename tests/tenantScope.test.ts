import assert from "node:assert/strict";
import test from "node:test";
import { tenantFilter } from "../backend/tenancy/scope";
import type { TenantContext } from "../backend/tenancy/tenantContext";

const tenant = (legacy: boolean): TenantContext => ({
  merchantId: "000000000000000000000001",
  merchantCode: "roomi",
  name: "Roomi",
  hostname: "roomi.localhost",
  primaryHostname: "roomi.localhost",
  currency: "IDR",
  locale: "id-ID",
  timezone: "Asia/Jakarta",
  branding: {
    primaryColor: "#a7194b",
    secondaryColor: "#23191f",
    accentColor: "#f6dce6",
  },
  enabledModules: ["catalog"],
  isLegacyFallback: legacy,
});

test("tenantFilter always adds merchantId for migrated tenants", () => {
  assert.deepEqual(tenantFilter(tenant(false), { status: "active" }), {
    status: "active",
    merchantId: "000000000000000000000001",
  });
});

test("legacy default tenant can read unmigrated Roomi records", () => {
  const filter = tenantFilter(tenant(true), { status: "active" });
  assert.ok("$and" in filter);
  assert.equal(JSON.stringify(filter).includes("$exists"), true);
});
