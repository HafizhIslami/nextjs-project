import assert from "node:assert/strict";
import test from "node:test";
import { normalizeImageUrl } from "../helpers/imageUrl";

test("normalizeImageUrl upgrades legacy Cloudinary URLs to HTTPS", () => {
  assert.equal(
    normalizeImageUrl(
      "http://res.cloudinary.com/demo/la1.jpg",
      "/images/default_room_image.jpg"
    ),
    "https://res.cloudinary.com/demo/la1.jpg"
  );
});

test("normalizeImageUrl preserves local and image preview URLs", () => {
  assert.equal(
    normalizeImageUrl("/images/room.jpg", "/images/fallback.jpg"),
    "/images/room.jpg"
  );
  assert.equal(
    normalizeImageUrl("data:image/png;base64,AAAA", "/images/fallback.jpg"),
    "data:image/png;base64,AAAA"
  );
});

test("normalizeImageUrl falls back for malformed URLs", () => {
  assert.equal(
    normalizeImageUrl("not a valid URL", "/images/fallback.jpg"),
    "/images/fallback.jpg"
  );
});
