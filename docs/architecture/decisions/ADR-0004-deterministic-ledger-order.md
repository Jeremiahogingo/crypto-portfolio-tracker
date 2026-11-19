# ADR-0004: Deterministic Ledger Ordering

- **Status:** Accepted
- **Decision area:** Event replay and concurrency

## Context

Users may enter a backdated transaction, and multiple events can share the
same `executed_at` timestamp. Ordering by timestamp alone leaves tied rows
without a deterministic order. A random UUID is not an insertion-order key.

## Decision

Replay orders events by:

1. `executed_at ASC` (effective event time).
2. `ledger_sequence ASC` (database-generated insertion sequence for equal
   effective timestamps).

Each mutation also acquires the owning portfolio row with `SELECT ... FOR
UPDATE` before modifying the ledger. The lock remains held until the enclosing
transaction commits or rolls back.

## Consequences

- A later-inserted backdated event is placed by its effective time, not its
  insertion sequence relative to events on other dates.
- Sequence gaps are allowed; PostgreSQL sequences are not transactional.
- All ledger mutations must follow the same portfolio-first locking protocol.
- New code must not mutate transactions or holdings outside the shared
  transaction/recompute flow without explicitly revisiting this decision.
