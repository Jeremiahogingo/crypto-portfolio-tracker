# ADR-0003: Decimal Arithmetic for Financial Values

- **Status:** Accepted
- **Decision area:** Financial correctness

## Context

JavaScript `Number` uses binary floating-point. Many decimal fractions cannot
be represented exactly. Quantities and unit prices in this application are
persisted as PostgreSQL `NUMERIC`, so converting the user input through
`Number` before persistence can lose information.

## Decision

- Parse financial form inputs as decimal strings.
- Use `decimal.js` for transaction totals and ledger replay.
- Keep quantity and unit price at eight fractional places.
- Store transaction totals at sixteen fractional places because the product
  of two scale-8 values can require scale 16.
- Format/round explicitly at the database boundary.

## Consequences

- Do not calculate a transaction total with `quantity * price` using
  JavaScript `Number` in a financial write path.
- Do not compare quantities with arbitrary floating-point tolerances.
- Tests must include very small values, maximum supported values, and
  eight-to-sixteen-place precision boundaries.
- UI formatting may convert to Number for display only where the display
  formatter's precision and magnitude limits are acceptable; it must not feed
  that rounded display value back into the ledger.
