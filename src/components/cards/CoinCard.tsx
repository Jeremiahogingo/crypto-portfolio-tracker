// src/components/cards/CoinCard.tsx
//
// Coin card for the Watchlist grid.
//
// Accepts a MarketCoin (the same shape used everywhere prices are shown)
// so it works identically for live and fallback data — no shape-switching
// logic at the call site.
//
// ─── Remove semantics ────────────────────────────────────────────────────
// The star is a "currently in watchlist" indicator, not a toggle. Clicking
// it removes the coin from the watchlist; the card disappears because the
// parent's coin list shrinks. There is no in-between "not in watchlist but
// still visible" state — that would be confusing (the visual dimming that
// existed before DB persistence was a placeholder).
//
// No confirmation dialog: removing a watchlist entry is trivially
// recoverable (re-add from the Add modal) and shouldn't require ceremony.

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

export default function CoinCard({ coin, onRemove }: CoinCardProps) {
  return (
    <Card hover gradientBorder className="flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <CoinLogo src={coin.logoUrl} alt={coin.name} size="lg" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-text truncate">
              {coin.name}
            </p>
            <p className="text-xs text-secondary">{coin.symbol}</p>
          </div>
        </div>
        <button
          onClick={() => onRemove(coin.id)}
          className="text-lg text-yellow-400 hover:text-secondary transition-colors flex-shrink-0"
          aria-label={`Remove ${coin.name} from watchlist`}
          title="Remove from watchlist"
        >
          ★
        </button>
      </div>

      <div className="mt-4">
        <p className="text-2xl font-bold text-text">
          {formatPrice(coin.price)}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Badge
            variant={coin.change24h >= 0 ? "success" : "danger"}
            size="sm"
          >
            {formatPercent(coin.change24h)}
          </Badge>
          <span className="text-xs text-secondary">
            MCap {formatCompactCurrency(coin.marketCap)}
          </span>
        </div>
      </div>
    </Card>
  );
}