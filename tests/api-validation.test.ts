
/**
 * tests/api-validation.test.ts
 *
 * Regression tests for public API query validation and RSS URL safety.
 */

import { test } from "node:test";
import { strict as assert } from "node:assert";

import {
  parseMarketsQuery,
  parseNewsQuery,
  sanitizeHttpsUrl,
} from "../src/lib/api/route-validation";

// --------------------------------------------------
// Markets query tests
// --------------------------------------------------

test("markets query provides safe default values", () => {
  const result = parseMarketsQuery(new URLSearchParams());

  assert.equal(result.success, true);

  if (!result.success) return;

  assert.deepEqual(result.data, {
    vs_currency: "usd",
    per_page: 100,
    page: 1,
    sparkline: false,
  });

  assert.equal("ids" in result.data, false);
});

test("markets query accepts valid pagination parameters", () => {
  const result = parseMarketsQuery(
    new URLSearchParams(
      "vs_currency=KES&per_page=50&page=2&sparkline=true"
    )
  );

  assert.equal(result.success, true);

  if (!result.success) return;

  assert.equal(result.data.vs_currency, "kes");
  assert.equal(result.data.per_page, 50);
  assert.equal(result.data.page, 2);
  assert.equal(result.data.sparkline, true);
});

test("markets query accepts valid coin IDs", () => {
  const result = parseMarketsQuery(
    new URLSearchParams(
      "ids=bitcoin,ethereum,wrapped-bitcoin&per_page=3"
    )
  );

  assert.equal(result.success, true);

  if (!result.success) return;

  assert.deepEqual(result.data.ids, [
    "bitcoin",
    "ethereum",
    "wrapped-bitcoin",
  ]);
});

test("markets query normalizes currency to lowercase", () => {
  const result = parseMarketsQuery(
    new URLSearchParams("vs_currency=USD")
  );

  assert.equal(result.success, true);

  if (!result.success) return;

  assert.equal(result.data.vs_currency, "usd");
});

test("markets query rejects invalid currency syntax", () => {
  const result = parseMarketsQuery(
    new URLSearchParams("vs_currency=usd%24")
  );

  assert.equal(result.success, false);
});

test("markets query rejects alphabetic per_page values", () => {
  const result = parseMarketsQuery(
    new URLSearchParams("per_page=abc")
  );

  assert.equal(result.success, false);
});

test("markets query rejects fractional page sizes", () => {
  const result = parseMarketsQuery(
    new URLSearchParams("per_page=10.5")
  );

  assert.equal(result.success, false);
});

test("markets query rejects zero page sizes", () => {
  const result = parseMarketsQuery(
    new URLSearchParams("per_page=0")
  );

  assert.equal(result.success, false);
});

test("markets query rejects page sizes above 250", () => {
  const result = parseMarketsQuery(
    new URLSearchParams("per_page=251")
  );

  assert.equal(result.success, false);
});

test("markets query accepts the maximum page size", () => {
  const result = parseMarketsQuery(
    new URLSearchParams("per_page=250")
  );

  assert.equal(result.success, true);
});

test("markets query rejects non-integer page numbers", () => {
  const result = parseMarketsQuery(
    new URLSearchParams("page=1.5")
  );

  assert.equal(result.success, false);
});

test("markets query rejects excessive page numbers", () => {
  const result = parseMarketsQuery(
    new URLSearchParams("page=10001")
  );

  assert.equal(result.success, false);
});

test("markets query rejects invalid sparkline values", () => {
  const result = parseMarketsQuery(
    new URLSearchParams("sparkline=yes")
  );

  assert.equal(result.success, false);
});

test("markets query accepts an explicit false sparkline value", () => {
  const result = parseMarketsQuery(
    new URLSearchParams("sparkline=false")
  );

  assert.equal(result.success, true);

  if (!result.success) return;

  assert.equal(result.data.sparkline, false);
});

test("markets query rejects empty coin ID entries", () => {
  const result = parseMarketsQuery(
    new URLSearchParams("ids=bitcoin,,ethereum")
  );

  assert.equal(result.success, false);
});

test("markets query rejects malformed coin IDs", () => {
  const result = parseMarketsQuery(
    new URLSearchParams("ids=bitcoin,ethereum%24")
  );

  assert.equal(result.success, false);
});

test("markets query rejects duplicate coin IDs", () => {
  const result = parseMarketsQuery(
    new URLSearchParams("ids=bitcoin,ethereum,bitcoin")
  );

  assert.equal(result.success, false);
});

