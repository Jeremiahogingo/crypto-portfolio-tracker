// src/components/markets/GainersLosers.tsx
//
// Derives top gainers and losers from a supplied market coin list.
// Missing 24-hour percentage changes are excluded from rankings.

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import CoinLogo from "@/components/ui/CoinLogo";
import type { MarketCoin } from "@/types/market";
import { formatPrice, formatPercent } from "@/utils/format";

interface GainersLosersProps {
  coins: MarketCoin[];
  isLoading: boolean;
}

const MAX_RANK = 100;
const MIN_MARKET_CAP = 10_000_000;
const TOP_N = 4;

type CoinWithChange = MarketCoin & {
  change24h: number;
};

function CoinRow({
  coin,
  direction,
}: {
  coin: CoinWithChange;
  direction: "gainer" | "loser";
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-3 last:border-0">
      <div className="flex min-w-0 items-center gap-2">
        <CoinLogo src={coin.logoUrl} alt={coin.name} size="sm" />

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text">
            {coin.symbol}
          </p>
          <p className="truncate text-xs text-secondary">
            {coin.name}
          </p>
        </div>
      </div>

      <div className="ml-2 flex-shrink-0 text-right">
        <p className="text-sm font-medium text-text">
          {coin.price === null ? "—" : formatPrice(coin.price)}
        </p>

        <Badge variant={direction === "gainer" ? "success" : "danger"}>
          {formatPercent(coin.change24h)}
        </Badge>
      </div>
    </div>
  );
}

export default function GainersLosers({
  coins,
  isLoading,
}: GainersLosersProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {[0, 1].map((index) => (
          <Card key={index}>
            <Skeleton className="mb-4 h-4 w-32" />
            {[0, 1, 2, 3].map((row) => (
              <Skeleton key={row} className="mb-2 h-12 w-full" />
            ))}
          </Card>
        ))}
      </div>
    );
  }

  const eligible = coins.filter(
    (coin): coin is CoinWithChange =>
      coin.change24h !== null &&
      coin.rank > 0 &&
      coin.rank <= MAX_RANK &&
      coin.marketCap > MIN_MARKET_CAP
  );

  const gainers = [...eligible]
    .sort((a, b) => b.change24h - a.change24h)
    .slice(0, TOP_N);

  const losers = [...eligible]
    .sort((a, b) => a.change24h - b.change24h)
    .slice(0, TOP_N);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Card>
        <h3 className="mb-2 text-sm font-semibold text-text">
          🚀 Top Gainers
        </h3>

        {gainers.length === 0 ? (
          <p className="py-4 text-sm text-secondary">
            No valid 24-hour change data available.
          </p>
        ) : (
          gainers.map((coin) => (
            <CoinRow
              key={coin.id}
              coin={coin}
              direction="gainer"
            />
          ))
        )}
      </Card>

      <Card>
        <h3 className="mb-2 text-sm font-semibold text-text">
          📉 Top Losers
        </h3>

        {losers.length === 0 ? (
          <p className="py-4 text-sm text-secondary">
            No valid 24-hour change data available.
          </p>
        ) : (
          losers.map((coin) => (
            <CoinRow
              key={coin.id}
              coin={coin}
              direction="loser"
            />
          ))
        )}
      </Card>
    </div>
  );
}