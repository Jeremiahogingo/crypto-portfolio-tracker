import assert from "node:assert/strict";
import test from "node:test";

import { normalizeCoin } from "../src/lib/api/normalize";
import type { CGMarketCoin } from "../src/types/coingecko";

function makeCoin(
  overrides: Partial<CGMarketCoin> = {},
): CGMarketCoin {
  return {
    id: "bitcoin",
    symbol: "btc",
    name: "Bitcoin",
    image: "https://example.com/bitcoin.png",
    current_price: 100,
    market_cap: 1_000_000,
    total_volume: 100_000,
    price_change_percentage_24h: 2.5,
    market_cap_rank: 1,
    ...overrides,
  } as CGMarketCoin;
}

test("a missing current price remains null", () => {
  const result = normalizeCoin(makeCoin({ current_price: null }));

  assert.equal(result.price, null);
});

test("a missing 24-hour change remains null", () => {
  const result = normalizeCoin(
    makeCoin({ price_change_percentage_24h: null }),
  );

  assert.equal(result.change24h, null);
});

test("a genuine zero current price is preserved", () => {
  const result = normalizeCoin(makeCoin({ current_price: 0 }));

  assert.equal(result.price, 0);
});

test("a genuine zero 24-hour change is preserved", () => {
  const result = normalizeCoin(
    makeCoin({ price_change_percentage_24h: 0 }),
  );

  assert.equal(result.change24h, 0);
});

test("negative 24-hour changes are preserved", () => {
  const result = normalizeCoin(
    makeCoin({ price_change_percentage_24h: -8.75 }),
  );

  assert.equal(result.change24h, -8.75);
});

test("invalid current prices become null", () => {
  const invalidPrices = [
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    -1,
  ];

  for (const price of invalidPrices) {
    const result = normalizeCoin(
      makeCoin({ current_price: price }),
    );

    assert.equal(result.price, null, `Expected ${price} to normalize to null`);
  }
});

test("invalid 24-hour changes become null", () => {
  const invalidChanges = [
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ];

  for (const change of invalidChanges) {
    const result = normalizeCoin(
      makeCoin({ price_change_percentage_24h: change }),
    );

    assert.equal(
      result.change24h,
      null,
      `Expected ${change} to normalize to null`,
    );
  }
});