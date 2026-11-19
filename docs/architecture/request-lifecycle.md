# Request and Data Flows

## 1. Authenticated page request

1. The browser requests a Next.js route.
2. The request proxy/interception layer runs according to `src/proxy.ts`.
3. A Server Component or server-side query requests the current user through
   `getCurrentUser()`.
4. The request-scoped Supabase server client reads the session from cookies and
   calls `auth.getUser()` to verify the user with Supabase.
5. If no user is returned, protected content/actions must not proceed.
6. The profile is loaded using the verified user ID. Onboarding state is
   handled by the route/layout logic.
7. User-owned data queries include the authenticated `userId` and any relevant
   portfolio identifier in their predicates.

A decoded client-side token or a user ID submitted in a form is not sufficient
authorization. The server must verify the session for the request.

## 2. Public market-data request

1. The client calls a same-origin GET Route Handler under `/api/crypto/`.
2. The handler parses and bounds query parameters.
3. A server-side adapter calls CoinGecko or the news RSS aggregator.
4. The adapter normalizes the upstream response into application types.
5. Next.js fetch/route caching limits repeated origin requests.
6. If an upstream dependency fails, the route may return fallback data with
   `meta.source = "fallback"`.
7. The client receives the `data`/`meta` envelope and should retain the source
   indicator for diagnostics or user-facing freshness messaging.

These are public market-information endpoints. They must not be repurposed to
return user-specific portfolio data without adding explicit authentication,
authorization, and cache isolation.

## 3. Add a BUY or SELL

1. A Client Component submits a FormData payload to the transaction Server
   Action.
2. The action verifies the current user.
3. Zod validates required identifiers, event type, timestamps, and notes.
4. Decimal strings are parsed directly by the decimal utility. They are not
   converted through JavaScript `Number` before validation.
5. The action resolves the user's default portfolio server-side.
6. A database transaction acquires the portfolio row lock.
7. The transaction row is inserted with session-derived `userId`, calculated
   `totalValue`, and database-generated `ledger_sequence`.
8. The ledger is read in `executed_at`, then `ledger_sequence` order and replayed.
9. The derived holding is inserted, updated, or deleted.
10. The DB transaction commits; the UI path is revalidated.

If replay rejects an oversell or any write fails, the database transaction is
rolled back and the action returns an error.

## 4. Correct a holding

A holding edit is not a direct write to the derived `holdings` row. The action:

1. Verifies the current user and validates the holding ID and decimal inputs.
2. Looks up the owning portfolio without first taking a holding-row lock.
3. Locks the owning portfolio row, then re-reads the holding with ownership
   predicates.
4. Inserts an `adjustment` ledger event containing the corrected absolute
   quantity and average cost basis.
5. Replays the ledger and updates/deletes the holding projection.
6. Commits both event and projection together.

A zero-quantity adjustment closes the position while preserving previous
transactions. It is not equivalent to the explicit delete-holding operation.

## 5. Delete a ledger event

1. Verify the user and locate the event within their ownership scope.
2. Acquire the portfolio lock before the write.
3. Re-read the event after acquiring the lock.
4. Delete it with user and portfolio predicates.
5. Replay the remaining ledger.
6. If a later SELL becomes invalid, throw and roll back the deletion.

## 6. Failure semantics

| Failure | Expected behaviour |
|---|---|
| No valid Supabase user | Reject protected operation; do not read/mutate user data |
| Invalid form data | Return validation error; no DB write |
| Decimal input exceeds precision/range | Reject before persistence |
| Portfolio not found/owned | Reject without disclosing another user's records |
| Oversell during replay | Roll back the transaction |
| Deletion makes later sale invalid | Roll back the deletion |
| CoinGecko unavailable | Market route may return fallback data and mark `meta.source` |
| Some RSS feeds unavailable | Aggregator may return successful feeds; fallback is used when all fail |
| All news feeds unavailable | Return fallback news with `meta.source = "fallback"` |

