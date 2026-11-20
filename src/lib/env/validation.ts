
/**
 * src/lib/env/validation.ts
 *
 * Pure environment validation functions.
 *
 * This module deliberately does not read process.env. Keeping the parsing
 * logic independent makes it straightforward to test without exposing
 * secrets or requiring a configured deployment environment.
 */

export interface PublicEnvironmentInput {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  nodeEnv?: string;
}

export interface PublicEnvironment {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export interface ServerEnvironmentInput {
  databaseUrl?: string;
  coinGeckoBaseUrl?: string;
  coinGeckoDemoApiKey?: string;
  nodeEnv?: string;
}

export interface ServerEnvironment {
  databaseUrl: string;
  coinGeckoBaseUrl: string;
  coinGeckoDemoApiKey?: string;
}

const DEFAULT_COINGECKO_BASE_URL =
  "https://api.coingecko.com/api/v3";

function requiredValue(
  value: string | undefined,
  variableName: string
): string {
  const normalized = value?.trim();

  if (!normalized) {
    throw new Error(
      `Environment configuration error: ${variableName} is required.`
    );
  }

  return normalized;
}

function isLoopbackHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]"
  );
}

/**
 * Validates an HTTP(S) service URL.
 *
 * Plain HTTP is permitted only for local development services. Production
 * configuration must use HTTPS.
 */
function parseServiceUrl(
  value: string,
  variableName: string,
  nodeEnv: string | undefined,
  options: {
    rootOnly?: boolean;
    allowQuery?: boolean;
  } = {}
): URL {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(
      `Environment configuration error: ${variableName} must be a valid URL.`
    );
  }

  const isSecure = url.protocol === "https:";
  const isLocalDevelopmentUrl =
    url.protocol === "http:" &&
    nodeEnv !== "production" &&
    isLoopbackHostname(url.hostname);

  if (!isSecure && !isLocalDevelopmentUrl) {
    throw new Error(
      `Environment configuration error: ${variableName} must use HTTPS. ` +
        "HTTP is permitted only for local development services."
    );
  }

  if (url.username || url.password) {
    throw new Error(
      `Environment configuration error: ${variableName} must not contain URL credentials.`
    );
  }

  if (!options.allowQuery && url.search) {
    throw new Error(
      `Environment configuration error: ${variableName} must not contain query parameters.`
    );
  }

  if (url.hash) {
    throw new Error(
      `Environment configuration error: ${variableName} must not contain a URL fragment.`
    );
  }

  if (options.rootOnly && url.pathname !== "/") {
    throw new Error(
      `Environment configuration error: ${variableName} must point to the service root.`
    );
  }

  return url;
}

function normalizeServiceUrl(url: URL): string {
  return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
}

/**
 * Validates the public Supabase configuration.
 *
 * This parser can be imported by browser code. It must never receive
 * database credentials or privileged service-role keys.
 */
export function parsePublicEnvironment(
  input: PublicEnvironmentInput
): PublicEnvironment {
  const supabaseUrlValue = requiredValue(
    input.supabaseUrl,
    "NEXT_PUBLIC_SUPABASE_URL"
  );

  const supabaseAnonKey = requiredValue(
    input.supabaseAnonKey,
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );

  const supabaseUrl = parseServiceUrl(
    supabaseUrlValue,
    "NEXT_PUBLIC_SUPABASE_URL",
    input.nodeEnv,
    { rootOnly: true }
  );

  return {
    supabaseUrl: normalizeServiceUrl(supabaseUrl),
    supabaseAnonKey,
  };
}

/**
 * Validates the PostgreSQL connection URL.
 *
 * PostgreSQL URLs are not HTTP URLs, so they are validated separately.
 */
export function parseDatabaseUrl(value?: string): string {
  const databaseUrl = requiredValue(value, "DATABASE_URL");

  let url: URL;

  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error(
      "Environment configuration error: DATABASE_URL must be a valid PostgreSQL connection URL."
    );
  }

  if (
    url.protocol !== "postgres:" &&
    url.protocol !== "postgresql:"
  ) {
    throw new Error(
      "Environment configuration error: DATABASE_URL must use postgres:// or postgresql://."
    );
  }

  if (!url.hostname) {
    throw new Error(
      "Environment configuration error: DATABASE_URL must include a database host."
    );
  }

  return databaseUrl;
}

/**
 * Validates server-only configuration.
 *
 * CoinGecko's base URL defaults to its official API endpoint. An API key
 * remains optional because the public API can be used without one.
 */
export function parseServerEnvironment(
  input: ServerEnvironmentInput
): ServerEnvironment {
  const databaseUrl = parseDatabaseUrl(input.databaseUrl);

  const configuredBaseUrl = input.coinGeckoBaseUrl?.trim();

  const coinGeckoBaseUrl = configuredBaseUrl
    ? normalizeServiceUrl(
        parseServiceUrl(
          configuredBaseUrl,
          "COINGECKO_BASE_URL",
          input.nodeEnv
        )
      )
    : DEFAULT_COINGECKO_BASE_URL;

  const normalizedApiKey = input.coinGeckoDemoApiKey?.trim();

  if (normalizedApiKey && normalizedApiKey.length > 512) {
    throw new Error(
      "Environment configuration error: COINGECKO_DEMO_API_KEY exceeds the supported length."
    );
  }

  return {
    databaseUrl,
    coinGeckoBaseUrl,
    coinGeckoDemoApiKey: normalizedApiKey || undefined,
  };
}
