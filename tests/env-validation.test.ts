
import assert from "node:assert/strict";
import test from "node:test";

import {
  parseDatabaseUrl,
  parsePublicEnvironment,
  parseServerEnvironment,
} from "../src/lib/env/validation";

test("public environment accepts valid production Supabase configuration", () => {
  const result = parsePublicEnvironment({
    supabaseUrl: "https://example.supabase.co",
    supabaseAnonKey: "test-anon-key",
    nodeEnv: "production",
  });

  assert.equal(result.supabaseUrl, "https://example.supabase.co");
  assert.equal(result.supabaseAnonKey, "test-anon-key");
});

test("public environment normalizes a trailing slash", () => {
  const result = parsePublicEnvironment({
    supabaseUrl: "https://example.supabase.co/",
    supabaseAnonKey: "test-anon-key",
    nodeEnv: "production",
  });

  assert.equal(result.supabaseUrl, "https://example.supabase.co");
});

test("public environment accepts local HTTP during development", () => {
  const result = parsePublicEnvironment({
    supabaseUrl: "http://127.0.0.1:54321",
    supabaseAnonKey: "test-anon-key",
    nodeEnv: "development",
  });

  assert.equal(result.supabaseUrl, "http://127.0.0.1:54321");
});

test("public environment rejects a missing Supabase URL", () => {
  assert.throws(
    () =>
      parsePublicEnvironment({
        supabaseAnonKey: "test-anon-key",
        nodeEnv: "development",
      }),
    /NEXT_PUBLIC_SUPABASE_URL is required/
  );
});

test("public environment rejects a missing anonymous key", () => {
  assert.throws(
    () =>
      parsePublicEnvironment({
        supabaseUrl: "https://example.supabase.co",
        nodeEnv: "development",
      }),
    /NEXT_PUBLIC_SUPABASE_ANON_KEY is required/
  );
});

test("public environment rejects malformed Supabase URLs", () => {
  assert.throws(
    () =>
      parsePublicEnvironment({
        supabaseUrl: "not-a-url",
        supabaseAnonKey: "test-anon-key",
        nodeEnv: "development",
      }),
    /must be a valid URL/
  );
});

test("public environment rejects remote HTTP Supabase URLs in production", () => {
  assert.throws(
    () =>
      parsePublicEnvironment({
        supabaseUrl: "http://example.supabase.co",
        supabaseAnonKey: "test-anon-key",
        nodeEnv: "production",
      }),
    /must use HTTPS/
  );
});

test("public environment rejects URLs containing credentials", () => {
  assert.throws(
    () =>
      parsePublicEnvironment({
        supabaseUrl: "https://user:password@example.supabase.co",
        supabaseAnonKey: "test-anon-key",
        nodeEnv: "production",
      }),
    /must not contain URL credentials/
  );
});

test("public environment rejects URL query parameters", () => {
  assert.throws(
    () =>
      parsePublicEnvironment({
        supabaseUrl: "https://example.supabase.co?token=test",
        supabaseAnonKey: "test-anon-key",
        nodeEnv: "production",
      }),
    /must not contain query parameters/
  );
});

test("database URL accepts a valid PostgreSQL URL", () => {
  const url = "postgresql://user:password@db.example.com:5432/postgres";

  assert.equal(parseDatabaseUrl(url), url);
});

test("database URL accepts the postgres protocol", () => {
  const url = "postgres://user:password@db.example.com/postgres";

  assert.equal(parseDatabaseUrl(url), url);
});

test("database URL rejects a missing value", () => {
  assert.throws(
    () => parseDatabaseUrl(undefined),
    /DATABASE_URL is required/
  );
});

test("database URL rejects non-PostgreSQL protocols", () => {
  assert.throws(
    () => parseDatabaseUrl("https://example.com"),
    /must use postgres:\/\/ or postgresql:\/\//
  );
});

test("database URL rejects a missing host", () => {
  assert.throws(
    () => parseDatabaseUrl("postgresql:///postgres"),
    /must include a database host/
  );
});

test("server environment supplies the default CoinGecko endpoint", () => {
  const result = parseServerEnvironment({
    databaseUrl: "postgresql://user:password@db.example.com/postgres",
    nodeEnv: "production",
  });

  assert.equal(
    result.coinGeckoBaseUrl,
    "https://api.coingecko.com/api/v3"
  );

  assert.equal(result.coinGeckoDemoApiKey, undefined);
});

test("server environment accepts a custom HTTPS CoinGecko endpoint", () => {
  const result = parseServerEnvironment({
    databaseUrl: "postgresql://user:password@db.example.com/postgres",
    coinGeckoBaseUrl: "https://api.example.com/v3/",
    nodeEnv: "production",
  });

  assert.equal(
    result.coinGeckoBaseUrl,
    "https://api.example.com/v3"
  );
});

test("server environment accepts a local HTTP CoinGecko endpoint in development", () => {
  const result = parseServerEnvironment({
    databaseUrl: "postgresql://user:password@db.example.com/postgres",
    coinGeckoBaseUrl: "http://localhost:8080/api/v3",
    nodeEnv: "development",
  });

  assert.equal(
    result.coinGeckoBaseUrl,
    "http://localhost:8080/api/v3"
  );
});

test("server environment rejects remote HTTP CoinGecko endpoints in production", () => {
  assert.throws(
    () =>
      parseServerEnvironment({
        databaseUrl: "postgresql://user:password@db.example.com/postgres",
        coinGeckoBaseUrl: "http://api.example.com/v3",
        nodeEnv: "production",
      }),
    /must use HTTPS/
  );
});

test("server environment rejects CoinGecko URLs containing credentials", () => {
  assert.throws(
    () =>
      parseServerEnvironment({
        databaseUrl: "postgresql://user:password@db.example.com/postgres",
        coinGeckoBaseUrl: "https://user:password@api.example.com/v3",
        nodeEnv: "production",
      }),
    /must not contain URL credentials/
  );
});

test("server environment trims an optional CoinGecko API key", () => {
  const result = parseServerEnvironment({
    databaseUrl: "postgresql://user:password@db.example.com/postgres",
    coinGeckoDemoApiKey: "  test-api-key  ",
    nodeEnv: "production",
  });

  assert.equal(result.coinGeckoDemoApiKey, "test-api-key");
});

test("server environment treats a blank CoinGecko API key as absent", () => {
  const result = parseServerEnvironment({
    databaseUrl: "postgresql://user:password@db.example.com/postgres",
    coinGeckoDemoApiKey: "   ",
    nodeEnv: "production",
  });

  assert.equal(result.coinGeckoDemoApiKey, undefined);
});

test("server environment rejects an excessively long CoinGecko API key", () => {
  assert.throws(
    () =>
      parseServerEnvironment({
        databaseUrl: "postgresql://user:password@db.example.com/postgres",
        coinGeckoDemoApiKey: "a".repeat(513),
        nodeEnv: "production",
      }),
    /exceeds the supported length/
  );
});
