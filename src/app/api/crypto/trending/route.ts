/**
 * src/app/api/crypto/trending/route.ts
 *
 * GET /api/crypto/trending
 *
 * Top most-searched coins over the last 24 hours.
 *
 * The coordinator applies a 300-second freshness window and can serve
 * a previous successful CoinGecko response during provider failures.
 */

import { NextResponse } from "next/server";

import { getTrending } from "@/lib/api/coingecko";
import { normalizeTrending } from "@/lib/api/normalize";
import { fallbackTrending } from "@/mock/api/fallback";

import type {
  ApiResponse,
  TrendingCoin,
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

export async function GET(): Promise<
  NextResponse<ApiResponse<TrendingCoin[]>>
> {
  try {
    const upstream = await getTrending();
    const data = normalizeTrending(upstream.data);

    const response: ApiResponse<TrendingCoin[]> = {
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
      "[api/crypto/trending] falling back to sample data",
      {
        status,
        retryAt,
        message:
          error instanceof Error
            ? error.message
            : "Unknown upstream error",
      }
    );

    return NextResponse.json(
      {
        data: fallbackTrending,

        meta: {
          source: "fallback",
          fetchedAt: new Date().toISOString(),
          count: fallbackTrending.length,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }
}
