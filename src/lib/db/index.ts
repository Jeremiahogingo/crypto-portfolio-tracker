
/**
 * src/lib/db/index.ts
 *
 * Server-only Drizzle client.
 *
 * IMPORTANT:
 * DATABASE_URL may use a PostgreSQL role that bypasses RLS.
 * Every user-facing database query must explicitly enforce ownership.
 */

import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";
import { serverEnv } from "@/lib/env/server";

// Cache the connection during development hot reloads to avoid creating
// duplicate PostgreSQL pools.
const globalForDb = globalThis as unknown as {
  pgClient: ReturnType<typeof postgres> | undefined;
};

const client =
  globalForDb.pgClient ??
  postgres(serverEnv.databaseUrl, {
    max: 3,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgClient = client;
}

export const db = drizzle(client, { schema });
