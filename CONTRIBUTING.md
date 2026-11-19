# Contributing

Thank you for contributing to Crypto Portfolio Tracker. Changes should preserve
user-data isolation, financial correctness, and the reviewed database migration
history.

## Development workflow

1. Read the [documentation index](docs/README.md) and [development setup](docs/development/setup.md).
2. Create a focused branch from the current integration branch.
3. Keep changes scoped; avoid mixing unrelated dependency, UI, database, and
   documentation changes in one commit.
4. Add or update tests for behaviour changes.
5. Update the relevant documentation in the same change.
6. Run the required validation before opening a pull request.

## Required validation

```bash
npm test
npm run test:db
npx tsc --noEmit
npx eslint src tests
npm run build
npm audit --omit=dev
```

Run `npm run test:db` against a disposable/staging database, not a busy
production database. It uses a real database connection and acquires a
portfolio lock.

## Database change policy

- Change `src/db/schema.ts` and generate a named Drizzle migration.
- Review generated SQL, snapshots, and journal changes.
- Preserve applied migration history; use forward migrations.
- Never modify a live schema manually as a substitute for a migration.
- Never commit secrets or real user data.

## Security review requirements

For any new user-owned resource, include explicit authentication, owner-scoped
reads/writes, RLS policy, database relationship constraints, and cross-user
negative tests. Remember that the privileged Drizzle connection can bypass
RLS. Review [security documentation](docs/security/overview.md).

## Financial-domain requirements

- Use decimal strings and the shared decimal helpers for financial inputs.
- Do not use JavaScript floating-point values for ledger arithmetic.
- Treat transactions as source of truth and holdings as a projection.
- Use the portfolio lock for every ledger mutation.
- Preserve the `executed_at`, `ledger_sequence` replay order.
- Add tests for invalid sequences, deletion rollback, and precision boundaries.

## Pull request checklist

- [ ] Scope and rationale are clear.
- [ ] TypeScript and lint checks pass.
- [ ] Unit/analytics tests pass.
- [ ] Database tests pass against staging where applicable.
- [ ] Production build succeeds.
- [ ] Migrations and snapshots are included and reviewed.
- [ ] Authorization and failure paths are covered.
- [ ] Documentation is updated.
- [ ] No secrets, production data, or unrelated generated files are included.
