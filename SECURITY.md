# Security Policy

## Scope

This repository handles authenticated user profiles, portfolio data, a
transaction ledger, and provider credentials. Reports involving unauthorized
data access, session handling, database privileges, financial-record integrity,
secret exposure, or remote code execution are security-sensitive.

## Reporting a vulnerability

Please do not publish an exploitable vulnerability in a public issue or pull
request. Use GitHub's private vulnerability reporting/security advisory channel
for this repository when it is enabled. If private reporting is not enabled,
contact the repository owner through a private contact channel listed on the
owner's GitHub profile and request a coordinated disclosure path.

Include, where safe:

- A concise description and affected component/commit.
- Reproduction steps or a minimal proof of concept.
- Security impact and preconditions.
- Any suggested mitigation.

Do not include real users' personal data, production secrets, session tokens,
passwords, or unrestricted database exports.

## Response expectations

The maintainers will acknowledge reports as practical, investigate severity
and affected releases, and coordinate a fix/disclosure timeline with the
reporter. No specific response-time SLA is implied by this policy.

## Operational guidance

If a credential is exposed, treat it as compromised even if it is removed from
the working tree. Rotate it with the owning provider, review access logs, and
remove it from deployment configuration and repository history as appropriate.
See [the security overview](docs/security/overview.md) and
[operational runbooks](docs/operations/runbooks.md).
