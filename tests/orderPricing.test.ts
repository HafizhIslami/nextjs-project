import assert from "node:assert/strict";
import test from "node:test";
import { calculateDuration, calculateLineTotal } from "../backend/services/orderPricing";

test("calculateLineTotal applies quantity and duration", () => {
  assert.equal(calculateLineTotal({ amountMinor: 50_000, quantity: 2, pricingModel: "fixed" }), 100_000);
  assert.equal(calculateLineTotal({ amountMinor: 100_000, quantity: 1, pricingModel: "per_duration", duration: 3 }), 300_000);
});

test("calculateDuration rounds partial billable units up", () => {
  const result = calculateDuration("2026-09-01T10:00:00Z", "2026-09-01T11:30:00Z", "hour");
  assert.equal(result.duration, 2);
});

test("calculateDuration rejects an inverted range", () => {
  assert.throws(() => calculateDuration("2026-09-02", "2026-09-01", "day"));
});
