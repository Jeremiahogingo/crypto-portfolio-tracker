
/**
 * tests/safe-redirect.test.ts
 *
 * Security regression tests for login redirect validation.
 *
 * These tests ensure that untrusted navigation destinations cannot
 * redirect authenticated users to external websites or unsafe URLs.
 */

import { test } from "node:test";
import { strict as assert } from "node:assert";

import { getSafeNextPath } from "../src/lib/auth/safe-redirect";

test("allows a valid internal dashboard route", () => {
  assert.equal(
    getSafeNextPath("/portfolio"),
    "/portfolio"
  );
});

test("allows valid nested application routes", () => {
  assert.equal(
    getSafeNextPath("/portfolio/transactions"),
    "/portfolio/transactions"
  );
});

test("preserves internal query parameters", () => {
  assert.equal(
    getSafeNextPath("/portfolio?tab=transactions"),
    "/portfolio?tab=transactions"
  );
});

test("preserves internal URL fragments", () => {
  assert.equal(
    getSafeNextPath("/portfolio#holdings"),
    "/portfolio#holdings"
  );
});

test("preserves query parameters and fragments together", () => {
  assert.equal(
    getSafeNextPath("/portfolio?tab=all#holdings"),
    "/portfolio?tab=all#holdings"
  );
});

test("allows the application root", () => {
  assert.equal(
    getSafeNextPath("/"),
    "/"
  );
});

test("rejects external HTTPS URLs", () => {
  assert.equal(
    getSafeNextPath("https://evil.example"),
    "/"
  );
});

test("rejects external HTTP URLs", () => {
  assert.equal(
    getSafeNextPath("http://evil.example"),
    "/"
  );
});

test("rejects protocol-relative URLs", () => {
  assert.equal(
    getSafeNextPath("//evil.example"),
    "/"
  );
});

test("rejects triple-slash URL references", () => {
  assert.equal(
    getSafeNextPath("///evil.example"),
    "/"
  );
});

test("rejects JavaScript URLs", () => {
  assert.equal(
    getSafeNextPath("javascript:alert(1)"),
    "/"
  );
});

test("rejects data URLs", () => {
  assert.equal(
    getSafeNextPath("data:text/html,<script>alert(1)</script>"),
    "/"
  );
});

test("rejects plain relative paths", () => {
  assert.equal(
    getSafeNextPath("portfolio"),
    "/"
  );
});

test("rejects backslash-based URL references", () => {
  assert.equal(
    getSafeNextPath("/\\evil.example"),
    "/"
  );
});

test("rejects empty destinations", () => {
  assert.equal(
    getSafeNextPath(""),
    "/"
  );
});

test("rejects missing destinations", () => {
  assert.equal(
    getSafeNextPath(null),
    "/"
  );
});

test("rejects leading whitespace before an internal path", () => {
  assert.equal(
    getSafeNextPath(" /portfolio"),
    "/"
  );
});

test("rejects control characters in destinations", () => {
  assert.equal(
    getSafeNextPath("/portfolio\n"),
    "/"
  );
});

test("keeps malformed percent escapes on the internal origin", () => {
  assert.equal(
    getSafeNextPath("/%"),
    "/%"
  );
});
