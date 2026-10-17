// src/lib/api/client.ts
//
// Browser-side HTTP client for our own /api/crypto/* routes.
//
// Thin on purpose: the Route Handlers already do the normalization,
// fallback, and envelope-building. This layer's only jobs are:
//   1. Type the response as `ApiResponse<T>` so hooks get compile-time safety.
//   2. Throw a typed error on network or non-2xx failure so React Query can
//      route it into `query.error`.
//
// Note: the routes we call never return 5xx by design (they fall back to
// mock data internally). But the fetch itself can still fail — offline,
// DNS, server not running. Those cases land here and bubble into React
// Query's error state, where the UI can decide to render an error card.

import type { ApiResponse } from "@/types/market";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

/**
 * GET a JSON endpoint that returns an `ApiResponse<T>` envelope.
 *
 * Automatically adds the `signal` from React Query so that in-flight
 * requests are cancelled when a query is unmounted or superseded.
 */
export async function getJson<T>(
  path: string,
  signal?: AbortSignal
): Promise<ApiResponse<T>> {
  let res: Response;
  try {
    res = await fetch(path, {
      signal,
      // Caching is handled by React Query's staleTime on the client and by
      // `revalidate` on the server. Telling fetch to skip HTTP cache here
      // avoids double-caching and keeps freshness semantics in one place.
      cache: "no-store",
    });
  } catch (cause) {
    // fetch only throws on network-level failure or abort. Abort is normal
    // — React Query fires it on unmount — so we distinguish for clean logs.
    if ((cause as Error).name === "AbortError") {
      throw cause;
    }
    throw new ApiClientError(
      `Network error calling ${path}: ${(cause as Error).message}`
    );
  }

  if (!res.ok) {
    throw new ApiClientError(
      `${res.status} ${res.statusText} from ${path}`,
      res.status
    );
  }

  return (await res.json()) as ApiResponse<T>;
}