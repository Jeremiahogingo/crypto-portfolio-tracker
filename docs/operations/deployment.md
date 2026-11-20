
# Deployment Guide

## 1. Deployment model

The application is a Next.js App Router deployment backed by Supabase Auth
and Supabase PostgreSQL.

The Next.js application and database are separate operational components.

This guide is host-neutral. Add provider-specific build, domain, caching,
secret-store and rate-limiting steps in the deployment platform configuration
rather than hard-coding one host into application documentation.

## 2. Required configuration

Configure these variables in the deployment platform's encrypted
environment or secret store.

| Variable | Required | Exposure |
|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Yes | Public |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Yes | Public |
| DATABASE_URL | Yes | Server only |
| COINGECKO_BASE_URL | No | Server only |
| COINGECKO_DEMO_API_KEY | No | Server only |

### Supabase configuration

`NEXT_PUBLIC_SUPABASE_URL` must point to the Supabase project root.

Production deployments must use HTTPS.

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is the public Supabase client key.
It is not a substitute for database authorization or Row Level Security.

### Database configuration

`DATABASE_URL` must use a PostgreSQL connection URL:

- `postgres://`
- `postgresql://`

This variable is server-only.

The Drizzle connection may operate with a PostgreSQL role that bypasses RLS.
Every user-facing database query must therefore enforce ownership explicitly.

Never expose this variable through a `NEXT_PUBLIC_` variable or browser code.

### CoinGecko configuration

`COINGECKO_BASE_URL` is optional and defaults to:

`https://api.coingecko.com/api/v3`

Production custom endpoints must use HTTPS.

`COINGECKO_DEMO_API_KEY` is optional. When configured, it is sent only
from the server-side API client.

### Privileged Supabase access

The application currently does not require `SUPABASE_SERVICE_ROLE_KEY`.

Do not configure or introduce a service-role key unless a reviewed
administrative feature genuinely requires it.

Never expose service-role credentials in browser code.

### Environment files

`.env.example` is the committed configuration template.

`.env.local` and other real environment files must remain ignored by Git.

Never commit passwords, database URLs, API keys or other secret values.

Keep production and preview/staging configuration separate. Never use a
production database URL for a preview deployment unless that is an
explicitly reviewed operational decision.

The application validates required environment values and rejects malformed
or insecure production service URLs.

## 3. Recommended release sequence

1. Review the release diff, tests, migration SQL and dependency changes.
2. Ensure a recoverable database backup exists.
3. Apply pending Drizzle migrations to the intended database.
4. Verify expected migration IDs, columns, indexes, constraints and
   sequence defaults.
5. Build the Next.js application from the same commit.
6. Deploy the application and configure its environment.
7. Run smoke tests for authentication, onboarding, portfolio reads,
   market APIs and non-destructive page flows.
8. Observe application logs, database connectivity, upstream fallback
   frequency and latency.

For schema changes, ensure the previous application version remains
compatible with the expanded schema during rolling deployment.
Use expand/migrate/contract when a change cannot be applied safely in one step.

## 4. Build and runtime commands

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

The build was validated during development with Node `24.22.2`
and Next.js `16.4.6`.

Verify the actual versions installed from the lockfile and deployment
runtime before release.

## 5. Database release controls

- Generate and commit migrations before deployment.
- Review SQL and snapshots; never rely on an implicit production schema push.
- Apply migrations once through the release process.
- Preserve the migration journal and hashes.
- Verify RLS, constraints, unique indexes and required sequence defaults
  after relevant migrations.
- Use a restricted operational process for production database access.
- Maintain recoverable database backups.

## 6. Cache, routing and HTTP security

The market-data API uses route and fetch revalidation.

Confirm cache headers and host behaviour after deployment.
Never place user-specific responses in a public or shared cache.

The application proxy handles session refresh and protected-page redirects.
It is not the authorization boundary; Server Actions, database queries and
Route Handlers must apply their own access controls.

Public market and news API routes intentionally expose public data.
They validate their inputs and must not expose private user information.

HTTP security headers are configured through `next.config.ts`.

Content Security Policy and distributed rate limiting require separate
validation against the application's resource dependencies and deployment
platform.

## 7. Deployment acceptance checklist

- [ ] Production secrets configured in the host's secret store.
- [ ] No secrets committed or exposed in browser bundles.
- [ ] Environment validation succeeds.
- [ ] Migration history is current and matches the release.
- [ ] RLS policies and database constraints are present.
- [ ] Production build succeeds.
- [ ] Login, logout and protected-route behaviour work.
- [ ] User data remains owner-scoped.
- [ ] Market APIs return expected live/fallback metadata.
- [ ] Portfolio and ledger reads work.
- [ ] No test data remains in production.
- [ ] HTTP security headers are present.
- [ ] Rate limiting is enabled at the appropriate application or host layer.
- [ ] Backups and recovery ownership are identified.
- [ ] Logs and monitoring do not leak secrets.
