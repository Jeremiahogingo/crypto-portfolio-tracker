// src/lib/supabase/admin.ts
//
// Service-role Supabase client — bypasses Row Level Security.
//
// Used ONLY for trusted server-side operations that need to act on behalf of
// any user: cron jobs that scan alerts, admin actions, or backfilling data.
// NEVER import into a Client Component, and NEVER call on a route reachable
// without authorization — the service role key can read/write every row.
//
// For normal user-scoped queries (99% of cases), use:
//   • @/lib/supabase/client  → Client Components
//   • @/lib/supabase/server  → Server Components / Actions / Route Handlers
//
// This file is not currently used but is created now so the pattern is
// explicit — when Step 2.5 adds alert-scanning, we'll reach for this.

import { createClient } from "@supabase/supabase-js";

export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        // Service role bypasses user auth entirely — no need to persist a
        // session, and persisting one would leak across requests.
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}