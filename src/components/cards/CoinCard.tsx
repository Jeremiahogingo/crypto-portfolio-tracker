// src/components/cards/CoinCard.tsx
//
// Coin card used by the Watchlist page.
//
// Accepts a MarketCoin (see @/types/market) so it works identically for
// live data and the fallback set — no shape-switching logic needed at the
// call site. Rendering is separated from data-fetching: this component
// never calls a hook. All state (favorite, alert callback) is passed in.
//
// The favorite star represents "in watchlist" in this step. Toggling off
// dims the card but does not remove it — persistence lands in Phase 2,
// and pretending otherwise would create false expectations. See
// src/app/(dashboard)/watchlist/page.tsx for the fuller note.

"use client";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import CoinLogo from "@/components/ui/CoinLogo";
import type { MarketCoin } from "@/types/market";
import { formatPrice, formatPercent, formatCompactCurrency } from "@/utils/format";

interface CoinCardProps {
  coin: MarketCoin;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onSetAlert: (id: string) => void;
}

export default function CoinCard({
  coin,
  isFavorite,
  onToggleFavorite,
  onSetAlert,
}: CoinCardProps) {
  return (
    <Card
      hover
      gradientBorder
      className={`flex flex-col transition-opacity ${
        isFavorite ? "" : "opacity-50"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <CoinLogo src={coin.logoUrl} alt={coin.name} size="lg" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-text truncate">{coin.name}</p>
            <p className="text-xs text-secondary">{coin.symbol}</p>
          </div>
        </div>
        <button
          onClick={() => onToggleFavorite(coin.id)}
          className={`text-lg transition-colors flex-shrink-0 ${
            isFavorite ? "text-yellow-400" : "text-secondary hover:text-yellow-400"
          }`}
          aria-label={isFavorite ? "Remove from watchlist" : "Add back to watchlist"}
        >
          {isFavorite ? "★" : "☆"}
        </button>
      </div>

      <div className="mt-4">
        <p className="text-2xl font-bold text-text">{formatPrice(coin.price)}</p>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant={coin.change24h >= 0 ? "success" : "danger"} size="sm">
            {formatPercent(coin.change24h)}
          </Badge>
          <span className="text-xs text-secondary">
            MCap {formatCompactCurrency(coin.marketCap)}
          </span>
        </div>
      </div>

      <div className="mt-auto pt-4">
        <button
          onClick={() => onSetAlert(coin.id)}
          className="w-full text-xs font-medium text-primary hover:text-blue-400 transition-colors"
        >
          + Set Alert
        </button>
      </div>
    </Card>
  );
}