test("markets query rejects more than 250 coin IDs", () => {
  const ids = Array.from(
    { length: 251 },
    (_, index) => `coin-${index}`
  ).join(",");

  const result = parseMarketsQuery(
    new URLSearchParams(`ids=${ids}&per_page=250`)
  );

  assert.equal(result.success, false);
});

test("markets query requires per_page to cover requested IDs", () => {
  const result = parseMarketsQuery(
    new URLSearchParams("ids=bitcoin,ethereum&per_page=1")
  );

  assert.equal(result.success, false);
});

test("markets query rejects duplicated parameters", () => {
  const result = parseMarketsQuery(
    new URLSearchParams("per_page=10&per_page=20")
  );

  assert.equal(result.success, false);
});

// --------------------------------------------------
// News query tests
// --------------------------------------------------

test("news query provides a default limit of 30", () => {
  const result = parseNewsQuery(new URLSearchParams());

  assert.equal(result.success, true);

  if (!result.success) return;

  assert.equal(result.data.limit, 30);
});

test("news query accepts a valid limit", () => {
  const result = parseNewsQuery(
    new URLSearchParams("limit=20")
  );

  assert.equal(result.success, true);

  if (!result.success) return;

  assert.equal(result.data.limit, 20);
});

test("news query accepts the maximum limit", () => {
  const result = parseNewsQuery(
    new URLSearchParams("limit=50")
  );

  assert.equal(result.success, true);

  if (!result.success) return;

  assert.equal(result.data.limit, 50);
});

test("news query rejects values that are not integers", () => {
  const result = parseNewsQuery(
    new URLSearchParams("limit=2.5")
  );

  assert.equal(result.success, false);
});

test("news query rejects non-numeric values", () => {
  const result = parseNewsQuery(
    new URLSearchParams("limit=abc")
  );

  assert.equal(result.success, false);
});

test("news query rejects zero", () => {
  const result = parseNewsQuery(
    new URLSearchParams("limit=0")
  );

  assert.equal(result.success, false);
});

test("news query rejects limits above 50", () => {
  const result = parseNewsQuery(
    new URLSearchParams("limit=51")
  );

  assert.equal(result.success, false);
});

test("news query rejects duplicate limit parameters", () => {
  const result = parseNewsQuery(
    new URLSearchParams("limit=10&limit=20")
  );

  assert.equal(result.success, false);
});

// --------------------------------------------------
// External URL tests
// --------------------------------------------------

test("accepts a valid HTTPS article URL", () => {
  assert.equal(
    sanitizeHttpsUrl("https://example.com/article"),
    "https://example.com/article"
  );
});

test("accepts a valid HTTPS image URL", () => {
  assert.equal(
    sanitizeHttpsUrl("https://cdn.example.com/image.webp"),
    "https://cdn.example.com/image.webp"
  );
});

test("normalizes valid HTTPS URLs", () => {
  assert.equal(
    sanitizeHttpsUrl("https://example.com"),
    "https://example.com/"
  );
});

test("rejects HTTP URLs", () => {
  assert.equal(
    sanitizeHttpsUrl("http://example.com/article"),
    undefined
  );
});

test("rejects JavaScript URLs", () => {
  assert.equal(
    sanitizeHttpsUrl("javascript:alert(1)"),
    undefined
  );
});

test("rejects data URLs", () => {
  assert.equal(
    sanitizeHttpsUrl("data:text/html,hello"),
    undefined
  );
});

test("rejects protocol-relative URLs", () => {
  assert.equal(
    sanitizeHttpsUrl("//example.com/article"),
    undefined
  );
});

test("rejects embedded URL credentials", () => {
  assert.equal(
    sanitizeHttpsUrl("https://user:password@example.com"),
    undefined
  );
});

test("rejects URLs containing whitespace around them", () => {
  assert.equal(
    sanitizeHttpsUrl(" https://example.com "),
    undefined
  );
});

test("rejects malformed URLs", () => {
  assert.equal(
    sanitizeHttpsUrl("https://%"),
    undefined
  );
});

test("rejects empty URL values", () => {
  assert.equal(
    sanitizeHttpsUrl(""),
    undefined
  );
});

test("rejects non-string URL values", () => {
  assert.equal(
    sanitizeHttpsUrl(123),
    undefined
  );
});

test("rejects oversized URL values", () => {
  const oversized = `https://example.com/${"a".repeat(2_100)}`;

  assert.equal(
    sanitizeHttpsUrl(oversized),
    undefined
  );
});
