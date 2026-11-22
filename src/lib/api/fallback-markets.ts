import { fallbackMarkets } from "@/mock/api/fallback";
import type { MarketCoin, MarketOrder } from "@/types/market";

export interface FallbackMarketsQuery {
  ids?: string[];
  per_page: number;
  page: number;
  order?: MarketOrder;
}

function compareByOrder(
  a: MarketCoin,
  b: MarketCoin,
  order: MarketOrder,
): number {
  switch (order) {
    case "market_cap_desc":
      return b.marketCap - a.marketCap || a.id.localeCompare(b.id);

    case "market_cap_asc":
      return a.marketCap - b.marketCap || a.id.localeCompare(b.id);

    case "volume_desc":
      return b.volume24h - a.volume24h || a.id.localeCompare(b.id);

    case "volume_asc":
      return a.volume24h - b.volume24h || a.id.localeCompare(b.id);

    case "id_asc":
      return a.id.localeCompare(b.id);

    case "id_desc":
      return b.id.localeCompare(a.id);
  }
}

/**
 * Apply the live market endpoint's sorting and pagination contract
 * to the local sample dataset.
 *
 * For explicit IDs, preserve the requested order. Unknown IDs are
 * omitted rather than being replaced with unrelated sample coins.
 */
export function selectFallbackMarkets(
  query: FallbackMarketsQuery,
): MarketCoin[] {
  let selected: MarketCoin[];

  if (query.ids) {
    const marketById = new Map(
      fallbackMarkets.map((coin) => [coin.id, coin]),
    );

    selected = query.ids.flatMap((id) => {
      const coin = marketById.get(id);
      return coin ? [coin] : [];
    });
  } else {
    const order = query.order ?? "market_cap_desc";

    selected = [...fallbackMarkets].sort(
      (a, b) => compareByOrder(a, b, order),
    );
  }

  const start = (query.page - 1) * query.per_page;

  return selected.slice(start, start + query.per_page);
}