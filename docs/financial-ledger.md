cd "D:\JavaScript\Next_js\crypto-portfolio-tracker"

New-Item -ItemType Directory -Force .\docs | Out-Null

@'
# Financial Ledger and Position Accounting

## 1. Architecture

The transaction ledger is the authoritative record of portfolio activity.

The `holdings` table is a denormalized projection reconstructed from
transactions. It must not be treated as an independent source of truth.

Ledger changes and holding recomputation execute in the same PostgreSQL
transaction. If replay fails, the entire mutation is rolled back.

## 2. Supported event types

### BUY

A BUY records an acquisition.

- Quantity must be greater than zero.
- Unit price must be nonnegative.
- Recorded transaction value is quantity multiplied by unit price.
- Replay adds the quantity and recorded acquisition cost.

### SELL

A SELL records a disposal.

- Quantity must be greater than zero.
- Unit price must be nonnegative.
- Recorded transaction value represents sale proceeds.
- Replay removes quantity and its proportional share of acquisition cost
  using the weighted average cost basis immediately before the sale.
- A sale exceeding the available quantity is rejected.

Sale proceeds do not reduce acquisition cost directly. The remaining position
retains its weighted average cost basis.

### ADJUSTMENT

An ADJUSTMENT records an absolute correction to a position.

It is not a purchase or sale and must not be created through the ordinary
BUY/SELL transaction form.

- Quantity is the corrected absolute position quantity.
- Price per unit is the corrected average cost basis.
- Total value records quantity multiplied by the corrected cost basis.
- Replay replaces the current quantity and acquisition cost with the
  adjustment values.
- Zero quantity is permitted and closes the current position.
- Previous transactions remain in the ledger.

An adjustment does not represent a cash deposit or withdrawal.

## 3. Decimal precision

Financial inputs are parsed directly from strings using `decimal.js`.
They must not be converted through JavaScript `Number` before validation.

Database precision:

| Value | PostgreSQL type |
|---|---|
| Transaction and holding quantity | NUMERIC(28,8) |
| Unit price and holding cost basis | NUMERIC(20,8) |
| Transaction total value | NUMERIC(48,16) |

The sixteen-place transaction total is intentional: multiplying two
eight-decimal values can require sixteen fractional digits.

Input quantities and unit prices are limited to eight meaningful decimal
places. Database formatting and rounding are explicit.

## 4. Deterministic ledger order

Events are replayed by:

1. `executed_at` ascending.
2. `ledger_sequence` ascending when timestamps match.

`ledger_sequence` is database-generated and unique. It provides a stable
tie-breaker for transactions recorded with identical execution timestamps.

A transaction entered with a historical execution time can change the
reconstructed position at that point in history. The complete ledger is
therefore replayed after every mutation.

## 5. Concurrency and ownership

Before changing ledger events, the server action locks the owning portfolio
row using `SELECT ... FOR UPDATE`.

This serializes mutations within one portfolio while allowing independent
portfolios to proceed concurrently.

The lock and all ledger writes/recomputation must share one database
transaction.

The application derives `user_id` from the verified Supabase session.
Database queries also include explicit ownership predicates because the
application's privileged Drizzle connection can bypass row-level security.

## 6. Deletion behaviour

Deleting a transaction causes the position to be recomputed from the
remaining ledger.

A deletion is rejected if it would leave a later SELL with insufficient
quantity. The deletion and recomputation are atomic: a failure restores the
original event and holding projection.

Deleting a holding through the explicit delete-holding action remains a
separate destructive operation that removes the position and its associated
transaction history.

A zero-quantity adjustment is different: it closes the position while
preserving the historical ledger.

## 7. Analytics treatment

Adjustments are excluded from:

- Net cash invested.
- The cumulative investment timeline.
- Monthly BUY/SELL activity.

They remain visible and filterable in transaction history.

Portfolio value and unrealized P&L continue to be calculated from current
holding projections and market prices.

## 8. Regression testing

Run unit and analytics tests:

```bash
npm test```

Run PostgreSQL-backed integration tests:

```bash
npm run test:db
```

The database integration test requires DATABASE_URL and an existing
portfolio. It uses temporary coin identifiers and rolls back test
transactions. PostgreSQL sequence values may still advance during rollback.

## 9. Database migrations

The adjustment and replay schema is introduced by:

- `0005_transaction-adjustment-events`
- `0006_transaction-total-precision`

Apply reviewed migrations using:

```bash
npx drizzle-kit migrate
```

Do not replace the migration history with `drizzle-kit push`.
