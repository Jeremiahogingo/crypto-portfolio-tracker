"use client";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface CoinCardProps {
  coin: {
    id: string;
    name: string;
    symbol: string;
    logo: string;
    price: number;
    change24h: number;
  };
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
    <Card hover gradientBorder className="flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xl">
            {coin.logo}
          </span>
          <div>
            <p className="text-sm font-medium text-text">{coin.name}</p>
            <p className="text-xs text-secondary">{coin.symbol}</p>
          </div>
        </div>
        <button
          onClick={() => onToggleFavorite(coin.id)}
          className={`text-lg transition-colors ${
            isFavorite ? "text-yellow-400" : "text-secondary hover:text-yellow-400"
          }`}
        >
          {isFavorite ? "★" : "☆"}
        </button>
      </div>

      <div className="mt-4">
        <p className="text-2xl font-bold text-text">
          ${coin.price < 0.01 ? coin.price.toFixed(6) : coin.price.toLocaleString()}
        </p>
        <Badge
          variant={coin.change24h > 0 ? "success" : "danger"}
          size="sm"
          className="mt-2"
        >
          {coin.change24h > 0 ? "+" : ""}
          {coin.change24h}%
        </Badge>
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