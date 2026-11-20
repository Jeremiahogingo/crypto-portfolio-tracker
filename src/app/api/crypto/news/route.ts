
/**
 * src/app/api/crypto/news/route.ts
 *
 * GET /api/crypto/news?limit=30
 *
 * Public aggregated RSS/Atom news endpoint.
 */

import { NextRequest, NextResponse } from "next/server";

import { getNews } from "@/lib/api/news";

import {
  parseNewsQuery,
  sanitizeHttpsUrl,
} from "@/lib/api/route-validation";

import { fallbackNews } from "@/mock/api/newsFallback";

import type { ApiResponse } from "@/types/market";
import type { NewsArticle } from "@/types/news";

// Revalidate news every five minutes.
export const revalidate = 300;

/**
 * Fallback articles are local data, but their URLs still pass through
 * the same HTTPS validation used for external RSS content.
 */
const safeFallbackNews: NewsArticle[] = fallbackNews
  .map((article) => ({
    ...article,
    url: sanitizeHttpsUrl(article.url) ?? "",
    imageUrl: sanitizeHttpsUrl(article.imageUrl),
  }))
  .filter((article) => article.url.length > 0);

export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  const parsed = parseNewsQuery(
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

  const { limit } = parsed.data;

  try {
    const articles = await getNews({ limit });

    const response: ApiResponse<NewsArticle[]> = {
      data: articles,
      meta: {
        source: "live",
        fetchedAt: new Date().toISOString(),
        count: articles.length,
      },
    };

    return NextResponse.json(response);
  } catch {
    console.warn(
      "[api/crypto/news] all RSS sources failed; serving fallback"
    );

    const data = safeFallbackNews.slice(0, limit);

    const response: ApiResponse<NewsArticle[]> = {
      data,
      meta: {
        source: "fallback",
        fetchedAt: new Date().toISOString(),
        count: data.length,
      },
    };

    return NextResponse.json(response);
  }
}
