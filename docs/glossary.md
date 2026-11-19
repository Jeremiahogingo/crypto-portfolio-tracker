# Glossary

| Term | Definition |
|---|---|
| ADJUSTMENT | Absolute ledger event that resets recorded position quantity and acquisition basis without representing a cash trade. |
| Average cost basis | Weighted-average acquisition cost per currently held unit. |
| Coin ID | Stable provider asset identifier used to join market data to portfolio records. |
| Cost total | Current quantity multiplied by average cost basis. |
| Drizzle | TypeScript ORM/schema toolkit used for PostgreSQL access and migrations. |
| Effective event time | `executed_at`, the timestamp that determines a ledger event's chronological position. |
| Holding projection | Current per-coin quantity and average basis reconstructed from the ledger. |
| Ledger | Ordered set of BUY, SELL, and ADJUSTMENT events for an asset in a portfolio. |
| Ledger sequence | Database-generated unique integer used to order events with equal `executed_at` values. |
| Net cash invested | BUY recorded value minus SELL proceeds; adjustments do not change it. |
| Non-custodial | The application tracks portfolio data but does not hold users' crypto assets or require seed phrases/private keys for the core workflow. |
| RLS | PostgreSQL Row-Level Security, which restricts rows according to database role and policies. |
| Server Action | Next.js server-side function invoked through the App Router form/action mechanism; not necessarily a public REST endpoint. |
| Supabase Auth | Identity/session provider used by the application. |
| Transaction total | Recorded event value in `transactions.total_value`; stored with scale 16. |
| Weighted-average cost | Method that removes cost on SELL at the current average cost per unit. |
