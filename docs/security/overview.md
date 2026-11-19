# Security Overview

## 1. Security objectives

The security model protects:

- User identity and session integrity.
- Private portfolio, holding, transaction, watchlist, alert, and profile data.
- The privileged database connection and provider credentials.
- Integrity of transaction history and derived holding projections.
- Availability and correctness when external market providers fail.

The application is non-custodial. It tracks user-entered portfolio information
and public market data; it does not require wallet seed phrases/private keys or
execute exchange trades as part of the core ledger workflow.

## 2. Authentication

Supabase Auth is the identity provider. Server-side code creates a request-
scoped Supabase client using the request cookie context. The application calls
`auth.getUser()` to verify the current identity before server-side access to
user-owned resources. Do not authorize based only on client state or a decoded
JWT that has not been verified for the request.

The current-user helper is request-cached to avoid duplicate identity/profile
lookups during one request. Do not cache user identity globally across requests.

## 3. Authorization

The verified Supabase user ID is the source for all owner IDs. Client-supplied
`userId`, `portfolioId`, `holdingId`, or `transactionId` values are untrusted
selectors; ownership must be established in the server query.

Because the direct Drizzle connection uses a privileged PostgreSQL role that
can bypass RLS, the application must explicitly filter every user-owned read
and mutation by authenticated ownership. See:

- [RLS and privileges](../database/rls-and-privileges.md)
- [Access-control matrix](access-control-matrix.md)

## 4. Database controls

- RLS is enabled on the six application-owned public tables.
- Policies target authenticated users and scope records by `auth.uid()`.
- Foreign keys preserve user/portfolio relationships.
- Unique constraints protect one holding per portfolio/coin and one watchlist
  entry per user/coin.
- Transaction CHECK constraints restrict event types and prevent invalid
  quantities/negative monetary values.
- Portfolio row locks serialize ledger mutations.
- Mutations and holding recomputation run in one database transaction.

RLS does not protect privileged Drizzle queries by itself. Explicit owner
predicates are mandatory at that boundary.

## 5. Input and financial validation

- Use Zod at Server Action boundaries.
- Validate UUIDs, string lengths, timestamps, and enum-like values.
- Parse financial fields from strings with `decimal.js`.
- Reject values outside database range/scale before writes.
- Use parameterized Drizzle query builders; never concatenate untrusted values
  into SQL text.
- Enforce invariants again in PostgreSQL CHECK/FK/UNIQUE constraints where
  appropriate.

## 6. Secrets and external providers

- `DATABASE_URL` is server-only and highly privileged.
- Supabase public URL/anon key may be exposed according to Supabase's public
  client model; authorization must be enforced by verified sessions and RLS.
- `COINGECKO_DEMO_API_KEY` is optional and must remain server-side.
- Never add private secrets under `NEXT_PUBLIC_*`.
- Do not log cookies, access/refresh tokens, passwords, full connection strings,
  or API keys.
- Use read-only permissions for any future exchange connection. Trading and
  withdrawals should remain disabled unless a separately reviewed product and
  security decision changes the scope.

## 7. Secure development and operations

Required checks before merge/deploy:

```bash
npm test
npm run test:db
npx tsc --noEmit
npx eslint src tests
npm run build
npm audit --omit=dev
```

The database integration suite requires a real database and an existing
portfolio. Run it against a staging/test database, not a busy production
instance, because it obtains portfolio locks and advances a PostgreSQL sequence
even though data rows are rolled back.

Apply database changes only through reviewed migrations. Restrict production
secret access, use HTTPS, maintain recoverable backups, and rehearse restore
procedures. Review all new privileged DB queries for owner scoping.

## 8. Known security boundaries and follow-up

The project should continue to review rate limiting, abuse controls, audit
logging, CSP/security headers, dependency advisories, session invalidation, and
operational alerting as deployment requirements evolve. This document does not
claim an unconfigured control is active; verify actual hosting/platform
configuration before treating a checklist item as deployed.
