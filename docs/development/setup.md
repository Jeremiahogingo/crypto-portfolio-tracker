# Development Setup

## 1. Prerequisites

- Git.
- Node.js version compatible with the installed Next.js release. The current
  project was validated during this work on Node `v24.22.2`; confirm the
  repository's `package.json` engines before changing runtime versions.
- npm.
- Access to a Supabase project with PostgreSQL enabled.
- VS Code or another TypeScript-capable editor.

## 2. Clone and install

```powershell
 git clone https://github.com/Jeremiahogingo/crypto-portfolio-tracker.git
 cd crypto-portfolio-tracker
 npm ci
```

Use `npm ci` for reproducible installs from the committed lockfile. Use
`npm install` when intentionally changing dependencies and commit the updated
lockfile with the manifest.

## 3. Configure environment

Copy the example and fill in values from the appropriate Supabase/CoinGecko
projects:

```powershell
Copy-Item .env.example .env.local
```

Variables currently used by the application/configuration:

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL used by SSR/browser clients |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase public anon/publishable key used by client helpers |
| `DATABASE_URL` | Yes for DB access/migrations | Server-side PostgreSQL connection used by Drizzle |
| `COINGECKO_BASE_URL` | Optional | CoinGecko API base URL; defaults to the v3 API |
| `COINGECKO_DEMO_API_KEY` | Optional | Server-side CoinGecko Demo key |

The RSS news aggregator uses configured feed URLs in code and does not require a
separate news API key in the documented current implementation.

**Never** commit `.env.local`. Never expose `DATABASE_URL` or a provider key
through a `NEXT_PUBLIC_` variable. Do not place a Supabase service-role key in
the browser.

## 4. Run database migrations

Point `DATABASE_URL` at the intended development database, then apply the
committed migration history:

```powershell
npx drizzle-kit migrate
```

For a fresh disposable database, verify the full migration sequence and
profile trigger behaviour before running the application. Do not use a
production connection for ad hoc development.

## 5. Run the application

```powershell
npm run dev
```

Open `http://localhost:3000`.

## 6. Useful commands

```powershell
npm test
npm run test:db
npx tsc --noEmit
npx eslint src tests
npm run build
npm audit --omit=dev
```

`npm run test:db` connects to a real database and requires an existing
portfolio. Use a staging/test database. See [Testing](testing.md).

## 7. Troubleshooting

### Supabase session is missing

Check the project URL/key, cookie domain, local URL, and the request proxy/session
refresh implementation. Verify the server helper creates a request-scoped
client and that `auth.getUser()` returns the expected user.

### Database connection fails

Check `DATABASE_URL`, TLS/connection details, network access, and pooler vs
direct connection settings. Never paste the full connection string into an
issue or terminal transcript.

### Market endpoints return fallback data

Inspect `meta.source`, server logs, CoinGecko configuration/quota, and the RSS
feed availability. Fallback means the UI can render; it does not mean upstream
freshness is guaranteed.
