// src/components/layout/Providers.tsx

"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/context/ThemeContext";

/**
 * QueryClient configuration.
 *
 * staleTime: how long data is considered fresh before a background refetch
 *   is triggered. 60s is a good default for crypto prices — frequent enough
 *   to feel live, infrequent enough to stay within rate limits.
 *
 * gcTime: how long inactive cache entries are kept in memory. 5 minutes
 *   is the library default; we keep it explicit for clarity.
 *
 * retry: we retry once on failure with exponential backoff, which handles
 *   transient CoinGecko 429s without hammering the API.
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        refetchOnWindowFocus: false, // avoid refetch storms when switching tabs
      },
    },
  });
}

export default function Providers({ children }: { children: React.ReactNode }) {
  // useState ensures one QueryClient per browser session, not per render.
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>{children}</ThemeProvider>
    </QueryClientProvider>
  );
}