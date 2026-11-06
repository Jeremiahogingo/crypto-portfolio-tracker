// src/components/watchlist/WatchlistView.tsx
//
// Client orchestrator for the Watchlist page.
//
// ─── Data flow ───────────────────────────────────────────────────────────
// Server passes the list of watchlisted coin IDs (from DB). This view calls
// useMarkets({ ids }) to fetch live data for exactly those coins. Rendering
// waits on CoinGecko only for the coins the user cares about — not for the
// top 100.
//
// ─── Remove flow ─────────────────────────────────────────────────────────
// Star click → form submit → removeFromWatchlist action → revalidatePath →
// server re-renders page → view receives shorter coinIds → coin disappears.
//
// No optimistic update: the action is fast (~10ms DB round-trip) and a
// visible flicker on failure would be worse than a brief delay. If we later
// see perceived latency, optimistic removal via useOptimistic is a small
// patch.
//
// ─── Empty state ─────────────────────────────────────────────────────────
// A new user sees an empty state with a clear "Add coin" CTA. Not dimmed
// mock data, not a broken-looking blank grid.

"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import DataSourceBadge from "@/components/ui/DataSourceBadge";
import CoinCard from "@/components/cards/CoinCard";
import AddWatchlistCoinModal from "./AddWatchlistCoinModal";
import { useMarkets } from "@/hooks/useMarkets";
import { removeFromWatchlist } from "@/lib/actions/watchlist";

interface WatchlistViewProps {
  initialCoinIds: string[];
}

export default function WatchlistView({
  initialCoinIds,
}: WatchlistViewProps) {
  const [addOpen, setAddOpen] = useState(false);

  const { coins, meta, isLoading } = useMarkets(
    {
      ids: initialCoinIds,
      per_page: Math.max(initialCoinIds.length, 1),
    },
    { enabled: initialCoinIds.length > 0 }
  );

  // Preserve insertion order from the DB. CoinGecko sorts by market cap
  // regardless of ids order; users expect their own add order.
  const orderedCoins = initialCoinIds
    .map((id) => coins.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const handleRemove = (coinId: string) => {
    const formData = new FormData();
    formData.set("coinId", coinId);
    // Fire and forget — the action revalidates, which re-renders this view
    // with an updated initialCoinIds. Errors surface in the dev console;
    // from the user's perspective a failed remove leaves the card in place
    // (which is the correct fallback state).
    void removeFromWatchlist(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-text">Watchlist</h1>
          <DataSourceBadge
            source={meta?.source}
            fetchedAt={meta?.fetchedAt}
          />
        </div>
        <Button variant="primary" onClick={() => setAddOpen(true)}>
          + Add coin
        </Button>
      </div>

      {initialCoinIds.length === 0 ? (
        <EmptyState
          icon="⭐"
          title="Your watchlist is empty"
          description="Add coins you want to keep an eye on. Prices update live."
          actionLabel="Add your first coin"
          onAction={() => setAddOpen(true)}
        />
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {initialCoinIds.map((id) => (
            <Card key={id}>
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
              <Skeleton className="h-7 w-28 mb-2" />
              <Skeleton className="h-4 w-16" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {orderedCoins.map((coin) => (
            <CoinCard
              key={coin.id}
              coin={coin}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      <AddWatchlistCoinModal
        isOpen={addOpen}
        existingCoinIds={initialCoinIds}
        onClose={() => setAddOpen(false)}
      />
    </div>
  );
}