import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeEmail,
  parseStayDates,
  requireImageDataUrl,
  requirePassword,
  requireString,
} from "../backend/utils/validation";

test("requireString trims valid input and rejects blank values", () => {
  assert.equal(requireString("  Roomi  ", "Name"), "Roomi");
  assert.throws(() => requireString("   ", "Name"), /Name is required/);
});

test("normalizeEmail lowercases and validates email addresses", () => {
  assert.equal(normalizeEmail(" User@Example.COM "), "user@example.com");
  assert.throws(() => normalizeEmail("not-an-email"), /valid email/);
});

test("requirePassword enforces the minimum length", () => {
  assert.equal(requirePassword("secret"), "secret");
  assert.throws(() => requirePassword("short"), /at least 6 characters/);
});

test("parseStayDates calculates the number of nights", () => {
  const result = parseStayDates(
    "2026-10-01T12:00:00.000Z",
    "2026-10-04T12:00:00.000Z"
  );

  assert.equal(result.daysOfStay, 3);
  assert.throws(
    () => parseStayDates("2026-10-04", "2026-10-01"),
    /Invalid booking dates/
  );
});

test("requireImageDataUrl accepts supported images and rejects invalid data", () => {
  const image = "data:image/png;base64,aGVsbG8=";
  assert.equal(requireImageDataUrl(image), image);
  assert.throws(
    () => requireImageDataUrl("data:text/plain;base64,aGVsbG8="),
    /supported image/
  );
});
