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

import type { MarketCoin } from "../src/types/market";

import {
  getTopGainers,
  getTopLosers,
  getTopMovers,
  MARKET_INTELLIGENCE_LIMIT,
  MARKET_INTELLIGENCE_MIN_MARKET_CAP,
} from "../src/lib/market-intelligence";

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

// --------------------------------------------------
// Market intelligence fixtures and ranking tests
// --------------------------------------------------

function makeMarketCoin(
  overrides: Partial<MarketCoin> = {},
): MarketCoin {
  return {
    id: "test-coin",
    symbol: "TEST",
    name: "Test Coin",
    logoUrl: "https://example.com/coin.png",
    price: 1,
    change24h: 1,
    marketCap: 50_000_000,
    volume24h: 5_000_000,
    rank: 1,
    ...overrides,
  };
}

test("market intelligence uses the configured top-100 universe", () => {
  assert.equal(MARKET_INTELLIGENCE_LIMIT, 100);
});

test("top gainers include only positive eligible 24-hour changes", () => {
  const coins = [
    makeMarketCoin({
      id: "negative",
      rank: 1,
      change24h: -12,
    }),
    makeMarketCoin({
      id: "gainer-5",
      rank: 2,
      change24h: 5,
    }),
    makeMarketCoin({
      id: "gainer-15",
      rank: 3,
      change24h: 15,
    }),
    makeMarketCoin({
      id: "unchanged",
      rank: 4,
      change24h: 0,
    }),
    makeMarketCoin({
      id: "gainer-9",
      rank: 5,
      change24h: 9,
    }),
  ];

  const result = getTopGainers(coins);

  assert.deepEqual(
    result.map((coin) => coin.id),
    ["gainer-15", "gainer-9", "gainer-5"],
  );

  assert.ok(result.every((coin) => coin.change24h > 0));
});

test("top losers include only negative eligible 24-hour changes", () => {
  const coins = [
    makeMarketCoin({
      id: "gainer",
      rank: 1,
      change24h: 8,
    }),
    makeMarketCoin({
      id: "loser-4",
      rank: 2,
      change24h: -4,
    }),
    makeMarketCoin({
      id: "loser-12",
      rank: 3,
      change24h: -12,
    }),
    makeMarketCoin({
      id: "unchanged",
      rank: 4,
      change24h: 0,
    }),
    makeMarketCoin({
      id: "loser-7",
      rank: 5,
      change24h: -7,
    }),
  ];

  const result = getTopLosers(coins);

  assert.deepEqual(
    result.map((coin) => coin.id),
    ["loser-12", "loser-7", "loser-4"],
  );

  assert.ok(result.every((coin) => coin.change24h < 0));
});

test("market intelligence excludes assets ranked outside the top 100", () => {
  const coins = [
    makeMarketCoin({
      id: "rank-100",
      rank: 100,
      change24h: 10,
    }),
    makeMarketCoin({
      id: "rank-101",
      rank: 101,
      change24h: 500,
    }),
  ];

  const result = getTopGainers(coins);

  assert.deepEqual(
    result.map((coin) => coin.id),
    ["rank-100"],
  );
});

test("market intelligence excludes assets at or below the minimum market cap", () => {
  const coins = [
    makeMarketCoin({
      id: "above-threshold",
      marketCap: MARKET_INTELLIGENCE_MIN_MARKET_CAP + 1,
      change24h: 5,
    }),
    makeMarketCoin({
      id: "at-threshold",
      marketCap: MARKET_INTELLIGENCE_MIN_MARKET_CAP,
      change24h: 100,
    }),
    makeMarketCoin({
      id: "below-threshold",
      marketCap: MARKET_INTELLIGENCE_MIN_MARKET_CAP - 1,
      change24h: 200,
    }),
  ];

  const result = getTopGainers(coins);

  assert.deepEqual(
    result.map((coin) => coin.id),
    ["above-threshold"],
  );
});

test("market intelligence excludes missing and non-finite percentage changes", () => {
  const coins = [
    makeMarketCoin({
      id: "valid",
      change24h: 4,
    }),
    makeMarketCoin({
      id: "missing",
      change24h: null,
    }),
    makeMarketCoin({
      id: "not-finite",
      change24h: Number.NaN,
    }),
  ];

  const result = getTopGainers(coins);

  assert.deepEqual(
    result.map((coin) => coin.id),
    ["valid"],
  );
});

test("top movers rank absolute movement in both directions", () => {
  const coins = [
    makeMarketCoin({
      id: "positive-8",
      change24h: 8,
    }),
    makeMarketCoin({
      id: "negative-14",
      change24h: -14,
    }),
    makeMarketCoin({
      id: "positive-3",
      change24h: 3,
    }),
    makeMarketCoin({
      id: "negative-10",
      change24h: -10,
    }),
    makeMarketCoin({
      id: "unchanged",
      change24h: 0,
    }),
  ];

  const result = getTopMovers(coins);

  assert.deepEqual(
    result.map((coin) => coin.id),
    [
      "negative-14",
      "negative-10",
      "positive-8",
      "positive-3",
    ],
  );
});

test("market intelligence applies the requested result limit", () => {
  const coins = Array.from({ length: 6 }, (_, index) =>
    makeMarketCoin({
      id: `coin-${index + 1}`,
      rank: index + 1,
      change24h: 10 - index,
    }),
  );

  const result = getTopGainers(coins, 2);

  assert.equal(result.length, 2);

  assert.deepEqual(
    result.map((coin) => coin.id),
    ["coin-1", "coin-2"],
  );
});

test("market intelligence returns no results for a non-positive limit", () => {
  const coins = [
    makeMarketCoin({
      id: "gainer",
      change24h: 5,
    }),
  ];

  assert.deepEqual(getTopGainers(coins, 0), []);
  assert.deepEqual(getTopLosers(coins, -1), []);
  assert.deepEqual(getTopMovers(coins, 0), []);
});

test("market intelligence resolves equal movements deterministically", () => {
  const coins = [
    makeMarketCoin({
      id: "lower-cap",
      marketCap: 20_000_000,
      change24h: 5,
    }),
    makeMarketCoin({
      id: "higher-cap",
      marketCap: 80_000_000,
      change24h: 5,
    }),
  ];

  const result = getTopGainers(coins);

  assert.deepEqual(
    result.map((coin) => coin.id),
    ["higher-cap", "lower-cap"],
  );
});