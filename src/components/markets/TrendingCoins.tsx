// src/components/markets/TrendingCoins.tsx
//
// Horizontal scrolling rail of the most-searched coins. CoinGecko's
// /search/trending endpoint sometimes returns 15+ items; we cap at 7 to
// match the visual layout. Real data includes microcaps that can be
// volatile — we display whatever the API returns, since trending is
// exactly where "weird" is expected.

"use client";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import CoinLogo from "@/components/ui/CoinLogo";
import { useTrending } from "@/hooks/useTrending";
import { formatPrice, formatPercent } from "@/utils/format";

export default function TrendingCoins() {
  const { coins, isLoading } = useTrending({ limit: 7 });

  if (isLoading) {
    return (
      <Card>
        <Skeleton className="h-4 w-28 mb-4" />
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="w-40 h-28 flex-shrink-0" />
          ))}
        </div>
      </Card>
    );
  }

  if (coins.length === 0) {
    return (
      <Card>
        <h3 className="text-sm font-semibold text-text mb-4">🔥 Trending</h3>
        <p className="text-sm text-secondary">No trending data available.</p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold text-text mb-4">🔥 Trending</h3>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {coins.map((coin) => (
          <div
            key={coin.id}
            className="flex-shrink-0 w-40 bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:bg-white/[0.05] transition-colors"
          >
            <div className="flex items-center gap-2">
              <CoinLogo src={coin.logoUrl} alt={coin.name} size="sm" />
              <span className="text-sm font-medium text-text truncate">
                {coin.symbol}
              </span>
            </div>
            <p className="text-xs text-secondary mt-1 truncate">{coin.name}</p>
            <p className="text-sm font-semibold text-text mt-2">
              {formatPrice(coin.price)}
            </p>
            <Badge
              variant={coin.change24h >= 0 ? "success" : "danger"}
              className="mt-2"
            >
              {formatPercent(coin.change24h)}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}