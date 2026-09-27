import assert from "node:assert/strict";
import test from "node:test";
import {
  getLocalMerchantCode,
  getSubdomainMerchantCode,
  normalizeHostname,
} from "../backend/tenancy/hostname";

test("normalizeHostname removes ports and normalizes case", () => {
  assert.equal(normalizeHostname("Sayur-Segar.Roomi.ID:443"), "sayur-segar.roomi.id");
  assert.equal(normalizeHostname("shop.example.com, proxy.internal"), "shop.example.com");
  assert.equal(normalizeHostname("bad host"), "");
});

test("platform subdomain resolves a merchant code", () => {
  assert.equal(getSubdomainMerchantCode("sayur.roomi.id", "roomi.id"), "sayur");
  assert.equal(getSubdomainMerchantCode("admin.roomi.id", "roomi.id"), null);
  assert.equal(getSubdomainMerchantCode("nested.sayur.roomi.id", "roomi.id"), null);
});

test("localhost supports merchant subdomains during development", () => {
  assert.equal(getLocalMerchantCode("localhost:3000", "roomi"), "roomi");
  assert.equal(getLocalMerchantCode("sayur.localhost:3000", "roomi"), "sayur");
});
