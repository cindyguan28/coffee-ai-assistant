# Beanmemo v0.1.2 — Coffee Library & Growth Foundation

## Release record

| Field | Value |
| --- | --- |
| Status | Draft |
| Previous production release | v0.1.1 — Production Polish |
| Baseline production commit | `54949a3959863c1d18995b76676657efaed6ec74` |
| Current `main` snapshot | `cec051959fda7fa3e746a26aff1ac7469eb29ade` |
| Preview deployment | Pending |
| Production deployment | Pending |
| Production commit | Pending |
| Production time | Pending |

This note captures the customer-visible and release-relevant work completed after v0.1.1. Items already on `main` are separated from validated feature-branch work that still needs integration before this release can be marked Production.

## Customer-facing release notes

### Find and understand Beanmemo more easily

- Strengthens Beanmemo's public positioning as a personal coffee journal and taste tracker.
- Adds structured data for the public site and Coffee Journal FAQ.
- Rebuilds the landing experience around the Remember → Learn → Discover loop.
- Adds an interactive Bean → Brew → Taste → World product story that reflects the actual product more closely.
- Adds the first public Coffee Journal guide and includes it in the sitemap as the start of Beanmemo's searchable content layer.
- Keeps marketing examples generic instead of implying affiliation with real roasters, coffee products, or equipment brands.

### Support coffees with more than one origin

Validated on `codex/cof-56-multi-origin` at `60fa2a252e9e48710ac00d9cc076f347833a45df`; pending integration to `main`.

- A coffee can carry multiple origin countries instead of being forced into one country field.
- Add/Edit uses a searchable multi-select and preserves existing single-origin data.
- All selected origins remain visible after save and edit.
- Coffee World semantics distinguish exploration from preference: a multi-origin coffee can mark multiple countries as encountered without duplicating the full liking score into every origin.
- Unknown blend proportions are not guessed; known proportions remain composition metadata rather than assumed flavor contribution.

### A more useful coffee library between brews

Validated on `codex/cof-73-coffee-lifecycle` through `02d9818ad00e59b282176b2dbfeaed1c44b8233d`; pending integration to `main`.

- Adds lightweight library states that work independently of Brew Journal entries.
- Supports Favorite, Want to try, Currently have / On hand, Finished, Buy again, and Not for me / would not buy again signals.
- Active states appear directly on coffee cards instead of being visible only inside controls.
- Adds library filters and counts so users can quickly find coffees by current relationship or intent.
- Keeps lifecycle and purchase intent separate from liking and sensory ratings.
- Preserves lifecycle history and protects it with user-scoped RLS.
- Fixes a schema-compatibility regression so saved states survive legacy-column fallback reads.

### Stable Brew Journal composer on real phones

Merged to `main` in `cec051959fda7fa3e746a26aff1ac7469eb29ade` (COF-79).

- Prevents long coffee names and form controls from widening the Add Journal Entry grid beyond the device viewport.
- Keeps the composer at a stable 100% width while opening, selecting a coffee, focusing fields, and editing.
- Retains mobile-safe input sizing without disabling pinch zoom or reducing accessibility.
- Real-device validation passed before merge.

## Product and engineering foundation

- Added `docs/ai-development-token-efficiency-spec.md` to standardize scope-freezing, batch development, Preview validation, and deliberate Production releases.
- Refreshed repository/Codex context so Linear remains the source of truth for changing product scope while stable architecture stays in repo documentation.
- Established the next architecture batch as COF-74 + COF-81; these are Ready to Dev but are **not included as shipped functionality in this release note**.

## Operator actions before Production

1. Integrate the accepted COF-56 multi-origin branch into the release candidate.
2. Integrate the accepted COF-73 coffee-library branch into the release candidate.
3. Apply the COF-73 database migration `202609110003_coffee_library_states.sql` to the target Supabase environment before validating lifecycle state persistence.
4. Run the release validation suite once after the candidate is assembled: frontend tests, ESLint, TypeScript, and Next.js production build.
5. Validate the combined Preview on a real phone, including multi-origin Add/Edit, library state persistence/filtering, and Brew Journal width stability.
6. After Production deployment, replace all `Pending` fields above with immutable deployment/commit details and change status to `Production`.

## Validation evidence already completed

- COF-56: user validation passed for multi-origin behavior.
- COF-73: user validation passed after state-label and persistence fixes; branch verification reached 82 frontend tests plus lint, TypeScript and production build.
- COF-79: automated checks passed and real-device validation passed; PR #4 merged to `main`.
- SEO/landing work: dedicated SEO foundation release record reports tests, lint and production build passing and a Ready production deployment.

## Linear traceability

- COF-39 — Brand positioning, SEO and conversion strategy.
- COF-54 — First public SEO content cluster / Coffee Journal guide.
- COF-56 — Multiple origin countries.
- COF-73 — Coffee lifecycle, favorite and intent states.
- COF-79 — Brew Journal mobile composer regression.

## Not included yet

The following are planned/Ready to Dev or later work and must not be presented as shipped in v0.1.2:

- COF-74 — format-neutral Coffee Product architecture.
- COF-81 — reference profile vs user perception vs brew context.
- COF-75 — My Taste confidence/evidence layer.
- COF-72 — personalized recommendation loop.
- COF-78 — production-ready third-party sign-in.
