// drizzle.config.ts
//
// Drizzle Kit configuration.
//
// `schema` points to the file that exports every table definition. drizzle-kit
// reads it to generate SQL migrations; the app imports the same file at runtime.
//
// `out` is where migration SQL files land. Commit these — they are the
// migration history and the only way to replay schema changes on a fresh DB.
//
// `dialect: "postgresql"` is required for Supabase.

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Be explicit about casing to match Postgres conventions in this project.
  casing: "snake_case",
});