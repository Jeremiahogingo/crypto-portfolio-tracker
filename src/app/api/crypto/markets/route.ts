
/**
 * src/app/api/crypto/markets/route.ts
 *
 * GET /api/crypto/markets
 *
 * Public market-data endpoint.
 *
 * Validates all user-controlled query parameters before calling CoinGecko.
 */

import { NextRequest, NextResponse } from "next/server";

import {
  CoinGeckoError,
  getMarkets,
} from "@/lib/api/coingecko";

import { normalizeCoin } from "@/lib/api/normalize";
import { parseMarketsQuery } from "@/lib/api/route-validation";

import { fallbackMarkets } from "@/mock/api/fallback";

import type {
  ApiResponse,
  MarketCoin,
} from "@/types/market";

// Revalidate market responses every 60 seconds.
export const revalidate = 60;

export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  const parsed = parseMarketsQuery(
    request.nextUrl.searchParams
  );

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error,
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  try {
    const raw = await getMarkets(parsed.data);
    const data = raw.map(normalizeCoin);

    const response: ApiResponse<MarketCoin[]> = {
      data,
      meta: {
        source: "live",
        fetchedAt: new Date().toISOString(),
        count: data.length,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    const status =
      error instanceof CoinGeckoError
        ? error.status
        : undefined;

    console.warn(
      "[api/crypto/markets] upstream failure; serving fallback",
      { status }
    );

    const response: ApiResponse<MarketCoin[]> = {
      data: fallbackMarkets,
      meta: {
        source: "fallback",
        fetchedAt: new Date().toISOString(),
        count: fallbackMarkets.length,
      },
    };

    return NextResponse.json(response);
  }
}
