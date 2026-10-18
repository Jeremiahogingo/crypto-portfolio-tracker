// src/app/(dashboard)/watchlist/page.tsx
//
// Watchlist — live coin data for a fixed id set.
//
// ─── Data flow ──────────────────────────────────────────────────────────
// WATCHLIST_IDS is hardcoded for now. Phase 2 will replace it with the
// current user's stored watchlist, fetched from the database. The rest of
// this file — useMarkets call, ordering, skeleton, empty state — stays
// exactly as-is when that change lands. Only the source of the array moves.
//
// ─── Ordering ───────────────────────────────────────────────────────────
// CoinGecko returns /coins/markets results in market-cap-descending order,
// regardless of the `ids` array order. We re-sort to match WATCHLIST_IDS so
// the display stays predictable across refreshes.
//
// ─── Favorite toggle ────────────────────────────────────────────────────
// The star toggles local visual state only (dimmed card). This is
// deliberate: without persistence, a "removed" coin would simply reappear
// on reload, which is worse UX than being honest that persistence is
// coming. Phase 2 replaces `removed` state with a real mutation.
//
// ─── Alert button ───────────────────────────────────────────────────────
// Placeholder for Phase 2. Wired as a callback prop so the eventual modal
// can be plugged in without touching CoinCard.

"use client";

import { useMemo, useState } from "react";
import CoinCard from "@/components/cards/CoinCard";
import DataSourceBadge from "@/components/ui/DataSourceBadge";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import Card from "@/components/ui/Card";
import { useMarkets } from "@/hooks/useMarkets";

// CoinGecko ids. Order here defines display order.
const WATCHLIST_IDS = [
  "bitcoin",
  "ethereum",
  "solana",
  "cardano",
  "dogecoin",
  "chainlink",
  "avalanche",
  "ripple",
];

export default function WatchlistPage() {
  // Tracks which coins have been "removed" this session. Purely client-side
  // and reset on refresh — see the header comment for the rationale.
  const [removed, setRemoved] = useState<string[]>([]);

  const { coins, meta, isLoading } = useMarkets({
    ids: WATCHLIST_IDS,
    per_page: WATCHLIST_IDS.length,
  });

  // CoinGecko orders by market cap, not by our `ids` order. Restore
  // the intended display order here.
  const ordered = useMemo(() => {
    const byId = new Map(coins.map((c) => [c.id, c]));
    return WATCHLIST_IDS.map((id) => byId.get(id)).filter(
      (c): c is NonNullable<typeof c> => Boolean(c)
    );
  }, [coins]);

  const toggleFavorite = (id: string) => {
    setRemoved((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSetAlert = (id: string) => {
    // Phase 2 will open CreateAlertModal with the coin pre-selected.
    console.info(`[watchlist] Set Alert requested for ${id} — Phase 2`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">Watchlist</h1>
        <DataSourceBadge source={meta?.source} fetchedAt={meta?.fetchedAt} />
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {WATCHLIST_IDS.map((id) => (
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
      )}

      {!isLoading && ordered.length === 0 && (
        <EmptyState
          icon="⭐"
          title="No watchlist coins available"
          description="We couldn't load data for your watchlist. Try refreshing the page."
        />
      )}

      {!isLoading && ordered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {ordered.map((coin) => (
            <CoinCard
              key={coin.id}
              coin={coin}
              isFavorite={!removed.includes(coin.id)}
              onToggleFavorite={toggleFavorite}
              onSetAlert={handleSetAlert}
            />
          ))}
        </div>
      )}
    </div>
  );
}