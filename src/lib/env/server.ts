
/**
 * src/lib/env/server.ts
 *
 * Server-only application configuration.
 *
 * Never import this module from Client Components.
 */

import "server-only";

import { parseServerEnvironment } from "./validation";

export const serverEnv = Object.freeze(
  parseServerEnvironment({
    databaseUrl: process.env.DATABASE_URL,
    coinGeckoBaseUrl: process.env.COINGECKO_BASE_URL,
    coinGeckoDemoApiKey: process.env.COINGECKO_DEMO_API_KEY,
    nodeEnv: process.env.NODE_ENV,
  })
);
