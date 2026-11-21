/**
 * tests/market-data.test.ts
 *
 * Regression tests for normalized global and trending market data,
 * and deterministic fallback market selection.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { CGTrending } from "../src/types/coingecko";

import {
  normalizeGlobal,
  normalizeTrending,
} from "../src/lib/api/normalize";

import { selectFallbackMarkets } from "../src/lib/api/fallback-markets";

// --------------------------------------------------
// Trending fixtures
// --------------------------------------------------

function makeTrendingItem(
  overrides: Partial<CGTrending["coins"][number]["item"]> = {},
): CGTrending["coins"][number]["item"] {
  return {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "btc",
    market_cap_rank: 1,
    thumb: "https://example.com/thumb.png",
    small: "https://example.com/small.png",
    large: "https://example.com/large.png",
    slug: "bitcoin",
    price_btc: 1,
    score: 0,

    data: {
      price: 100,
      price_change_percentage_24h: {
        usd: 2.5,
      },
    },

    ...overrides,
  };
}

// --------------------------------------------------
// Trending normalization tests
// --------------------------------------------------

test("trending data preserves an unavailable price", () => {
  const result = normalizeTrending({
    coins: [
      {
        item: makeTrendingItem({
          data: {
            price: null,
            price_change_percentage_24h: {
              usd: 2.5,
            },
          },
        }),
      },
    ],
  });

  assert.equal(result[0]?.price, null);
});

test("trending data preserves an unavailable percentage change", () => {
  const result = normalizeTrending({
    coins: [
      {
        item: makeTrendingItem({
          data: {
            price: 100,
            price_change_percentage_24h: {},
          },
        }),
      },
    ],
  });

  assert.equal(result[0]?.change24h, null);
});

test("trending data preserves a genuinely missing data object", () => {
  const result = normalizeTrending({
    coins: [
      {
        item: makeTrendingItem({
          data: null,
        }),
      },
    ],
  });

  assert.equal(result[0]?.price, null);
  assert.equal(result[0]?.change24h, null);
});

test("trending data preserves a genuine zero price", () => {
  const result = normalizeTrending({
    coins: [
      {
        item: makeTrendingItem({
          data: {
            price: 0,
            price_change_percentage_24h: {
              usd: 0,
            },
          },
        }),
      },
    ],
  });

  assert.equal(result[0]?.price, 0);
  assert.equal(result[0]?.change24h, 0);
});

test("trending data preserves a negative percentage change", () => {
  const result = normalizeTrending({
    coins: [
      {
        item: makeTrendingItem({
          data: {
            price: 100,
            price_change_percentage_24h: {
              usd: -7.25,
            },
          },
        }),
      },
    ],
  });

  assert.equal(result[0]?.change24h, -7.25);
});

// --------------------------------------------------
// Global statistics normalization tests
// --------------------------------------------------

test("global statistics preserve unavailable metrics", () => {
  const result = normalizeGlobal({
    data: {},
  });

  assert.equal(result.totalMarketCap, null);
  assert.equal(result.totalVolume, null);
  assert.equal(result.btcDominance, null);
  assert.equal(result.ethDominance, null);
  assert.equal(result.activeCoins, null);
  assert.equal(result.marketCapChange24h, null);
});

test("global statistics preserve negative market-cap movement", () => {
  const result = normalizeGlobal({
    data: {
      total_market_cap: {
        usd: 1_000_000,
      },

      total_volume: {
        usd: 100_000,
      },

      market_cap_percentage: {
        btc: 55,
        eth: 15,
      },

      active_cryptocurrencies: 10_000,
      market_cap_change_percentage_24h_usd: -3.5,
    },
  });

  assert.equal(result.marketCapChange24h, -3.5);
});

// --------------------------------------------------
// Fallback selection and pagination tests
// --------------------------------------------------

test("fallback markets preserve requested coin ID order", () => {
  const result = selectFallbackMarkets({
    ids: ["ethereum", "bitcoin"],
    per_page: 2,
    page: 1,
  });

  assert.deepEqual(
    result.map((coin) => coin.id),
    ["ethereum", "bitcoin"],
  );
});

test("fallback markets exclude unknown requested IDs", () => {
  const result = selectFallbackMarkets({
    ids: ["unknown-coin", "bitcoin"],
    per_page: 2,
    page: 1,
  });

  assert.deepEqual(
    result.map((coin) => coin.id),
    ["bitcoin"],
  );
});

test("fallback markets apply pagination", () => {
  const firstPage = selectFallbackMarkets({
    per_page: 5,
    page: 1,
  });

  const secondPage = selectFallbackMarkets({
    per_page: 5,
    page: 2,
  });

  assert.equal(firstPage.length, 5);
  assert.equal(secondPage.length, 5);

  assert.equal(
    firstPage.some((coin) =>
      secondPage.some((other) => other.id === coin.id),
    ),
    false,
  );
});

test("fallback markets return an empty result beyond available pages", () => {
  const result = selectFallbackMarkets({
    per_page: 5,
    page: 100,
  });

  assert.deepEqual(result, []);
});

// --------------------------------------------------
// Fallback sorting tests
// --------------------------------------------------

test("fallback markets sort by market cap ascending", () => {
  const result = selectFallbackMarkets({
    per_page: 3,
    page: 1,
    order: "market_cap_asc",
  });

  assert.deepEqual(
    result.map((coin) => coin.id),
    ["filecoin", "uniswap", "polygon"],
  );
});

test("fallback markets sort by trading volume descending", () => {
  const result = selectFallbackMarkets({
    per_page: 3,
    page: 1,
    order: "volume_desc",
  });

  assert.deepEqual(
    result.map((coin) => coin.id),
    ["tether", "bitcoin", "ethereum"],
  );
});

test("fallback markets support coin ID sorting", () => {
  const result = selectFallbackMarkets({
    per_page: 3,
    page: 1,
    order: "id_asc",
  });

  assert.deepEqual(
    result.map((coin) => coin.id),
    ["avalanche", "bitcoin", "bnb"],
  );
});

test("fallback pagination preserves the selected ordering", () => {
  const firstPage = selectFallbackMarkets({
    per_page: 3,
    page: 1,
    order: "volume_desc",
  });

  const secondPage = selectFallbackMarkets({
    per_page: 3,
    page: 2,
    order: "volume_desc",
  });

  assert.equal(firstPage.length, 3);
  assert.equal(secondPage.length, 3);

  assert.ok(
    firstPage[2]!.volume24h >= secondPage[0]!.volume24h,
  );
});