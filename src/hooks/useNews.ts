// src/hooks/useNews.ts
//
// Client hook for the aggregated news feed.
//
// `limit` is part of the query key, so the dashboard (limit=4) and the News
// page (limit=30) maintain separate cache entries without re-fetching the
// same source data twice unnecessarily. React Query dedupes within the same
// key; different limits intentionally diverge.
//
// Staleness is 5 minutes — news doesn't need second-level freshness, and a
// longer window cuts load on the RSS upstreams.

import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/api/client";
import type { ApiResponse } from "@/types/market";
import type { NewsArticle } from "@/types/news";

interface UseNewsOptions {
  limit?: number;
}

export function useNews(options: UseNewsOptions = {}) {
  const limit = options.limit ?? 30;

  const query = useQuery<ApiResponse<NewsArticle[]>>({
    queryKey: ["news", { limit }],
    queryFn: ({ signal }) =>
      getJson<NewsArticle[]>(`/api/crypto/news?limit=${limit}`, signal),
    staleTime: 5 * 60 * 1000,
  });

  return {
    articles: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
    error: query.error,
  };
}