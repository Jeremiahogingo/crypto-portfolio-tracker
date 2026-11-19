# Operational Runbooks

## 1. Market data is stale or uses fallback

**Symptoms:** `meta.source` is `fallback`, market values stop changing, or the
news list contains fallback articles.

1. Check application server logs for the route/provider warning.
2. For CoinGecko, verify `COINGECKO_BASE_URL`, optional Demo key, provider
   status, response status, quota, and outbound network access.
3. For news, check the registered RSS/Atom feeds and determine whether one or
   all sources failed.
4. Confirm the route/fetch cache window before concluding that an upstream
   response is stuck.
5. Do not delete the fallback path solely to hide an upstream outage.
6. Record the time, route, source metadata, upstream status, and recovery.

## 2. Authentication or protected-route failure

1. Confirm the correct Supabase project URL and public anon key are configured.
2. Check cookie domain, same-site/secure behaviour, callback URLs, and the
   current request proxy configuration.
3. Verify `auth.getUser()` returns the expected user in a safe local/staging
   environment.
4. Check onboarding/profile provisioning separately from authentication.
5. Do not bypass `getCurrentUser()` or use a client-submitted user ID as a
   workaround.
6. If session compromise is suspected, revoke affected sessions through the
   identity provider and rotate credentials as appropriate.

## 3. Database connectivity failure

1. Check the database host/project health and provider status.
2. Verify the deployed `DATABASE_URL` secret without printing it.
3. Check that the connection string is for the intended environment and that
   pooler/direct connection semantics match the operation.
4. Inspect PostgreSQL connection limits and application pool usage.
5. Check recent migrations and database locks.
6. Do not switch to a service-role or broader credential as an unreviewed
   workaround.

## 4. Ledger replay or oversell error

1. Preserve the original error and affected portfolio/coin identifiers in a
   secure internal incident record (do not include secrets).
2. Inspect the ordered ledger by `executed_at`, then `ledger_sequence`.
3. Validate event quantities, event types, and recorded totals.
4. Confirm the portfolio lock protocol is used by all mutation entry points.
5. Do not manually edit `holdings` to suppress the error; the ledger remains
   authoritative.
6. If the recorded position needs correction, use the ADJUSTMENT workflow
   after validating the real-world position and basis.
7. If deleting an event makes a later SELL invalid, the expected behaviour is
   rollback; delete or correct the dependent later event only with explicit
   business approval.

## 5. Migration failure

1. Stop further application deploys/migration attempts.
2. Capture the exact SQL error, migration tag, and migration runner output.
3. Inspect whether PostgreSQL rolled back the statement/transaction.
4. Compare live schema, `drizzle.__drizzle_migrations`, journal, snapshot, and
   migration SQL.
5. Do not insert a migration hash manually and do not blindly rerun a partial
   script.
6. Prepare a reviewed corrective forward migration or use the recovery plan.
7. Verify in staging before retrying production.

## 6. Suspected credential exposure or unauthorized access

1. Restrict access to affected systems and preserve logs.
2. Rotate the exposed credential (database, Supabase, or provider) through the
   owning provider's secure process.
3. Revoke impacted user sessions when identity compromise is suspected.
4. Review audit/provider logs, recent deployments, and repository history.
5. Remove exposed values from active deployment configuration and source; treat
   history exposure as still compromised even after deletion.
6. Restore normal service only after access paths and credentials are reviewed.
7. Follow the private reporting process in `SECURITY.md`.

## 7. Post-incident record

Record: incident timeline, affected routes/data, root cause, customer impact,
credential rotation, data integrity checks, recovery steps, and preventive
changes. Turn recurring manual steps into monitored automation only after the
required operational ownership and failure handling are defined.
