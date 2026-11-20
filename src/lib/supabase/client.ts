
/**
 * src/lib/supabase/client.ts
 *
 * Browser-side Supabase client.
 *
 * Used only inside Client Components. Authentication sessions are managed
 * through cookies by @supabase/ssr.
 */

import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env/public";

/**
 * Creates a Supabase client bound to the browser.
 *
 * createBrowserClient internally handles client reuse. Keeping this factory
 * avoids maintaining a separate application-level singleton.
 */
export function createClient() {
  return createBrowserClient(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey
  );
}
