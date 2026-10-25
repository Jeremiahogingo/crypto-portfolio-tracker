// src/app/api/crypto/news/route.ts
//
// GET /api/crypto/news?limit=30
//
// Aggregates news from all RSS sources via getNews(), wraps it in the
// standard ApiResponse envelope, and falls back to local mock articles if
// every upstream source is unreachable.
//
// The fallback keeps the dashboard "Market News" widget and the News page
// functional during development offline or during an upstream outage.
// Because the response shape is identical, the UI needs no error branch.

import { NextRequest, NextResponse } from "next/server";
import { getNews } from "@/lib/api/news";
import { fallbackNews } from "@/mock/api/newsFallback";
import type { ApiResponse } from "@/types/market";
import type { NewsArticle } from "@/types/news";

// Route-level cache: at most one aggregation per 5 minutes per server
// instance, regardless of user count. Matches the fetch-level revalidate
// inside getNews() — both layers are needed (see Step 3.3 design notes).
export const revalidate = 300;

export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse<NewsArticle[]>>> {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 30), 1), 50);

  try {
    const articles = await getNews({ limit });

    return NextResponse.json({
      data: articles,
      meta: {
        source: "live",
        fetchedAt: new Date().toISOString(),
        count: articles.length,
      },
    });
  } catch (err) {
    console.warn(
      `[api/crypto/news] all sources failed, serving fallback: ${
        (err as Error).message
      }`
    );

    return NextResponse.json({
      data: fallbackNews.slice(0, limit),
      meta: {
        source: "fallback",
        fetchedAt: new Date().toISOString(),
        count: Math.min(limit, fallbackNews.length),
      },
    });
  }
}