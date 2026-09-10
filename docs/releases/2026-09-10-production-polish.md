# Beanmemo v0.1.1 — Production Polish

## Release record

| Field | Value |
| --- | --- |
| Status | Production |
| Preview time | 2026-09-10 21:46:25 CEST |
| Preview deployment | `dpl_DDfT4Z3qxRjoTa4zs9EJcb8ZqkSU` |
| Preview URL | `https://coffee-ai-assistant-5u4xlk94y-cindyguan28gmailcoms-projects.vercel.app` |
| Source branch | `release/production-polish-preview` |
| Source commit | `f6811d002e4bb780122714969956a80984922f82` |
| User acceptance | Passed on 2026-09-10 |
| Production time | 2026-09-10 22:14:35 CEST |
| Production deployment | `dpl_BfmbBF1KvjtbWouAGBcnt1gPYM8m` |
| Production commit | `54949a3959863c1d18995b76676657efaed6ec74` |

## Customer-facing release notes

### A more accurate introduction

- Replaces personal placeholder content such as `Cindy` and `CG` with a generic product preview.
- Makes the landing-page My Beans and My Taste explanations match the implemented product.
- Separates the automatic Bean Preference example from the optional six-dimensional Sensory Profile.
- Removes unsupported 30-day taste claims and generated conclusions.
- Adds a Beanmemo coffee-bean browser icon.

### More trustworthy Coffee World flavors

- Renames the country detail to `Top Bean flavors` and explains that its source is flavor labels saved on Beans—not Brew Journal sensory ratings.
- Retains custom flavor labels when they do not match the small built-in flavor-family taxonomy.
- Shows `No flavor labels saved` only when the Beans genuinely contain no flavor labels.

### Stable Brew Journal on phones

- Prevents mobile browsers from zooming the page when a form field receives focus.
- Ensures every compact journal-row variant, including entries with water temperature, fits the phone viewport.
- Prevents opening and closing Add Journal Entry from changing the effective page width.

### Clear sign-out state

- Sign-out now leads to a dedicated `Signed out safely` state.
- Normal direct visits to Login continue to show `Welcome back`.
- The sign-in form remains immediately available after signing out.

## Validation

- User acceptance: passed, including sign-out, favicon, mobile sizing, repeated account login/logout, copy, Coffee World flavors, and general regression checks.
- Automated tests: 72 passed.
- ESLint: passed.
- TypeScript and production build: passed.
- GitHub CI: passed.
- Preview health: `ready`; Supabase authentication: `configured`.

## Linear traceability

- COF-30 — Coffee World flavor-source fidelity.
- COF-42 — Mobile Coffee Space and Brew Journal scale stability.
- COF-45 — Landing-page product parity and favicon.
- COF-46 — Signed-out-aware login copy.
- COF-47 — Versioned release-note and changelog policy.

## Production verification

- Accepted source merged to `main`.
- Vercel Production status: `Ready`.
- `https://beanmemo.com/api/health`: `ready`; authentication `configured` at 2026-09-10 22:15 CEST.
- Production aliases include `beanmemo.com`, `beanmemo.app`, and their `www` variants.
