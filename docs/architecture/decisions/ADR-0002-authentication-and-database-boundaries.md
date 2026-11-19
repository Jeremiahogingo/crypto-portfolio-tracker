# ADR-0002: Supabase Authentication and Privileged Drizzle Boundary

- **Status:** Accepted
- **Decision area:** Identity, authorization, persistence

## Context

The application needs request-aware authentication and typed SQL access. The
Supabase session identifies the user. The server-side Drizzle connection is
configured with a privileged PostgreSQL role to execute application queries
and migrations; that role can bypass RLS.

## Decision

- Use Supabase Auth through request-scoped SSR helpers to verify the current
  user.
- Derive user identity from the verified Supabase result.
- Use Drizzle for typed server-side database operations.
- Treat every query issued through the privileged Drizzle connection as an
  authorization-sensitive operation and include explicit `userId`/ownership
  predicates.
- Keep RLS policies enabled for Supabase-authenticated access and as a second
  security layer, but never assume they protect a query made by the privileged
  role.

## Consequences

- Server Actions must authenticate before accessing user-owned data.
- A submitted user ID is never trusted as authority.
- A query review must check its owner filters, including reads and deletes.
- `DATABASE_URL` is a high-impact secret and must remain server-only.
- Tests should include cross-user access attempts and inspect generated SQL or
  query predicates for every new resource path.
