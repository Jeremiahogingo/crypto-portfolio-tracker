// src/app/api/crypto/global/route.ts
//
// GET /api/crypto/global
//
// Aggregate market stats. Cache is longer (120s) because market-cap totals
// and dominance percentages change slowly relative to spot prices.

import { NextResponse } from "next/server";
import { CoinGeckoError, getGlobal } from "@/lib/api/coingecko";
import { normalizeGlobal } from "@/lib/api/normalize";
import { fallbackGlobal } from "@/mock/api/fallback";
import type { ApiResponse, GlobalMarketStats } from "@/types/market";

export const revalidate = 120;

export async function GET(): Promise<NextResponse<ApiResponse<GlobalMarketStats>>> {
  try {
    const raw = await getGlobal();
    const data = normalizeGlobal(raw);

    return NextResponse.json({
      data,
      meta: { source: "live", fetchedAt: new Date().toISOString(), count: 1 },
    });
  } catch (err) {
    const e = err as CoinGeckoError;
    console.warn(`[api/crypto/global] falling back to mock data: ${e.message}`);

    return NextResponse.json({
      data: fallbackGlobal,
      meta: { source: "fallback", fetchedAt: new Date().toISOString(), count: 1 },
    });
  }
}