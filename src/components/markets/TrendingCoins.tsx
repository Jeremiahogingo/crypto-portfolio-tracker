import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { trendingCoins } from "@/mock/market";

export default function TrendingCoins() {
  return (
    <Card>
      <h3 className="text-sm font-semibold text-text mb-4">🔥 Trending</h3>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {trendingCoins.map((coin) => (
          <div
            key={coin.symbol}
            className="flex-shrink-0 w-40 bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:bg-white/[0.05] transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{coin.logo}</span>
              <span className="text-sm font-medium text-text">{coin.symbol}</span>
            </div>
            <p className="text-xs text-secondary mt-1">{coin.name}</p>
            <p className="text-sm font-semibold text-text mt-2">
              ${coin.price < 0.01 ? coin.price.toFixed(6) : coin.price.toLocaleString()}
            </p>
            <Badge variant="success" className="mt-2">
              +{coin.change24h}%
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}