// src/lib/supabase/server.ts
//
// Server-side Supabase client.
//
// Must be used in Server Components, Route Handlers, and Server Actions.
// Sessions are read from request cookies via Next's cookies() API, which
// means:
//   • The client must be created per-request (never a module singleton).
//   • The `setAll` handler will be a no-op in Server Components — Next.js
//     prohibits writing cookies during render. Middleware handles refresh.
//
// Pattern adopted from the official @supabase/ssr docs for App Router.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Create a Supabase client for the current request.
 *
 * `cookies()` is async in Next.js 15+; awaiting it is mandatory, otherwise
 * you'll get a broken cookie store and no session.
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
            // Called from a Server Component render — Next.js disallows
            // writing cookies here. Safe to swallow: middleware will have
            // already refreshed the session on the same request.
          }
        },
      },
    }
  );
}