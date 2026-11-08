// src/lib/db/index.ts
//
// Server-only Drizzle client.
//
// IMPORTANT:
// This connection uses DATABASE_URL and may operate with a PostgreSQL
// role that bypasses Row Level Security.
//
// Every user-facing query must therefore enforce authenticated ownership
// explicitly. Do not assume that database RLS protects this connection.

import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

// Cache the connection during development hot reloads to avoid exhausting
// the PostgreSQL connection pool with duplicate connections.
const globalForDb = globalThis as unknown as {
  pgClient: ReturnType<typeof postgres> | undefined;
};

const client =
  globalForDb.pgClient ??
  postgres(process.env.DATABASE_URL!, {
    max: 3,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgClient = client;
}

export const db = drizzle(client, { schema });