// src/components/markets/GainersLosers.tsx
//
// Derives top gainers and losers from a passed-in coin list.
//
// Filtering rules:
//   • rank 1–100 only        — excludes microcap scams and brand-new listings
//     that routinely pump 500%+ in a day.
//   • marketCap > $10M       — second safeguard against illiquid anomalies.
//
// The "top 4" cap matches the layout. Increase it if the design changes —
// no other code depends on the number.
//
// Presentational: receives coins + isLoading from the parent. No fetch.

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

function CoinRow({
  coin,
  direction,
}: {
  coin: MarketCoin;
  direction: "gainer" | "loser";
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2 min-w-0">
        <CoinLogo src={coin.logoUrl} alt={coin.name} size="sm" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-text truncate">{coin.symbol}</p>
          <p className="text-xs text-secondary truncate">{coin.name}</p>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-2">
        <p className="text-sm font-medium text-text">{formatPrice(coin.price)}</p>
        <Badge variant={direction === "gainer" ? "success" : "danger"}>
          {formatPercent(coin.change24h)}
        </Badge>
      </div>
    </div>
  );
}

export default function GainersLosers({ coins, isLoading }: GainersLosersProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[0, 1].map((i) => (
          <Card key={i}>
            <Skeleton className="h-4 w-32 mb-4" />
            {[0, 1, 2, 3].map((j) => (
              <Skeleton key={j} className="h-12 w-full mb-2" />
            ))}
          </Card>
        ))}
      </div>
    );
  }

  const eligible = coins.filter(
    (c) => c.rank > 0 && c.rank <= MAX_RANK && c.marketCap > MIN_MARKET_CAP
  );

  const gainers = [...eligible]
    .sort((a, b) => b.change24h - a.change24h)
    .slice(0, TOP_N);

  const losers = [...eligible]
    .sort((a, b) => a.change24h - b.change24h)
    .slice(0, TOP_N);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <h3 className="text-sm font-semibold text-text mb-2">🚀 Top Gainers</h3>
        {gainers.length === 0 ? (
          <p className="text-sm text-secondary py-4">No data available.</p>
        ) : (
          gainers.map((c) => (
            <CoinRow key={c.id} coin={c} direction="gainer" />
          ))
        )}
      </Card>
      <Card>
        <h3 className="text-sm font-semibold text-text mb-2">📉 Top Losers</h3>
        {losers.length === 0 ? (
          <p className="text-sm text-secondary py-4">No data available.</p>
        ) : (
          losers.map((c) => (
            <CoinRow key={c.id} coin={c} direction="loser" />
          ))
        )}
      </Card>
    </div>
  );
}