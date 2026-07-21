import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { topGainers, topLosers } from "@/mock/market";

function CoinRow({ coin, type }: { coin: any; type: "gainer" | "loser" }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-lg">{coin.logo}</span>
        <div>
          <p className="text-sm font-medium text-text">{coin.symbol}</p>
          <p className="text-xs text-secondary">{coin.name}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-text">${coin.price.toLocaleString()}</p>
        <Badge variant={type === "gainer" ? "success" : "danger"}>
          {type === "gainer" ? "+" : ""}{coin.change24h}%
        </Badge>
      </div>
    </div>
  );
}

export default function GainersLosers() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <h3 className="text-sm font-semibold text-text mb-4">🚀 Top Gainers</h3>
        {topGainers.map((coin) => (
          <CoinRow key={coin.symbol} coin={coin} type="gainer" />
        ))}
      </Card>
      <Card>
        <h3 className="text-sm font-semibold text-text mb-4">📉 Top Losers</h3>
        {topLosers.map((coin) => (
          <CoinRow key={coin.symbol} coin={coin} type="loser" />
        ))}
      </Card>
    </div>
  );
}