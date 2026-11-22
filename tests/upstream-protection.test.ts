import assert from "node:assert/strict";
import test from "node:test";

import {
  parseRetryAfter,
  UpstreamRateLimitError,
  UpstreamRequestCoordinator,
} from "../src/lib/api/upstream-coordinator";

function createRateLimitError(retryAfter?: string) {
  return Object.assign(
    new Error("CoinGecko responded with HTTP 429"),
    {
      status: 429,
      retryAfter,
    }
  );
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    promise,
    resolve,
    reject,
  };
}

test("parses Retry-After delta seconds", () => {
  assert.equal(
    parseRetryAfter("12", 0),
    12_000
  );
});

test("parses Retry-After HTTP dates", () => {
  const now = Date.UTC(2026, 10, 22, 8, 0, 0);
  const retryAt = now + 30_000;

  assert.equal(
    parseRetryAfter(
      new Date(retryAt).toUTCString(),
      now
    ),
    30_000
  );
});

test("uses fallback cooldown for missing or invalid Retry-After", () => {
  assert.equal(
    parseRetryAfter(null, 0, 45_000),
    45_000
  );

  assert.equal(
    parseRetryAfter("not-a-date", 0, 45_000),
    45_000
  );
});

test("uses fallback cooldown for negative or fractional delta seconds", () => {
  assert.equal(
    parseRetryAfter("-1", 0, 45_000),
    45_000
  );

  assert.equal(
    parseRetryAfter("1.5", 0, 45_000),
    45_000
  );
});

test("reuses fresh successful responses without another upstream call", async () => {
  let now = 1_000_000;
  let calls = 0;

  const coordinator = new UpstreamRequestCoordinator({
    now: () => now,
  });

  const first = await coordinator.request(
    "markets:usd:100",
    60_000,
    900_000,
    async () => {
      calls += 1;

      return [{ id: "bitcoin" }];
    }
  );

  now += 10_000;

  const second = await coordinator.request(
    "markets:usd:100",
    60_000,
    900_000,
    async () => {
      calls += 1;

      return [{ id: "unexpected" }];
    }
  );

  assert.equal(calls, 1);
  assert.equal(first.source, "live");
  assert.equal(second.source, "live");

  assert.deepEqual(
    second.data,
    [{ id: "bitcoin" }]
  );

  assert.equal(
    second.fetchedAt,
    first.fetchedAt
  );
});

test("deduplicates concurrent requests with the same key", async () => {
  const coordinator = new UpstreamRequestCoordinator();
  const gate = createDeferred<string[]>();

  let calls = 0;

  const fetcher = async () => {
    calls += 1;
    return gate.promise;
  };

  const firstRequest = coordinator.request(
    "trending",
    60_000,
    900_000,
    fetcher
  );

  const secondRequest = coordinator.request(
    "trending",
    60_000,
    900_000,
    fetcher
  );

  // Allow the scheduled fetcher to start.
  await Promise.resolve();

  assert.equal(calls, 1);

  gate.resolve(["bitcoin", "ethereum"]);

  const [first, second] = await Promise.all([
    firstRequest,
    secondRequest,
  ]);

  assert.deepEqual(
    first.data,
    ["bitcoin", "ethereum"]
  );

  assert.deepEqual(
    second.data,
    ["bitcoin", "ethereum"]
  );

  assert.equal(
    first.fetchedAt,
    second.fetchedAt
  );

  assert.equal(calls, 1);
});

test("serves stale successful data after a 429", async () => {
  let now = 1_000_000;
  let calls = 0;

  const coordinator = new UpstreamRequestCoordinator({
    now: () => now,
  });

  const initial = await coordinator.request(
    "markets",
    1_000,
    60_000,
    async () => {
      calls += 1;

      return [{ id: "bitcoin", price: 90_000 }];
    }
  );

  now += 1_001;

  const cached = await coordinator.request(
    "markets",
    1_000,
    60_000,
    async () => {
      calls += 1;

      throw createRateLimitError("30");
    }
  );

  assert.equal(cached.source, "cached");
  assert.deepEqual(cached.data, initial.data);
  assert.equal(cached.fetchedAt, initial.fetchedAt);
  assert.equal(calls, 2);
});

test("429 cooldown is shared across different endpoints", async () => {
  let now = 2_000_000;
  let secondEndpointCalls = 0;

  const coordinator = new UpstreamRequestCoordinator({
    now: () => now,
  });

  const rateLimitError = createRateLimitError("5");

  await assert.rejects(
    coordinator.request(
      "global",
      1_000,
      60_000,
      async () => {
        throw rateLimitError;
      }
    ),
    (error) => error === rateLimitError
  );

  await assert.rejects(
    coordinator.request(
      "trending",
      1_000,
      60_000,
      async () => {
        secondEndpointCalls += 1;

        return ["bitcoin"];
      }
    ),
    UpstreamRateLimitError
  );

  assert.equal(
    secondEndpointCalls,
    0,
    "The global cooldown must prevent another endpoint request."
  );

  // Retry-After has expired.
  now += 5_000;

  const recovered = await coordinator.request(
    "trending",
    1_000,
    60_000,
    async () => {
      secondEndpointCalls += 1;

      return ["bitcoin"];
    }
  );

  assert.equal(recovered.source, "live");
  assert.equal(secondEndpointCalls, 1);
});

test("does not serve stale data beyond its maximum permitted age", async () => {
  let now = 3_000_000;

  const coordinator = new UpstreamRequestCoordinator({
    now: () => now,
  });

  await coordinator.request(
    "markets",
    1_000,
    5_000,
    async () => [{ id: "bitcoin" }]
  );

  // Move beyond the five-second stale allowance.
  now += 5_001;

  const rateLimitError = createRateLimitError("10");

  await assert.rejects(
    coordinator.request(
      "markets",
      1_000,
      5_000,
      async () => {
        throw rateLimitError;
      }
    ),
    (error) => error === rateLimitError
  );
});

test("serves stale successful data after a non-rate-limit upstream failure", async () => {
  let now = 4_000_000;

  const coordinator = new UpstreamRequestCoordinator({
    now: () => now,
  });

  const initial = await coordinator.request(
    "global",
    1_000,
    60_000,
    async () => ({
      marketCap: 3_000_000_000_000,
    })
  );

  now += 2_000;

  const result = await coordinator.request(
    "global",
    1_000,
    60_000,
    async () => {
      throw new Error("Temporary network failure");
    }
  );

  assert.equal(result.source, "cached");
  assert.deepEqual(result.data, initial.data);
  assert.equal(result.fetchedAt, initial.fetchedAt);
});