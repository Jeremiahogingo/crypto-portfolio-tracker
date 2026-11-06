// src/lib/watchlist/queries.ts
//
// Server-side watchlist queries.
//
// Returns coin IDs only. The client renders these by calling useMarkets with
// the id list — so a watchlist of 20 coins costs one CoinGecko request for
// 20 coins, not a full top-100 pull. Fetching the names/logos server-side
// would require also fetching prices server-side, which we deliberately
// avoid (blocks page render on CoinGecko latency).

import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { watchlistItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

/**
 * Coin IDs in the current user's watchlist, ordered by insertion time
 * (oldest first — matches the visual order users expect after adding
 * coins one at a time).
 *
 * Returns [] when unauthenticated — never throws. The page decides
 * whether an empty list should show an empty state or redirect.
 */
export const getWatchlistCoinIds = cache(async (): Promise<string[]> => {
  const session = await getCurrentUser();
  if (!session) return [];

  const rows = await db
    .select({ coinId: watchlistItems.coinId })
    .from(watchlistItems)
    .where(eq(watchlistItems.userId, session.auth.id))
    .orderBy(watchlistItems.addedAt);

  return rows.map((r) => r.coinId);
});