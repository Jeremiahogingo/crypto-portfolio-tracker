// src/lib/supabase/server.ts
//
// Request-scoped Supabase client for Server Components, Route Handlers
// and Server Actions.
//
// The client reads authentication cookies from the current Next.js request.
// It must be created per request rather than shared as a module singleton.
//
// Server Components cannot write cookies during rendering. Proxy handles
// session refresh for matched requests; this adapter also supports cookie
// updates in contexts where Next.js permits them.

import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Create a Supabase client bound to the current request.
 *
 * cookies() is asynchronous in modern Next.js versions and must be awaited.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Component rendering does not permit cookie writes.
            // The session-refreshing Proxy is responsible for persisting
            // refreshed authentication cookies in the response.
          }
        },
      },
    }
  );
}