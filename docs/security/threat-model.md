# Threat Model

## 1. Scope

This lightweight threat model covers the Next.js application, Supabase Auth,
Supabase PostgreSQL, the privileged Drizzle connection, public market-data
providers, and deployment secrets. It is a living engineering aid, not a
formal penetration-test report or certification.

## 2. Assets

| Asset | Security objective |
|---|---|
| Supabase session/cookies | Confidentiality and integrity |
| Profile and portfolio data | User isolation and integrity |
| Transactions and holdings | Financial-record integrity |
| `DATABASE_URL` | Confidentiality and least-privilege use |
| Supabase project credentials | Confidentiality and access control |
| CoinGecko Demo API key | Confidentiality and quota protection |
| Public market/news responses | Availability, integrity, safe parsing |
| Migration history/backups | Recoverability and schema integrity |

## 3. Trust boundaries

1. Browser ↔ Next.js server: browser input and client state are untrusted.
2. Next.js server ↔ Supabase Auth: session verification boundary.
3. Next.js server ↔ PostgreSQL: privileged connection boundary; application
   code must perform owner authorization because RLS may be bypassed.
4. Next.js server ↔ CoinGecko/RSS feeds: external responses are untrusted and
   can be stale, malformed, rate-limited, or unavailable.
5. Deployment pipeline ↔ production secrets/database: privileged operational
   boundary.

## 4. Threat scenarios and controls

| Threat | Example | Primary controls | Residual work |
|---|---|---|---|
| Broken access control / IDOR | User substitutes another holding UUID | Verified session; explicit owner predicates; FK consistency; RLS; cross-user tests | Keep query review exhaustive |
| Session spoofing | Client claims an arbitrary user ID | Server verifies Supabase user; session-derived identity | Monitor auth/session configuration |
| Mass assignment | Client submits `userId` or portfolio owner fields | Zod schemas accept only intended fields; server supplies owner IDs | Review every new Server Action |
| SQL injection | User input enters SQL string | Parameterized Drizzle expressions | Avoid raw SQL interpolation of untrusted values |
| Race condition | Concurrent BUY/SELL corrupts projection | Portfolio `FOR UPDATE`; one transaction; replay | Keep all future mutation paths on the protocol |
| Ledger tampering | Invalid type or negative quantity inserted | CHECK constraints; typed event union; decimal validation | Audit migration and admin access |
| Precision corruption | Floating-point conversion changes small amounts | Decimal strings, `decimal.js`, NUMERIC columns | Test all new scale/range edges |
| Provider abuse/outage | CoinGecko 429 or RSS feed failure | Server-side keys, caching, bounded params, fallback response | Monitor provider failure rates and costs |
| Malformed RSS | XML shape/HTML content breaks UI | Central parser, normalization, strip markup, per-source isolation | Keep parser updated and test fixtures |
| Secret exposure | DB URL enters browser bundle or logs | Server-only usage, no `NEXT_PUBLIC_` secret prefix, log hygiene | Secret scanning and rotation procedure |
| Supply-chain compromise | Vulnerable npm dependency | Lockfile, `npm audit`, controlled upgrades | Review dev dependencies and CI checks |
| Availability loss | DB unreachable or migration blocks writes | Backups, staged migrations, runbooks | Rehearse recovery and set alerts |

## 5. Abuse cases to test

- Read, update, and delete a resource using another user's UUID.
- Submit a valid holding/transaction ID but another portfolio ID.
- Submit a forged `userId` in FormData.
- Attempt a negative or unsupported event type directly in SQL.
- Submit over-precision or over-range decimal inputs.
- Race two writes for the same portfolio.
- Delete a BUY or ADJUSTMENT that a later SELL depends on.
- Cause an upstream request to fail and verify fallback metadata.
- Inspect logs and browser bundles for secret leakage.

## 6. Assumptions and exclusions

- TLS is expected from the hosting platform and Supabase endpoints; verify the
  deployed domains/configuration rather than assuming it from local code.
- The project does not custody private keys or execute trades in the documented
  core workflow.
- This model does not cover compromise of the developer workstation, Supabase
  control plane, hosting provider, or npm registry beyond standard operational
  controls.
- A stored alert configuration does not prove a notification scheduler is
  deployed; verify the actual delivery process independently.

## 7. Risk review cadence

Review this document when adding a new data table, privileged database role,
external provider, authentication method, exchange integration, background
worker, or deployment environment. Reassess before enabling any feature that
can move assets or store exchange credentials.
