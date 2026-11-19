# Ledger Accounting Rules

## 1. Source of truth

`transactions` is the authoritative event ledger. `holdings` is a denormalized
projection reconstructed from the ledger. The projection is maintained for
fast reads; it is not independently edited by normal position-correction
flows.

A ledger mutation and the resulting projection update execute in the same
PostgreSQL transaction. Any replay or write failure rolls the entire operation
back.

## 2. Event semantics

### BUY

A BUY adds units and acquisition cost.

- `quantity` must be greater than zero.
- `price_per_unit` must be nonnegative.
- `total_value` is the recorded quantity × unit-price amount at scale 16.
- Replay performs `quantity += event.quantity` and
  `total_cost += event.total_value`.

### SELL

A SELL reduces the position and removes its proportional acquisition cost.

- `quantity` must be greater than zero.
- `price_per_unit` must be nonnegative.
- `total_value` records sale proceeds; it is not the amount removed from
  acquisition cost.
- The cost removed is `sold_quantity × average_cost_before_sale`.
- A sale larger than the available quantity at that point in the ordered
  ledger is rejected.
- A full close sets quantity and remaining cost to exactly zero to avoid
  residual arithmetic noise.

This is weighted-average cost accounting. It is not FIFO, LIFO, specific-lot
accounting, or a tax-lot engine.

### ADJUSTMENT

An ADJUSTMENT is an absolute correction to the current recorded position. It
is not a trade and is not a cash flow.

- `quantity` is the corrected absolute quantity.
- `price_per_unit` is the corrected average cost basis per unit.
- `total_value` is the corrected quantity × corrected cost basis.
- Replay resets quantity to the event quantity and total acquisition cost to
  the recorded total value.
- Zero quantity is valid and removes the current holding projection.
- Earlier ledger events remain preserved.

The UI's holding edit action writes an ADJUSTMENT. The regular add-transaction
form remains limited to BUY and SELL.

## 3. Replay order

Every coin ledger is replayed by:

1. `executed_at ASC` — effective event time.
2. `ledger_sequence ASC` — stable insertion-order tie-breaker for equal event
   timestamps.

A random UUID is not a valid substitute for the insertion sequence. A
PostgreSQL sequence is not rolled back with the surrounding transaction, so
gaps in `ledger_sequence` are expected and harmless.

A backdated event is ordered by its effective timestamp, even if it was
inserted later. Adding or deleting a backdated event can therefore change the
reconstructed position at subsequent points in the ledger.

## 4. Weighted-average calculation

For a BUY with quantity `q` and recorded cost `v`:

```text
new_quantity  = old_quantity + q
new_total_cost = old_total_cost + v
```

For a SELL with quantity `s`, when `0 < s < current_quantity`:

```text
average_cost_before_sale = total_cost / quantity
cost_removed = s × average_cost_before_sale
new_quantity = quantity - s
new_total_cost = total_cost - cost_removed
```

For a full close (`s = quantity`), both remaining quantity and total cost are
set to zero. For ADJUSTMENT:

```text
quantity = adjustment.quantity
total_cost = adjustment.total_value
```

After replay:

```text
cost_basis = total_cost / quantity     when quantity > 0
cost_basis = 0                         when quantity = 0
```

## 5. Decimal precision

Financial inputs are parsed from strings with `decimal.js`. Avoid a conversion
through JavaScript `Number` before validation or persistence.

| Value | Database type | Input/calculation scale |
|---|---|---:|
| Quantity | `NUMERIC(28,8)` | 8 |
| Unit price / holding basis | `NUMERIC(20,8)` | 8 |
| Transaction total | `NUMERIC(48,16)` | 16 |

The product of two eight-decimal values may require sixteen fractional digits.
The wider transaction-total column preserves that product rather than
prematurely rounding it to eight places.

Rounding is explicit at persistence boundaries. UI formatting is not an
accounting operation and must never be used as the source for a subsequent
ledger write.

## 6. Concurrency protocol

Every ledger mutation follows this order:

1. Identify the target portfolio using an ownership-scoped, non-locking read
   when the portfolio ID is discovered from a child record.
2. Acquire `SELECT ... FOR UPDATE` on the portfolio row using both portfolio
   ID and authenticated user ID.
3. Re-read the target child record after the lock when necessary.
4. Insert/delete the event.
5. Replay the full affected coin ledger.
6. Update/insert/delete the holding projection.
7. Commit.

All writers must use the same lock order. Do not lock a holding or transaction
row first and then try to lock the portfolio; consistent lock order reduces
deadlock risk. Independent portfolios can be mutated concurrently.

## 7. Deletion and rollback

Deleting a ledger event is allowed only if replay of the remaining events is
valid. If removing a BUY or ADJUSTMENT leaves a later SELL larger than the
available position, the deletion must roll back. The original ledger event and
holding projection remain intact.

Explicit deletion of a holding remains a separate destructive workflow that
removes its associated transaction history. A zero-quantity ADJUSTMENT closes
a position while preserving the ledger.

## 8. Analytics semantics

ADJUSTMENT events are excluded from:

- Net cash invested (BUY value minus SELL proceeds).
- The cumulative investment timeline.
- Monthly BUY/SELL activity.

They remain visible in transaction history. Current portfolio valuation and
unrealized P&L are calculated from current holding quantities, cost basis, and
market prices. A transaction ledger alone is not a historical daily portfolio
snapshot; historical account-value curves require explicit snapshots or
another source of historical valuation data.

## 9. Operational invariants

- Never update a holding projection directly to correct a position; write an
  ADJUSTMENT event and recompute.
- Never silently ignore an unknown event type.
- Never allow negative quantities or negative recorded prices/totals.
- Never bypass portfolio locking for ledger mutations.
- Never infer authorization from a UUID supplied by the client.
- Never change precision or rounding without adding boundary tests and a
  reviewed migration.
