# Deployment Guide

## 1. Deployment model

The application is a Next.js App Router deployment backed by Supabase Auth and
Supabase PostgreSQL. Deploy the Next.js application to a Node-compatible host
that supports the required App Router runtime and environment configuration.
The database and application are separate operational components.

This guide is host-neutral. Add provider-specific build, domain, cache, and
secret-store steps in the deployment platform configuration rather than
hard-coding one host into application docs.

## 2. Required configuration

Configure the variables in the host's encrypted environment/secret store:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`
- Optional `COINGECKO_BASE_URL`
- Optional `COINGECKO_DEMO_API_KEY`

`DATABASE_URL` and `COINGECKO_DEMO_API_KEY` are server-only. Do not expose them
in build-time browser variables. Keep production and preview/staging values
separate. Never use a production database URL for a preview deployment unless
that is an explicitly reviewed operational decision.

## 3. Recommended release sequence

1. Review the release diff, tests, migration SQL, and dependency changes.
2. Ensure a recoverable database backup exists.
3. Apply pending Drizzle migrations to the intended database using the
   migration runner.
4. Verify the expected migration IDs, columns, indexes, constraints, and
   sequence defaults.
5. Build the Next.js application from the same commit.
6. Deploy the application and configure its environment.
7. Run smoke tests for authentication, onboarding, portfolio read, market API,
   and one non-destructive page flow.
8. Observe application logs, database connectivity, upstream fallback
   frequency, and latency.

For schema changes, ensure the old application version remains compatible with
the expanded schema during any rolling deployment. Use expand/migrate/contract
when a change cannot be safely applied atomically.

## 4. Build and runtime commands

```bash
npm ci
npm run build
npm start
```

The build was validated during the current implementation with Next.js
`16.4.6` and Node `24.22.2`. Verify the installed versions in the lockfile and
runtime before deployment.

## 5. Database release controls

- Generate and commit migrations before deployment.
- Review SQL and snapshots; never rely on an implicit production schema push.
- Apply migrations once through the release process.
- Preserve the migration journal and hashes.
- Verify RLS, constraints, unique indexes, and required sequence defaults after
  migrations that touch ownership or financial data.
- Use a restricted operational process for production database access.

## 6. Cache and routing considerations

The public market endpoints use route and fetch revalidation. Confirm cache
headers and host behaviour after deployment. Do not place user-specific
responses in a public/shared cache. Ensure the current request proxy/matcher
behaves correctly for the deployed base path and domain.

## 7. Deployment acceptance checklist

- [ ] Production secrets configured; no secrets committed or exposed in client bundle.
- [ ] Migration history is current and matches the release.
- [ ] RLS/policies and database constraints are present.
- [ ] Production build succeeds.
- [ ] Login, logout, and protected-route behaviour work.
- [ ] User data remains owner-scoped.
- [ ] Market routes return live/fallback metadata as expected.
- [ ] Portfolio/ledger reads work and no test data remains.
- [ ] Backups and an owner for recovery are identified.
- [ ] Logs/monitoring are available and do not leak secrets.
