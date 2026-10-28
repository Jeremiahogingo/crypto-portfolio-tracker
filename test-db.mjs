// test-db.mjs — delete after testing
import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

// Print (redacted) so we can see what's actually being used
const redacted = url.replace(/:([^:@]+)@/, ":***@");
console.log("Connecting to:", redacted);

const sql = postgres(url, { max: 1 });
try {
  const result = await sql`select current_user, current_database()`;
  console.log("✓ Connected:", result[0]);
} catch (err) {
  console.error("✗ Failed:", err.message);
  console.error("  Code:", err.code);
} finally {
  await sql.end();
}