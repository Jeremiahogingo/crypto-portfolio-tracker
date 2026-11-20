
import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";
import { parseDatabaseUrl } from "./src/lib/env/validation";

// Load Next.js environment files, including .env.local.
loadEnvConfig(process.cwd());

const databaseUrl = parseDatabaseUrl(process.env.DATABASE_URL);

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
  casing: "snake_case",
});
