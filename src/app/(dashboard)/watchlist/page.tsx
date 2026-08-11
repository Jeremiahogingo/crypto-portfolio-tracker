"use client";

import { useState } from "react";
import CoinCard from "@/components/cards/CoinCard";
import { watchlistCoins } from "@/mock/watchlist";

export default function WatchlistPage() {
  const [favorites, setFavorites] = useState<string[]>(
    // All initially marked as favorites (since they are in the watchlist)
    watchlistCoins.map((coin) => coin.id)
  );

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id]
    );
  };

  const handleSetAlert = (id: string) => {
    // Placeholder: later we'll open a modal or show a toast
    alert(`Alert feature coming soon for coin ID: ${id}`);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Watchlist</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {watchlistCoins.map((coin) => (
          <CoinCard
            key={coin.id}
            coin={coin}
            isFavorite={favorites.includes(coin.id)}
            onToggleFavorite={toggleFavorite}
            onSetAlert={handleSetAlert}
          />
        ))}
      </div>
    </div>
  );
}