
import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// Load Next.js environment files, including .env.local.
loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is missing. Check that it is configured in .env.local."
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
  casing: "snake_case",
});
