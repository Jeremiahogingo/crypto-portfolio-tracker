// src/components/dashboard/TopMovers.tsx
//
// Dashboard widget — coins with the largest absolute 24h movement, up or
// down. Signals "what's interesting right now" rather than "which way is
// the market trending" (that's GainersLosers on the Markets page).
//
// Owns its own fetch: dashboard and markets use different per_page values
// (dashboard=50, markets=100) so they get separate cache entries. That's
// intentional — dashboard doesn't need 100 coins and can accept a smaller
// payload.

"use client";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import CoinLogo from "@/components/ui/CoinLogo";
import { useMarkets } from "@/hooks/useMarkets";
import { formatPrice, formatPercent } from "@/utils/format";

const MAX_RANK = 100;
const MIN_MARKET_CAP = 10_000_000;
const TOP_N = 4;

export default function TopMovers() {
  const { coins, isLoading } = useMarkets({ per_page: 50 });

  if (isLoading) {
    return (
      <Card>
        <Skeleton className="h-4 w-28 mb-4" />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full mb-2" />
        ))}
      </Card>
    );
  }

  const eligible = coins.filter(
    (c) => c.rank > 0 && c.rank <= MAX_RANK && c.marketCap > MIN_MARKET_CAP
  );

  const movers = [...eligible]
    .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
    .slice(0, TOP_N);

  return (
    <Card className="h-full">
      <h3 className="text-sm font-semibold text-text mb-4">Top Movers</h3>
      {movers.length === 0 ? (
        <p className="text-sm text-secondary py-2">No data available.</p>
      ) : (
        <div className="space-y-3">
          {movers.map((coin) => (
            <div
              key={coin.id}
              className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <CoinLogo src={coin.logoUrl} alt={coin.name} size="sm" />
                <span className="text-sm font-medium text-text">
                  {coin.symbol}
                </span>
              </div>
              <span className="text-xs text-secondary">
                {formatPrice(coin.price)}
              </span>
              <Badge variant={coin.change24h >= 0 ? "success" : "danger"}>
                {formatPercent(coin.change24h)}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}