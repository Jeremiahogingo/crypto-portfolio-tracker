/**
 * src/app/api/crypto/markets/route.ts
 *
 * GET /api/crypto/markets
 *
 * Public market-data endpoint.
 *
 * Validates all user-controlled query parameters before calling CoinGecko.
 *
 * Supports:
 * - Currency selection.
 * - Server-side market ordering.
 * - Pagination.
 * - Explicit coin ID filtering.
 * - Optional seven-day sparklines.
 *
 * When CoinGecko is unavailable, a recent successful upstream response
 * is served by the coordinator. Static fallback results are used only
 * when no usable successful response is available.
 */

import { NextRequest, NextResponse } from "next/server";

import { getMarkets } from "@/lib/api/coingecko";

import { normalizeCoin } from "@/lib/api/normalize";
import { parseMarketsQuery } from "@/lib/api/route-validation";
import { selectFallbackMarkets } from "@/lib/api/fallback-markets";

import type {
  ApiResponse,
  MarketCoin,
} from "@/types/market";

// Do not statically generate or cache this route response.
export const dynamic = "force-dynamic";

function getErrorStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  if (
    "status" in error &&
    typeof error.status === "number"
  ) {
    return error.status;
  }

  return undefined;
}

function getErrorRetryAt(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  if (
    "retryAt" in error &&
    typeof error.retryAt === "number"
  ) {
    return error.retryAt;
  }

  return undefined;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  const parsed = parseMarketsQuery(
    request.nextUrl.searchParams
  );

  // Never forward invalid user-controlled parameters upstream.
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
    const upstream = await getMarkets(parsed.data);

    const data = upstream.data.map(normalizeCoin);

    const response: ApiResponse<MarketCoin[]> = {
      data,

      meta: {
        source: upstream.source,
        fetchedAt: upstream.fetchedAt,
        count: data.length,
      },
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    const status = getErrorStatus(error);
    const retryAt = getErrorRetryAt(error);

    console.warn(
      "[api/crypto/markets] upstream failure; serving fallback",
      {
        status,
        retryAt,
        message:
          error instanceof Error
            ? error.message
            : "Unknown upstream error",
      }
    );

    // Preserve the same requested selection and pagination contract.
    const data = selectFallbackMarkets(parsed.data);

    const response: ApiResponse<MarketCoin[]> = {
      data,

      meta: {
        source: "fallback",
        fetchedAt: new Date().toISOString(),
        count: data.length,
      },
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }
}