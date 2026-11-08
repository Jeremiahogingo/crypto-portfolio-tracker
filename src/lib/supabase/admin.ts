// src/lib/supabase/admin.ts
//
// Privileged Supabase client.
//
// SECURITY:
// The service-role key bypasses Row Level Security.
//
// This client must only be used in trusted server-side operations such as
// controlled administrative tasks and background jobs.
//
// Never expose the service-role key to a browser or Client Component.
// Normal user-scoped operations should use the regular server Supabase
// client instead.

import "server-only";

import { createClient } from "@supabase/supabase-js";

export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}