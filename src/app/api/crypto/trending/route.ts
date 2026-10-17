// src/app/api/crypto/trending/route.ts
//
// GET /api/crypto/trending
//
// Top 7 most-searched coins over the last 24h. Longer cache (300s) is
// appropriate because search-rankings move on a multi-hour timescale.

import { NextResponse } from "next/server";
import { CoinGeckoError, getTrending } from "@/lib/api/coingecko";
import { normalizeTrending } from "@/lib/api/normalize";
import { fallbackTrending } from "@/mock/api/fallback";
import type { ApiResponse, TrendingCoin } from "@/types/market";

export const revalidate = 300;

export async function GET(): Promise<NextResponse<ApiResponse<TrendingCoin[]>>> {
  try {
    const raw = await getTrending();
    const data = normalizeTrending(raw);

    return NextResponse.json({
      data,
      meta: { source: "live", fetchedAt: new Date().toISOString(), count: data.length },
    });
  } catch (err) {
    const e = err as CoinGeckoError;
    console.warn(`[api/crypto/trending] falling back to mock data: ${e.message}`);

    return NextResponse.json({
      data: fallbackTrending,
      meta: {
        source: "fallback",
        fetchedAt: new Date().toISOString(),
        count: fallbackTrending.length,
      },
    });
  }
}