import Card from "@/components/ui/Card";
import { marketStats } from "@/mock/market";

export default function MarketOverview() {
  const stats = [
    {
      label: "Fear & Greed Index",
      value: marketStats.fearGreedIndex,
      sub: marketStats.fearGreedLabel,
      color: "#F59E0B", // warning
    },
    {
      label: "BTC Dominance",
      value: marketStats.btcDominance + "%",
    },
    {
      label: "Global Market Cap",
      value: `$${marketStats.globalMarketCap}T`,
    },
    {
      label: "24h Volume",
      value: `$${marketStats.volume24h}B`,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} hover>
          <p className="text-sm text-secondary">{stat.label}</p>
          <p className="text-2xl font-bold text-text mt-1">{stat.value}</p>
          {stat.sub && (
            <p className="text-xs text-secondary mt-1">{stat.sub}</p>
          )}
        </Card>
      ))}
    </div>
  );
}