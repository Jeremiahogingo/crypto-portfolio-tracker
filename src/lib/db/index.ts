// src/lib/db/index.ts
//
// Drizzle client — direct Postgres connection for server-side operations.
//
// CRITICAL: This client connects as the `postgres` role, which bypasses
// Row Level Security. That means:
//
//   • Queries through this client are NOT protected by the RLS policies in
//     schema.ts. You must authorize in application code.
//   • This client is safe for migrations, background jobs, and admin actions.
//   • For user-facing reads and writes, use the Supabase client instead:
//       - Browser: @/lib/supabase/client
//       - Server:  @/lib/supabase/server
//
// The split is intentional. Drizzle owns the schema; Supabase owns user-scoped
// queries where RLS matters. Mixing them freely is how teams accidentally
// expose one user's data to another.

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

// In development, hot-reload creates a new module instance on every change.
// Caching the connection on globalThis prevents exhausting Postgres's
// connection limit with orphaned pools.
const globalForDb = globalThis as unknown as {
  pgClient: ReturnType<typeof postgres> | undefined;
};

const client =
  globalForDb.pgClient ??
  postgres(process.env.DATABASE_URL!, {
    // Supabase's pooler handles connection multiplexing; keep client-side
    // pooling modest to avoid hitting the pooler's own limit.
    max: 3,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgClient = client;
}

export const db = drizzle(client, { schema });