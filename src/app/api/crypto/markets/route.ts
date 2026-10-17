// src/app/api/crypto/markets/route.ts
//
// GET /api/crypto/markets?vs_currency=usd&per_page=100&page=1&ids=bitcoin,ethereum&sparkline=true
//
// Fronts CoinGecko's /coins/markets endpoint. Returns normalized MarketCoin
// data with a meta envelope indicating whether live or fallback data was
// served. Never throws — on any CoinGecko failure we return fallback data
// so the UI stays functional.

import { NextRequest, NextResponse } from "next/server";
import { CoinGeckoError, getMarkets } from "@/lib/api/coingecko";
import { normalizeCoin } from "@/lib/api/normalize";
import { fallbackMarkets } from "@/mock/api/fallback";
import type { ApiResponse, MarketCoin } from "@/types/market";

// Cache the route output for 60s. Combined with the fetch-level revalidate
// inside the client, this keeps origin calls well under CoinGecko's limits
// even under moderate traffic.
export const revalidate = 60;

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<MarketCoin[]>>> {
  const { searchParams } = new URL(req.url);

  // Bound `per_page` to CoinGecko's documented maximum to prevent abuse.
  const perPage = Math.min(Math.max(Number(searchParams.get("per_page") ?? 100), 1), 250);
  const page = Math.max(Number(searchParams.get("page") ?? 1), 1);
  const vsCurrency = searchParams.get("vs_currency") ?? "usd";
  const ids = searchParams.get("ids")?.split(",").filter(Boolean);
  const sparkline = searchParams.get("sparkline") === "true";

  try {
    const raw = await getMarkets({
      vs_currency: vsCurrency,
      per_page: perPage,
      page,
      ids,
      sparkline,
    });
    const data = raw.map(normalizeCoin);

    return NextResponse.json({
      data,
      meta: {
        source: "live",
        fetchedAt: new Date().toISOString(),
        count: data.length,
      },
    });
  } catch (err) {
    const e = err as CoinGeckoError;
    console.warn(
      `[api/crypto/markets] falling back to mock data: ${e.message}`,
      e.status ? `(status ${e.status})` : ""
    );

    return NextResponse.json({
      data: fallbackMarkets,
      meta: {
        source: "fallback",
        fetchedAt: new Date().toISOString(),
        count: fallbackMarkets.length,
      },
    });
  }
}