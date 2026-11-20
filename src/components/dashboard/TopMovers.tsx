// src/components/dashboard/TopMovers.tsx
//
// Dashboard widget: coins with the largest absolute 24-hour movement.
// Coins without a valid 24-hour percentage change are excluded.

"use client";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import CoinLogo from "@/components/ui/CoinLogo";
import { useMarkets } from "@/hooks/useMarkets";
import type { MarketCoin } from "@/types/market";
import { formatPrice, formatPercent } from "@/utils/format";

const MAX_RANK = 100;
const MIN_MARKET_CAP = 10_000_000;
const TOP_N = 4;

type CoinWithChange = MarketCoin & {
  change24h: number;
};

function hasChange(coin: MarketCoin): coin is CoinWithChange {
  return coin.change24h !== null;
}

export default function TopMovers() {
  const { coins, meta, isLoading } = useMarkets({ per_page: 50 });

  if (isLoading) {
    return (
      <Card>
        <Skeleton className="mb-4 h-4 w-28" />
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} className="mb-2 h-12 w-full" />
        ))}
      </Card>
    );
  }

  const eligible = coins.filter(
    (coin): coin is CoinWithChange =>
      hasChange(coin) &&
      coin.rank > 0 &&
      coin.rank <= MAX_RANK &&
      coin.marketCap > MIN_MARKET_CAP
  );

  const movers = [...eligible]
    .sort(
      (a, b) =>
        Math.abs(b.change24h) - Math.abs(a.change24h)
    )
    .slice(0, TOP_N);

  return (
    <Card className="h-full">
      <h3 className="mb-4 text-sm font-semibold text-text">
        Top Movers
      </h3>

      {meta?.source === "fallback" && (
        <p className="mb-3 text-xs text-warning">
          Showing indicative fallback market data.
        </p>
      )}

      {movers.length === 0 ? (
        <p className="py-2 text-sm text-secondary">
          No valid 24-hour movement data available.
        </p>
      ) : (
        <div className="space-y-3">
          {movers.map((coin) => (
            <div
              key={coin.id}
              className="flex items-center justify-between border-b border-white/5 py-2 last:border-0"
            >
              <div className="flex min-w-0 items-center gap-2">
                <CoinLogo
                  src={coin.logoUrl}
                  alt={coin.name}
                  size="sm"
                />
                <span className="text-sm font-medium text-text">
                  {coin.symbol}
                </span>
              </div>

              <span className="text-xs text-secondary">
                {coin.price === null ? "—" : formatPrice(coin.price)}
              </span>

              <Badge
                variant={coin.change24h >= 0 ? "success" : "danger"}
              >
                {formatPercent(coin.change24h)}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}