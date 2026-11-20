
/**
 * src/lib/env/public.ts
 *
 * Browser-safe application configuration.
 *
 * Only NEXT_PUBLIC_* variables belong in this module.
 * Next.js statically replaces these direct process.env references
 * when building the browser bundle.
 */

import { parsePublicEnvironment } from "./validation";

export const publicEnv = Object.freeze(
  parsePublicEnvironment({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    nodeEnv: process.env.NODE_ENV,
  })
);
