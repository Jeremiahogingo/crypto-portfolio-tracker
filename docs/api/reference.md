# API Reference

## 1. API design

The currently built HTTP API surface is focused on public market information
and news. Portfolio/profile/watchlist/alert mutations are implemented as
Next.js Server Actions, not as a separately versioned public REST API. Do not
invent or rely on REST paths for those mutations.

Base URL examples use the same origin as the Next.js application:

```text
http://localhost:3000
```

The market endpoints are GET-only and do not accept user portfolio records.

## 2. Common response envelope

Market routes use an envelope of this form:

```json
{
  "data": "<route-specific normalized payload>",
  "meta": {
    "source": "live",
    "fetchedAt": "2026-11-19T08:00:00.000Z",
    "count": 1
  }
}
```

`meta.source` is `live` when upstream data is used and `fallback` when the
route serves local fallback data. `fetchedAt` is the route generation/fetch
indicator, not a guarantee that every underlying provider record was published
at that instant. `count` is the number of records in `data` (or one for the
single global-statistics object).

Fallback responses preserve the same data envelope so the UI can continue to
render. Clients that need freshness information must inspect `meta.source`.

## 3. Route catalog

| Method and path | Purpose | Route revalidation |
|---|---|---:|
| `GET /api/crypto/global` | Aggregate market statistics | 120 seconds |
| `GET /api/crypto/markets` | Normalized market coin list | 60 seconds |
| `GET /api/crypto/trending` | Trending assets | 300 seconds |
| `GET /api/crypto/news` | Aggregated RSS/Atom news articles | 300 seconds |

The route handler and shared type definitions remain authoritative if a
parameter or field changes.

### 3.1 `GET /api/crypto/global`

Returns normalized aggregate market information used for market overview
cards, including global market aggregates and dominance metrics.

- Query parameters: none.
- Cache: 120 seconds.
- Upstream: CoinGecko global endpoint.
- Failure behaviour: local `fallbackGlobal` payload with `meta.source` set to
  `fallback`.

Example:

```bash
curl http://localhost:3000/api/crypto/global
```

### 3.2 `GET /api/crypto/markets`

Returns normalized market coin records. It fronts CoinGecko's markets endpoint.

| Query parameter | Default | Behaviour |
|---|---|---|
| `vs_currency` | `usd` | Quote currency |
| `per_page` | `100` | Clamped to 1–250 |
| `page` | `1` | Minimum page is 1 |
| `ids` | omitted | Comma-separated CoinGecko IDs |
| `sparkline` | `false` | Enabled only when value is `true` |

The upstream request orders by market capitalization and asks for 24-hour
percentage change. Route cache: 60 seconds. On upstream failure, the handler
returns normalized local fallback markets and identifies the source as
`fallback`. The current handler converts numeric query strings with `Number`
before applying bounds; malformed non-numeric values should be explicitly
rejected in a future API-hardening change rather than allowed to propagate as
`NaN`.

Example:

```bash
curl "http://localhost:3000/api/crypto/markets?vs_currency=usd&per_page=50&page=1&ids=bitcoin,ethereum&sparkline=true"
```

### 3.3 `GET /api/crypto/trending`

Returns the current trending-asset list (the upstream adapter describes the
most-searched assets over the preceding 24 hours).

- Query parameters: none.
- Cache: 300 seconds.
- Upstream: CoinGecko trending search endpoint.
- Failure behaviour: local fallback trending data with `meta.source` set to
  `fallback`.

Example:

```bash
curl http://localhost:3000/api/crypto/trending
```

### 3.4 `GET /api/crypto/news`

Returns normalized news articles aggregated from RSS/Atom sources.

| Query parameter | Default | Behaviour |
|---|---:|---|
| `limit` | `30` | Clamped to 1–50 |

The aggregator currently registers CoinDesk, Cointelegraph, and The Block RSS
feeds. It fetches sources independently, tolerates partial failures, normalizes
RSS and Atom records, de-duplicates by article URL, sorts newest-first, and
limits the result. When every source fails, the route returns local fallback
articles with `meta.source` set to `fallback`.

Route/fetch cache: 300 seconds. As with the markets handler, the current
`limit` parser relies on numeric conversion and clamping; malformed non-numeric
input should be explicitly rejected in a future API-hardening change.

Example:

```bash
curl "http://localhost:3000/api/crypto/news?limit=20"
```

## 4. Mutation interfaces: Server Actions

User-owned mutations are server-side functions under `src/lib/actions/`. They
are invoked by Next.js forms/components and participate in the App Router
request lifecycle. They are not documented as stable external REST endpoints.

Current action areas include:

- Holdings: create a quick-add BUY, correct a position through an ADJUSTMENT,
  and explicitly delete a holding with its associated history.
- Transactions: create BUY/SELL events and delete events with ledger replay.
- Profiles: onboarding completion and profile updates.
- Watchlist: add/remove entries using the authenticated user identity.
- Alerts: create, toggle, and delete user-owned alert configurations.

When adding a Server Action, document its input schema, result union, required
session, owner scope, transaction boundary, cache revalidation, and error
behaviour in the action module and tests. Do not copy an implementation detail
into this public HTTP route table.

## 5. Error and fallback contract

The public market routes are designed to degrade gracefully. Upstream failures
may produce an HTTP success response containing fallback data. Therefore:

- Check `meta.source` rather than treating HTTP 200 as proof of live data.
- Treat upstream data as untrusted external input and normalize it before use.
- Keep API credentials in server-only environment variables.
- Do not include tokens, full upstream URLs containing secrets, or connection
  strings in logs.

Server Actions should return typed success/error results for expected validation
and ownership failures. Unexpected failures should be logged server-side with
safe context and returned as generic user-facing messages.

## 6. Adding an API route

1. Add a route under `src/app/api/` with an explicit HTTP method.
2. Validate and bound all query/body inputs.
3. Reuse an adapter from `src/lib/api/`; keep provider-specific payloads out of
   components.
4. Normalize the response into a shared type under `src/types/`.
5. Define cache behaviour deliberately; never share-cache private user data.
6. Define failure and fallback semantics and expose source metadata if
   fallback is possible.
7. Add route tests and update this reference.
