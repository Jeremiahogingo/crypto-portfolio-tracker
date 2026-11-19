# Backup and Restore

## 1. Objectives

Portfolio and transaction records are user data. A backup is useful only if it
can be restored and verified. Define recovery-point and recovery-time objectives
with the service owner; do not assume a particular Supabase plan or retention
window from application code.

## 2. Backup controls

- Confirm automated Supabase backups and retention in the actual project/plan.
- Determine whether point-in-time recovery is available and enabled for the
  deployed project.
- Restrict backup access to trusted operators.
- Protect exported backup files with encryption at rest and restricted access.
- Keep application schema migrations and deployment configuration under
  version control; these are not a substitute for data backups.
- Record backup time, scope, storage location, and verification status without
  including credentials in the record.

## 3. Logical backup example

Where a direct PostgreSQL connection and PostgreSQL client tools are available,
a logical backup can be created with `pg_dump`:

```powershell
pg_dump --format=custom --no-owner --no-privileges `
  --file="crypto-portfolio-backup.dump" `
  $env:DATABASE_URL
```

Use a secure environment variable/secret store. Avoid command histories,
transcripts, and logs that print the connection string. Some pooled connections
are unsuitable for administrative dump/restore operations; use the provider's
recommended direct connection method for backup tooling.

## 4. Restore rehearsal

1. Choose an isolated recovery database/project.
2. Restore the backup using the provider-recommended method or `pg_restore`.
3. Apply only the migrations needed to bring the restored schema to the
   intended application release; compare against the migration history first.
4. Verify row counts, foreign keys, RLS, policies, unique/check constraints,
   trigger/function definitions, and sequence state.
5. Run the application test suite against the restored environment.
6. Verify representative users can only access their own data.
7. Record duration, issues, and the tested recovery point.

Example for a custom-format dump (use a deliberately selected empty target):

```powershell
pg_restore --no-owner --no-privileges `
  --dbname="$env:RESTORE_DATABASE_URL" `
  "crypto-portfolio-backup.dump"
```

Do not run restore commands against production without an approved incident or
maintenance plan. A restore can overwrite data.

## 5. Post-restore application checks

- Auth identities and profiles are consistent.
- Portfolio/user composite relationships are valid.
- Holdings can be recomputed from ledger history for sampled coins.
- `ledger_sequence` values are populated and unique; sequence next value is
  greater than existing values.
- Migration journal and live schema match.
- RLS is enabled and policies/privileges remain correct.
- No temporary integration-test records remain.
