# Access-Control Matrix

## 1. Identity rule

All rows are accessed in the context of a verified Supabase user. The server
must derive the owner ID from the current session. IDs supplied by the browser
select a resource but do not prove permission to access it.

## 2. Resource matrix

| Resource | Owner key | Required query scope | Database relationship |
|---|---|---|---|
| Profile | `profiles.id` | `id = authenticatedUserId` | `id` references `auth.users.id` |
| Portfolio | `portfolios.user_id` | `id = requestedPortfolioId AND user_id = authenticatedUserId` | `user_id` references `auth.users.id` |
| Holding | `holdings.user_id` | `id/portfolio_id/coin_id` as relevant AND `user_id = authenticatedUserId` | Portfolio/user consistency FK |
| Transaction | `transactions.user_id` | `id/portfolio_id/coin_id` as relevant AND `user_id = authenticatedUserId` | Portfolio/user consistency FK |
| Watchlist item | `watchlist_items.user_id` | `coin_id` or row ID AND `user_id = authenticatedUserId` | `user_id` references auth user |
| Alert | `alerts.user_id` | alert ID AND `user_id = authenticatedUserId` | `user_id` references auth user |

## 3. Operation requirements

| Operation | Required checks |
|---|---|
| Read profile | Verified session; profile ID equals session user ID |
| Read portfolio | Portfolio ID and owner ID in the same predicate |
| Read holdings | Owner ID plus portfolio ID (and coin/holding ID when relevant) |
| Create holding/transaction | Owner ID comes from session; portfolio ownership is checked server-side |
| Update/delete holding | Initial ownership-scoped lookup; portfolio lock; re-read; owner-scoped mutation |
| Delete transaction | Initial event lookup; portfolio lock; re-read; owner-scoped delete; replay |
| Add/remove watchlist item | Owner ID from session; unique `(user_id, coin_id)` constraint handles duplicates |
| Create/update/delete alert | Owner ID from session in all read/mutation predicates |

## 4. Privileged Drizzle requirements

The application's direct PostgreSQL role can bypass RLS. For this connection,
RLS must not be treated as the authorization check. Each query must have
explicit owner predicates and mutations must check returned rows where a
missing row is meaningful.

Bad pattern:

```ts
// Not authorization: a UUID from the browser is not proof of ownership.
await db.select().from(holdings).where(eq(holdings.id, holdingId));
```

Good pattern:

```ts
await db.select().from(holdings).where(and(
  eq(holdings.id, holdingId),
  eq(holdings.userId, authenticatedUserId)
));
```

For child rows, include the owning portfolio ID when it is part of the domain
relationship. Repeat the same predicates in the actual UPDATE or DELETE.

## 5. Review checklist for a new feature

- Does the code authenticate before accessing private data?
- Is the owner ID derived from the verified user?
- Are both reads and writes scoped?
- Can an IDOR be triggered by substituting another user's UUID?
- Does the database FK ensure parent/owner consistency?
- Is RLS enabled and targeted to the correct role?
- Does the privileged DB path still enforce explicit predicates?
- Are cross-user tests included?
