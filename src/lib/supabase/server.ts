
/**
 * src/lib/supabase/server.ts
 *
 * Request-scoped Supabase client for Server Components, Route Handlers
 * and Server Actions.
 */

import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "@/lib/env/public";

/**
 * Creates a Supabase client bound to the current Next.js request.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
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
            // The proxy persists refreshed cookies in the response.
          }
        },
      },
    }
  );
}
