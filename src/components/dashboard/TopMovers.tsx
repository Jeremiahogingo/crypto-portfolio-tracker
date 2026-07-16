import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { topMovers } from "@/mock/dashboard";

export default function TopMovers() {
  return (
    <Card className="h-full">
      <h3 className="text-sm font-semibold text-text mb-4">Top Movers</h3>
      <div className="space-y-3">
        {topMovers.map((mover) => (
          <div
            key={mover.symbol}
            className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
          >
            <span className="text-sm font-medium text-text">{mover.symbol}</span>
            <span className="text-xs text-secondary">${mover.price}</span>
            <Badge variant={mover.change > 0 ? "success" : "danger"}>
              {mover.change > 0 ? "+" : ""}
              {mover.change}%
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}