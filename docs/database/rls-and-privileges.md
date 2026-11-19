# Row-Level Security and Database Privileges

## 1. Security model

The application has two related but distinct controls:

1. Supabase Auth identifies the user making the request.
2. Database policy and application query predicates determine which rows that
   user may access.

RLS is enabled on the six application-owned public tables: `profiles`,
`portfolios`, `holdings`, `transactions`, `watchlist_items`, and `alerts`.
Policies are scoped to the `authenticated` database role. Profile policies use
`auth.uid() = id`; the other user-owned tables use `auth.uid() = user_id`.
Update policies require both a valid existing row (`USING`) and a valid
resulting row (`WITH CHECK`).

## 2. The privileged Drizzle connection

`src/lib/db/` creates a direct PostgreSQL connection from `DATABASE_URL`. In
the current deployment this is a privileged role that bypasses RLS. This
connection is used by server-side application operations and by Drizzle Kit.

**RLS does not automatically protect a query executed through this connection.**
The security boundary for such a query is the verified request identity plus
explicit query predicates.

Every user-facing Drizzle operation must:

- Call the current-user verification path before reading or mutating private
  records.
- Obtain `userId` from the verified Supabase user, never from submitted data.
- Filter reads by owner and relevant parent/child identifiers.
- Repeat ownership predicates in `UPDATE` and `DELETE` statements.
- Check `RETURNING` results where a missing row indicates an ownership or
  concurrency failure.
- Keep related writes inside one transaction.

## 3. Ownership predicates

Typical patterns:

```ts
where(and(
  eq(holdings.id, holdingId),
  eq(holdings.userId, authenticatedUserId),
  eq(holdings.portfolioId, portfolioId)
))
```

For transactions, include transaction ID, user ID, and portfolio ID. For a
portfolio lookup, include both portfolio ID and user ID. A UUID is an
identifier, not an authorization credential.

## 4. Portfolio lock

Ledger writes acquire the portfolio row lock using both the portfolio ID and
authenticated user ID. The same lock serializes other mutations for that
portfolio until commit or rollback. This protects the projection from two
concurrent requests replaying/writing the same portfolio out of order.

## 5. Role and credential separation

- Browser/server Supabase Auth clients use the public project URL and anon key
  (RLS is expected to protect authenticated table access).
- `DATABASE_URL` is server-only and must never use a `NEXT_PUBLIC_` prefix.
- Do not put a Supabase service-role key in browser code.
- Do not log connection strings, access tokens, or passwords.
- Restrict access to production secrets and rotate them after suspected exposure.

## 6. Adding a table

When adding a user-owned table:

1. Include a stable owner reference to `auth.users` where appropriate.
2. Enable RLS in the same migration.
3. Add least-privilege `authenticated` policies for the required operations.
4. Add indexes for owner predicates and common joins.
5. If rows belong to a parent resource, enforce parent/owner consistency with
   an appropriate composite foreign key or equivalent invariant.
6. Update the access-control matrix and schema docs.
7. Add cross-user integration tests for SELECT/INSERT/UPDATE/DELETE.
8. Audit all privileged Drizzle call sites for explicit owner predicates.

## 7. Verification queries

Useful read-only inspection queries:

```sql
-- Verify RLS is enabled on application tables.
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Inspect table policies.
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Inspect table constraints.
SELECT conrelid::regclass AS table_name,
       conname,
       pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text, conname;
```

Run privilege/role checks using an authorized administrative session. Never
publish role secrets or query output containing credentials.
