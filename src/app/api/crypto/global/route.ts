/**
 * src/app/api/crypto/global/route.ts
 *
 * GET /api/crypto/global
 *
 * Aggregate market statistics.
 *
 * The coordinator applies a 120-second freshness window and can serve
 * a previous successful CoinGecko response during provider failures.
 */

import { NextResponse } from "next/server";

import { getGlobal } from "@/lib/api/coingecko";
import { normalizeGlobal } from "@/lib/api/normalize";
import { fallbackGlobal } from "@/mock/api/fallback";

import type {
  ApiResponse,
  GlobalMarketStats,
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
  NextResponse<ApiResponse<GlobalMarketStats>>
> {
  try {
    const upstream = await getGlobal();
    const data = normalizeGlobal(upstream.data);

    const response: ApiResponse<GlobalMarketStats> = {
      data,

      meta: {
        source: upstream.source,
        fetchedAt: upstream.fetchedAt,
        count: 1,
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
      "[api/crypto/global] falling back to sample data",
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
        data: fallbackGlobal,

        meta: {
          source: "fallback",
          fetchedAt: new Date().toISOString(),
          count: 1,
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