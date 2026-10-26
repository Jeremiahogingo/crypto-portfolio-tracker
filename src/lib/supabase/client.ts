// src/lib/supabase/client.ts
//
// Browser-side Supabase client.
//
// Used only inside Client Components ("use client"). Sessions are stored in
// cookies managed by @supabase/ssr, which keeps them readable from Server
// Components and Middleware for auth checks.
//
// Do NOT import this into Server Components or Route Handlers — use the
// server client at @/lib/supabase/server instead, which reads cookies via
// Next.js's per-request context. Mixing them causes subtle auth bugs where
// the server sees no user because it can't read browser-managed state.

import { createBrowserClient } from "@supabase/ssr";

/**
 * Create a Supabase client bound to the browser environment.
 *
 * Called fresh per-render (not a module singleton) because createBrowserClient
 * is itself memoized internally — creating it twice is cheap and safe. Not
 * memoizing at module level avoids stale cookies after sign-out.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}