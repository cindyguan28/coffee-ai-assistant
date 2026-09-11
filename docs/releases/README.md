# Beanmemo release history

This directory is the source of truth for Beanmemo product releases. Release notes are grouped by customer value; commits and Linear issues remain available for traceability.

## Releases

| Version | Release | Status | Production date |
| --- | --- | --- | --- |
| [v0.1.2](./2026-09-11-coffee-library-growth.md) | Coffee Library & Growth Foundation | Draft | Pending |
| [v0.1.1](./2026-09-10-production-polish.md) | Production polish | Production | 2026-09-10 22:14 CEST |
| [v0.1.0](./2026-09-09-public-beta.md) | Next.js Public Beta | Production | 2026-09-09 22:55 CEST |

## Update policy

Create one new file for every Production deployment that changes customer-visible behavior, data handling, authentication, or operational readiness.

Each note records:

- semantic version and release name;
- lifecycle status: Draft, Release candidate, Production, or Rolled back;
- Preview and Production timestamps;
- source branch and immutable commit;
- grouped customer-facing changes;
- migrations or actions required from an operator;
- validation evidence and related Linear items.

### Release workflow

1. Open or update the matching Linear release-management item.
2. Create the release note when a Preview candidate is assembled.
3. Record automated verification and user-acceptance results.
4. After Production deployment, replace `Pending` fields with the exact deployment timestamp, commit, and Vercel deployment ID.
5. Mark the included Linear items Done only after the Production health check passes.
6. Never rewrite a previous release to include later changes; create the next version instead.

## Public changelog policy

Repository notes may include operational details. A future public `/updates` page should use only the customer-facing sections and omit security-sensitive implementation details.

Recommended trigger: publish `/updates` after Beanmemo has at least two Production releases worth announcing. Link it quietly from the footer; keep the landing page focused on the product rather than a long changelog.
