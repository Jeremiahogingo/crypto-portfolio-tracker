# Project Documentation

This directory is the detailed technical reference for Crypto Portfolio Tracker.
The root [`README.md`](../README.md) is the project overview; this index is the
entry point for engineering, operations, security, database, and API material.

## Start here

| Audience | Read first | Then consult |
|---|---|---|
| New developers | [Development setup](development/setup.md) | [System architecture](architecture/system-architecture.md), [Testing](development/testing.md) |
| Frontend developers | [System architecture](architecture/system-architecture.md) | [Request lifecycle](architecture/request-lifecycle.md), [API reference](api/reference.md) |
| Backend developers | [Request lifecycle](architecture/request-lifecycle.md) | [Database schema](database/schema-reference.md), [Ledger accounting](database/ledger-accounting.md) |
| Database maintainers | [Schema reference](database/schema-reference.md) | [Migrations](database/migrations.md), [RLS and privileges](database/rls-and-privileges.md) |
| Security reviewers | [Security overview](security/overview.md) | [Threat model](security/threat-model.md), [Access matrix](security/access-control-matrix.md) |
| Operators | [Deployment guide](operations/deployment.md) | [Runbooks](operations/runbooks.md), [Backup and restore](operations/backup-and-restore.md) |
| Product reviewers | [Capabilities and limitations](product/capabilities-and-limitations.md) | [Glossary](glossary.md) |

## Architecture

- [System architecture](architecture/system-architecture.md) — application boundaries, runtime components, and dependency direction.
- [Request and data flows](architecture/request-lifecycle.md) — authentication, market-data, and portfolio-mutation lifecycles.
- [ADR-0001: Ledger as source of truth](architecture/decisions/ADR-0001-ledger-as-source-of-truth.md)
- [ADR-0002: Authentication and database boundaries](architecture/decisions/ADR-0002-authentication-and-database-boundaries.md)
- [ADR-0003: Decimal financial arithmetic](architecture/decisions/ADR-0003-decimal-financial-arithmetic.md)
- [ADR-0004: Deterministic transaction ordering](architecture/decisions/ADR-0004-deterministic-ledger-order.md)

## Database

- [Schema reference](database/schema-reference.md) — tables, columns, relationships, indexes, and constraints.
- [Ledger accounting](database/ledger-accounting.md) — BUY, SELL, ADJUSTMENT, weighted-average cost, precision, and replay rules.
- [Migrations](database/migrations.md) — migration history, generation, review, deployment, and recovery.
- [RLS and database privileges](database/rls-and-privileges.md) — policy model and the privileged Drizzle connection boundary.

## API and security

- [API reference](api/reference.md) — currently built route handlers, query parameters, response envelope, and caching.
- [Security overview](security/overview.md) — authentication, authorization, secrets, data protection, and secure-development requirements.
- [Threat model](security/threat-model.md) — assets, trust boundaries, threats, and mitigations.
- [Access-control matrix](security/access-control-matrix.md) — resource ownership rules and where checks belong.

## Development and operations

- [Development setup](development/setup.md)
- [Testing strategy and commands](development/testing.md)
- [Deployment guide](operations/deployment.md)
- [Operational runbooks](operations/runbooks.md)
- [Backup and restore](operations/backup-and-restore.md)
- [Capabilities and limitations](product/capabilities-and-limitations.md)
- [Glossary](glossary.md)
- [Contribution guidelines](../CONTRIBUTING.md)
- [Security reporting](../SECURITY.md)

## Documentation policy

The implementation is authoritative when behaviour changes. Update the relevant
document in the same pull request as a schema, API, security, or domain-rule
change. Do not document a planned integration as an implemented capability.
For route parameters and response fields, verify the current route handler and
its exported TypeScript types before changing this reference.

Some information is deployment-specific (provider project URL, database host,
secret values, hosting domain, backup retention, and production alerting). Those
values deliberately do not belong in source control. Keep them in the hosting
platform's secret/configuration store and record only the operational procedure
here.
