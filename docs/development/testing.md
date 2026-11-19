# Testing Strategy

## 1. Test layers

| Layer | Purpose | Current command/location |
|---|---|---|
| Pure unit tests | Decimal validation and ledger replay rules | `npm test`; `tests/portfolio-ledger.test.ts` |
| Analytics tests | Adjustment exclusion from cash-flow views | `npm test`; `tests/analytics-adjustments.test.ts` |
| PostgreSQL integration | Actual Drizzle/PostgreSQL writes, replay, constraints, rollback | `npm run test:db`; `tests/ledger-database.integration.ts` |
| Static checks | Type correctness and lint rules | `npx tsc --noEmit`, `npx eslint src tests` |
| Production compilation | Next.js route/build validation | `npm run build` |
| Dependency audit | Known advisories | `npm audit` / `npm audit --omit=dev` |

Component tests and browser E2E tests are not represented as configured suites
in the current package scripts. Add and document them when introduced.

## 2. Unit and analytics tests

```powershell
npm test
```

The suite covers:

- BUY accumulation and weighted-average cost.
- SELL acquisition-cost removal and oversell rejection.
- ADJUSTMENT reset semantics and zero-quantity close.
- BUY events after a zero adjustment.
- Recorded `total_value` as the canonical BUY/ADJUSTMENT acquisition value.
- Decimal arithmetic, accepted scale, range, and database formatting.
- Sixteen-place transaction-total precision.
- Net invested, investment timeline, and monthly trading activity excluding
  adjustments.

## 3. PostgreSQL integration tests

```powershell
npm run test:db
```

The integration script requires `DATABASE_URL` and an existing portfolio. It
uses a temporary random coin ID and exercises the actual Drizzle transaction,
portfolio lock, `ledger_sequence`, database constraints, and holding
projection. Each scenario is rolled back; the script also checks that test
ledger/holding rows are absent after rollback.

**Run this suite against a dedicated staging or test database, not a busy
production database.** The test selects an existing portfolio and acquires its
row lock. Rolled-back transactions also consume sequence values, so sequence
gaps are expected. The suite is not a load test and is not designed to run
concurrently with production activity.

## 4. Required checks before a merge

```powershell
npm test
npm run test:db
npx tsc --noEmit
npx eslint src tests
npm run build
npm audit --omit=dev
```

If dependency changes are included, also inspect the full `npm audit` output,
review package-lock changes, and avoid `npm audit fix --force` without a
compatibility review.

## 5. Test design rules

- Keep accounting functions pure and deterministic.
- Use exact decimal strings in financial fixtures.
- Test the boundaries of every PostgreSQL numeric precision/scale.
- Include negative-path tests, not just successful writes.
- Verify rollback after a rejected mutation.
- Test equal event timestamps to verify `ledger_sequence` ordering.
- Use unique test asset identifiers; never reuse a real user's coin/position.
- Clean up or roll back all test data.
- Do not assert random sequence numbers are contiguous.
- Do not print secrets, auth tokens, or full database URLs in test output.
