// src/components/cards/CoinCard.tsx
//
// Coin card for the Watchlist grid.
// Missing market values are displayed as unavailable, never as zero.

"use client";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import CoinLogo from "@/components/ui/CoinLogo";
import type { MarketCoin } from "@/types/market";
import {
  formatPrice,
  formatPercent,
  formatCompactCurrency,
} from "@/utils/format";

interface CoinCardProps {
  coin: MarketCoin;
  onRemove: (coinId: string) => void;
}

export default function CoinCard({
  coin,
  onRemove,
}: CoinCardProps) {
  return (
    <Card hover gradientBorder className="flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <CoinLogo src={coin.logoUrl} alt={coin.name} size="lg" />

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text">
              {coin.name}
            </p>
            <p className="text-xs text-secondary">{coin.symbol}</p>
          </div>
        </div>

        <button
          onClick={() => onRemove(coin.id)}
          className="flex-shrink-0 text-lg text-yellow-400 transition-colors hover:text-secondary"
          aria-label={`Remove ${coin.name} from watchlist`}
          title="Remove from watchlist"
        >
          ★
        </button>
      </div>

      <div className="mt-4">
        <p className="text-2xl font-bold text-text">
          {coin.price === null ? "—" : formatPrice(coin.price)}
        </p>

        <div className="mt-2 flex items-center gap-2">
          {coin.change24h === null ? (
            <span className="text-xs text-secondary">
              24h change unavailable
            </span>
          ) : (
            <Badge
              variant={coin.change24h >= 0 ? "success" : "danger"}
              size="sm"
            >
              {formatPercent(coin.change24h)}
            </Badge>
          )}

          <span className="text-xs text-secondary">
            MCap {formatCompactCurrency(coin.marketCap)}
          </span>
        </div>
      </div>
    </Card>
  );
}