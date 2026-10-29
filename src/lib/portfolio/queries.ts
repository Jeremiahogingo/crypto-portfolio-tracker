// src/lib/portfolio/queries.ts
//
// Server-side portfolio queries.
//
// ─── Trust model ─────────────────────────────────────────────────────────
// These run through the Drizzle client, which bypasses RLS (see the warning
// in src/lib/db/index.ts). Every query MUST scope by userId explicitly.
// That's why getDefaultPortfolio() reads the session and filters by
// session.auth.id — the safety comes from the filter, not from RLS.
//
// ─── Why cache() ─────────────────────────────────────────────────────────
// The dashboard and portfolio pages both call getDefaultPortfolio and
// getHoldings. Wrapping in React's cache() means one DB round-trip per
// request regardless of how many components ask.
//
// Note: this is only safe because the cache is per-request (React's cache
// resets between requests). Module-level memoization would be a data leak.

import { cache } from "react";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { portfolios, holdings, type Portfolio, type Holding } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

/**
 * The user's default (first-created) portfolio.
 *
 * Onboarding creates one named "Main". If a user has multiple portfolios
 * (future feature), this returns the oldest, which is a stable default —
 * newer portfolios appear later in the list and won't silently become the
 * default on a fresh page load.
 *
 * Returns null when unauthenticated or when the portfolio was never
 * provisioned (trigger failure, manual user creation via Supabase dashboard).
 */
export const getDefaultPortfolio = cache(
  async (): Promise<Portfolio | null> => {
    const session = await getCurrentUser();
    if (!session) return null;

    const [portfolio] = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.userId, session.auth.id))
      .orderBy(portfolios.createdAt)
      .limit(1);

    return portfolio ?? null;
  }
);

/**
 * All holdings in a portfolio.
 *
 * Takes portfolioId rather than looking it up internally so callers that
 * already have the portfolio (almost all do — they render its name) don't
 * force a second lookup. Order by createdAt so the table order is stable
 * across reloads; sorting by value is done at render time.
 */
export const getHoldings = cache(
  async (portfolioId: string): Promise<Holding[]> => {
    const session = await getCurrentUser();
    if (!session) return [];

    // Double-scope by userId AND portfolioId. If portfolioId ever leaked
    // from another user (via a bug), the userId clause blocks access.
    return db
      .select()
      .from(holdings)
      .where(
        and(
          eq(holdings.portfolioId, portfolioId),
          eq(holdings.userId, session.auth.id)
        )
      )
      .orderBy(holdings.createdAt);
  }
);