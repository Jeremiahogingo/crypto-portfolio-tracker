# ADR-0001: Transaction Ledger as the Source of Truth

- **Status:** Accepted
- **Decision area:** Portfolio accounting

## Context

A mutable holding row is convenient for reads but loses the sequence of
acquisitions, disposals, and manual corrections. Directly editing the row also
creates divergence because later transaction replay can overwrite that edit.

## Decision

`transactions` is the authoritative event ledger. `holdings` is a derived
projection rebuilt from the relevant ordered events. Ledger writes and holding
recomputation run in one PostgreSQL transaction.

The supported event types are `buy`, `sell`, and `adjustment`. A correction is
recorded as an adjustment event; it does not overwrite the projection directly.

## Consequences

- The current holding can be reconstructed from history.
- Corrections remain auditable in the transaction list.
- Invalid replay causes the whole mutation to roll back.
- Reads can use the compact `holdings` projection rather than replaying every
  transaction on each page request.
- Ledger changes require deterministic ordering and concurrency control.
- Explicitly deleting a holding remains a destructive operation that removes
  its associated transaction history; an adjustment to zero preserves history.

## Alternatives considered

- **Holdings as primary state:** rejected because edits and trade history can
  drift apart.
- **Directly overwrite a holding during edit:** rejected because the ledger
  would later reconstruct a different position.
- **Create an incremental correction delta:** rejected in favour of an
  absolute adjustment because the edit screen represents the target position.
