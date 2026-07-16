import Card from "@/components/ui/Card";
import { marketNews } from "@/mock/dashboard";

export default function MarketNews() {
  return (
    <Card className="h-full">
      <h3 className="text-sm font-semibold text-text mb-4">Market News</h3>
      <div className="space-y-4">
        {marketNews.map((item) => (
          <div
            key={item.id}
            className="group cursor-pointer border-b border-white/5 pb-4 last:border-0 last:pb-0"
          >
            <h4 className="text-sm font-medium text-text group-hover:text-primary transition-colors">
              {item.title}
            </h4>
            <p className="text-xs text-secondary mt-1 line-clamp-2">
              {item.description}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-secondary">{item.source}</span>
              <span className="w-1 h-1 rounded-full bg-secondary"></span>
              <span className="text-xs text-secondary">{item.time}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}