# Database Migrations and Change Management

## 1. Source of truth

- Drizzle declarations: `src/db/schema.ts`
- Drizzle configuration: `drizzle.config.ts`
- SQL migration files and metadata: `drizzle/`
- Migration journal: `drizzle/meta/_journal.json`
- Applied migration records: `drizzle.__drizzle_migrations`

A migration consists of SQL, the matching Drizzle snapshot, and a journal entry.
Commit all generated files together. Never edit an already-applied migration
just to make it match a new schema; add a forward migration instead.

## 2. Current migration sequence

The local project history has been verified through `0006`:

| Tag | Purpose |
|---|---|
| `0000_overjoyed_kang` | Baseline schema migration |
| `0001_portfolio-ownership-integrity` | Portfolio/user ownership integrity |
| `0002_security-hardening` | Database security hardening |
| `0003_rls-authenticated-policy-targets` | Restrict policy targets to authenticated role |
| `0004_unique-holdings-and-watchlist` | Unique position and watchlist constraints |
| `0005_transaction-adjustment-events` | Ledger sequence, replay index, event-type and value constraints |
| `0006_transaction-total-precision` | Widen `transactions.total_value` to `NUMERIC(48,16)` |

The database used during the current implementation was verified through
migration ID 7, corresponding to tags 0005 and 0006.

## 3. Generate a migration

1. Change `src/db/schema.ts` and related types.
2. Run TypeScript and lint checks.
3. Generate a named migration:

```bash
npx drizzle-kit generate --name=descriptive-change
```

4. Read the generated SQL before applying it.
5. Inspect lock-heavy statements, table rewrites, constraints, defaults, data
   backfills, indexes, and destructive operations.
6. Review the new snapshot and `_journal.json` entry.
7. Run the migration against a disposable/staging database.
8. Run application tests and a production build.
9. Commit schema, migration SQL, snapshot, journal, code, and docs together.

## 4. Apply reviewed migrations

```bash
npx drizzle-kit migrate
```

The migrator applies pending journal entries and records their hashes in
`drizzle.__drizzle_migrations`. Use the same database target configured by
`DATABASE_URL` for generation/application as appropriate for the environment.

Do not use `drizzle-kit push` as a replacement for reviewed migration history.
Do not manually insert migration hashes into the migration table to bypass a
failed migration.

## 5. Production migration checklist

Before deployment:

- Confirm the target database and branch/project.
- Take or verify a recoverable backup.
- Check row counts and invalid existing values before adding constraints.
- Review whether the migration takes an access-exclusive lock or rewrites a
  large table.
- Confirm the application release is compatible with the migrated schema.
- Apply migrations once through the deployment/migration process.

After deployment:

- Confirm the migrator completed.
- Inspect `drizzle.__drizzle_migrations`.
- Verify newly added columns, defaults, constraints, indexes, and sequences in
  `information_schema`, `pg_constraint`, `pg_indexes`, and `pg_sequences`.
- Run smoke tests and observe DB/application logs.

## 6. Roll-forward and recovery

Prefer a corrective forward migration. If a migration partially fails, first
inspect PostgreSQL's transaction outcome and compare the live schema with the
migration SQL and migration history. Do not blindly rerun statements or create
an out-of-band migration-table row.

For a destructive or failed production migration, stop further deployments,
retain logs, verify backup availability, and use the documented recovery
procedure. Restore rehearsal belongs in staging; see
[Backup and restore](../operations/backup-and-restore.md).

## 7. Sequence notes

`ledger_sequence` is a PostgreSQL `serial`/sequence-backed integer. The database
generates values for existing and future transaction rows. Sequence advancement
is not rolled back when a transaction rolls back. Gaps do not indicate lost
ledger events and must not be treated as corruption.
