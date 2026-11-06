// src/app/(dashboard)/watchlist/page.tsx
//
// Watchlist page — server wrapper.
//
// Fetches the user's watched coin IDs from the DB and hands them to the
// client view. The view fetches market data for just those coins, so the
// page render is instant (no blocking on CoinGecko).
//
// No redirect logic beyond the layout gate: an empty watchlist is a valid
// state (new user, or user removed everything) — the view handles it with
// an empty state and CTA.

import { getWatchlistCoinIds } from "@/lib/watchlist/queries";
import WatchlistView from "@/components/watchlist/WatchlistView";

export const dynamic = "force-dynamic";

export default async function WatchlistPage() {
  const coinIds = await getWatchlistCoinIds();
  return <WatchlistView initialCoinIds={coinIds} />;
}