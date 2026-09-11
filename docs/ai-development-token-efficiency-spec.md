# Beanmemo — AI Development & Token Efficiency Spec

## Purpose

This spec defines how Beanmemo product discussion, Linear planning, AI-assisted development, testing, and deployment should be organized to reduce unnecessary AI token consumption and repeated work while preserving development quality.

**Guiding principle:** Discuss freely. Freeze scope before coding. Develop in batches. Validate once. Deploy deliberately.

## Default workflow

```text
Product Discussion
→ Decision
→ Linear Issue Updated
→ Scope Frozen / Ready for Dev
→ Development Batch
→ Lint + Test + Build
→ Preview Validation
→ Acceptance
→ Merge to main / designated release branch
→ Production
```

Product discussion does not automatically trigger code changes. New ideas found during testing normally return to the backlog rather than immediately starting another development run.

## Source of truth and responsibilities

### Product discussion

Use product discussion for strategy, UX decisions, data semantics, prioritization, architecture, edge cases, and acceptance criteria. Do not inspect the repository or start implementation unless implementation details are needed.

### Linear

Linear is the authoritative source of truth for changing implementation scope. Once a product decision is made, record it in the appropriate issue. Coding agents should rely on the current Linear issue rather than reconstructing decisions from long chat histories.

An implementation-ready issue should answer:

1. What problem are we solving?
2. What behavior is expected?
3. What important product/data rules apply?
4. What must not happen?
5. How will we know it works?

### Development agent / Codex / Work

Prefer one continuing development thread for related work. The agent should read only relevant issues and code, avoid reviewing the entire roadmap, avoid unrelated redesign/refactoring, preserve existing architecture unless required, and batch related implementation work.

## Linear status interpretation

- **Backlog** — still being discussed or insufficiently defined.
- **Todo** — Ready for Dev; scope is sufficiently frozen.
- **In Progress** — actively being implemented.
- **In Review** — implementation complete; Preview/manual validation and integration are underway.
- **Done** — accepted, verified, and merged into `main` or the designated release branch.

`Todo` means a developer can implement the issue without restarting product discovery; it does not merely mean the issue is important.

**Done gate:** user acceptance alone is not sufficient. An issue may move to Done only after the accepted implementation has been merged into `main` or the designated release branch.

If a later feature branch already contains an earlier accepted issue, prefer one integration PR from the superset branch rather than merging overlapping branches independently.

## Ready-for-development criteria

Before entering a development batch, an issue should normally have:

- a clear requirement;
- settled important data/business semantics;
- testable acceptance criteria;
- no major unresolved product question.

Minor implementation choices may remain with the developer.

## Batch development

Develop related issues together when they touch the same models, screens, or workflows. Preferred batch size is **2–4 closely related issues**.

Avoid both one tiny change per full agent run and large batches of unrelated issues.

Examples:

### Data model batch

- COF-74 Coffee Product architecture
- COF-56 Multi-origin
- COF-81 Reference profile vs user perception

### Activation batch

- COF-49 Analytics
- COF-71 First-value onboarding
- COF-78 Authentication

### Adaptive journey batch

Group setup-aware issues that share the same journey and implementation context rather than implementing each in isolation.

## Standard development prompt

Prefer narrow prompts such as:

```text
Implement the following Ready-for-Development issues:
COF-XX, COF-YY, COF-ZZ.

Linear is the source of truth.

Constraints:
- Inspect only files relevant to these issues.
- Do not review unrelated backlog.
- Do not redesign unrelated UI.
- Preserve backward compatibility.
- Reuse existing architecture where appropriate.
- Run lint, tests and build after the batch.
- Fix failures caused by these changes.
- Do not deploy production.

At the end report only:
1. implemented
2. migrations
3. tests/build status
4. manual validation required
5. blockers or follow-up issues
```

Avoid broad requests to re-review the entire repository, architecture, or roadmap unless that analysis is genuinely necessary.

## Repository context

Keep `docs/codex-context.md` focused on stable facts that coding agents repeatedly need: architecture, durable product principles, engineering guardrails, and important repository directories.

Do not duplicate the complete Linear roadmap there. Linear remains the source of truth for changing scope.

## Testing strategy

AI should not automatically perform a full product review after every Preview deployment.

For straightforward behavior, manually verify page loading, controls, persistence, editing, mobile layout, and expected UX first.

Bring AI back when there is a reproducible bug, unexpected behavior, RLS failure, migration issue, build/type/test error, unclear product behavior, or architecture conflict.

When reporting failures, provide the smallest useful reproduction: affected feature, expected result, observed result, steps, and the relevant error/log excerpt.

## Error handling

Use targeted debugging:

```text
Fix this specific failure.
Do not refactor unrelated code.
```

Prefer the first meaningful error, relevant stack trace, and roughly 20–40 surrounding log lines rather than entire build logs.

## Deployment policy

A code change and a production deployment are not the same event.

Multiple commits are fine. Use Preview when a meaningful batch is ready for validation. Production should normally happen only after implementation is complete, tests/build pass, Preview validation is complete, required migrations have been reviewed, and the accepted implementation has been merged into `main` or the designated release branch.

Avoid unnecessary repeated production deployments. Hotfixes are an exception.

## Findings during testing

Classify discoveries as:

- Bug
- UX improvement
- New feature
- Product question

Bugs blocking current acceptance criteria may be fixed in the current batch. Non-blocking improvements and new ideas should return to Linear and be considered for a later batch.

Preferred loop:

```text
Test → collect findings → classify → update Linear → batch next work
```

Avoid:

```text
notice issue → start agent → deploy → notice another issue → start agent again
```

## Token-efficiency rules

1. **Reuse context.** Continue an existing development thread for the same area where practical.
2. **Linear over chat history.** Coding agents read current issues instead of reconstructing long conversations.
3. **Batch related work.** Avoid a full coding-agent run for each small adjustment.
4. **Limit repository exploration.** Inspect only files needed for the current batch.
5. **Avoid repeated broad reviews.** Full architecture/repository/backlog/deployment reviews require a concrete reason.
6. **Human validation is cheap.** Manually validate simple Preview behavior first.
7. **Debug concretely.** Give AI a reproducible problem rather than asking it to discover an unspecified problem.
8. **Production is deliberate.** Production deployment is not the normal feedback loop.

## Recommended daily rhythm

1. Use/test Beanmemo and collect bugs, UX friction, ideas, and data-model questions.
2. Discuss and update the relevant Linear issues without immediately changing code.
3. Move sufficiently defined items to Todo / Ready for Dev.
4. Choose 2–4 related issues for one development batch.
5. Run lint, tests, build, and Preview validation after the batch.
6. Manually test the primary user journeys.
7. Record non-blocking findings for the next batch.
8. Merge accepted work into `main` or the designated release branch.
9. Mark the issue Done only after the merge.
10. Deploy production deliberately after the release candidate is accepted.

## Decision rule

Before starting another coding-agent run, ask:

> Does this need to be fixed now for the current feature to work or meet its acceptance criteria?

If yes, fix it in the current batch. If no, capture it in Linear and continue.

## Core operating principle

Optimize Beanmemo development for:

```text
many product observations
→ few well-defined decisions
→ few coherent development batches
→ few meaningful validations
→ stable releases
```

The goal is not to minimize AI usage. The goal is to spend AI tokens on reasoning and implementation that materially move the product forward instead of repeatedly rebuilding context and reviewing the same system.
