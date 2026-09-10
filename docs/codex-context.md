# Beanmemo — Codex Project Context

Last updated: 2026-09-10

Production: [beanmemo.com](https://beanmemo.com)

Repository: `cindyguan28/coffee-ai-assistant`

This is the canonical working brief for Codex. Read it before planning or implementing product work. Detailed database rules live in [`data-architecture.md`](data-architecture.md), and shipped changes are recorded in [`releases/`](releases/README.md).

## Product

Beanmemo is a private personal coffee journal. It helps people remember beans, record brews, understand their own taste, and improve the next cup.

Public-facing language should lead with those user outcomes rather than AI, infrastructure, or professional tasting terminology. The product is designed for ordinary coffee drinkers as well as enthusiasts, so advanced detail should be available without dominating the primary journey.

Current product areas:

- **My Beans** — a private shelf of coffees and automatically generated Bean Profiles.
- **Brew Journal** — repeatable brew records grouped by Bean.
- **My Taste** — personal preference and explicitly recorded sensory patterns.
- **Coffee World** — countries explored and country-level preference summaries.

## Current production state

- The production application is the Next.js app in [`frontend/`](../frontend/).
- It is hosted on Vercel and uses Supabase Auth and PostgreSQL.
- `main` is the production source branch.
- Production release `v0.1.1` was accepted and deployed on 2026-09-10 from commit `54949a3`.
- Canonical domain: `https://beanmemo.com`.
- `www.beanmemo.com`, `beanmemo.app`, and `www.beanmemo.app` redirect to the canonical domain.
- The previous Streamlit/SQLite/Ollama application is retained for reference on `archive/streamlit-main-before-nextjs-production-2026-09-09`; it is not the production frontend.
- The historical Radar and Map release branches remain in Git, but their work has already been integrated. COF-11 and COF-12 are complete.

## Technology and environments

### Production application

- Next.js 16 / React 19 / TypeScript
- Vercel hosting and deployment
- Supabase Auth with email/password, confirmation, Google OAuth, recovery, and server-validated sessions
- Supabase PostgreSQL with Row Level Security
- `@visx/geo`, `topojson-client`, and `world-atlas` for Coffee World
- Vitest, ESLint, TypeScript, and the Next.js production build for validation

### Environment separation

- Local development uses the Next.js frontend with configured Supabase environment variables.
- Preview deployments must use Preview-scoped configuration and test data.
- Production deployments use Production-scoped configuration and the production Supabase project.
- Do not point Preview deployments at Production data.
- AWS is not part of the current request path. It may be introduced later for Python enrichment or background jobs only when needed.
- Local Ollama is not a production dependency.

## Data ownership and schema

The current application uses one Supabase PostgreSQL database per environment, not one database per feature or user.

```text
auth.users
    ├── 1 user_profiles
    ├── * beans
    │      └── 0..1 bean_profiles
    └── * brew_logs ─── 0..1 beans
```

- `auth.users` is managed by Supabase Auth.
- `user_profiles` stores user-level defaults such as usual machine, grinder, and brew method.
- `beans` stores private user-owned coffee records.
- `bean_profiles` stores the generated reference profile for a Bean and inherits ownership through that Bean.
- `brew_logs` stores private brew settings, outcomes, tasting observations, and liking.
- RLS is the security boundary. Every user must be unable to read or modify another user's data.
- My Taste and Coffee World are derived dynamically; do not create persisted aggregate profile tables without a demonstrated need.
- Schema changes must be additive, forward migrations. Never edit a migration that may already have been applied.

## Core product behavior

### My Beans and Bean Profiles

- A user can create, edit, and remove a Bean.
- Guided inputs should retain useful predefined choices while still allowing custom values.
- Editing must preserve every previously stored value unless the user explicitly changes or clears it.
- Saving a new Bean must also generate its Bean Profile. Profile failure must not roll back the saved Bean; the UI must offer a retry.
- The primary consumer summary is **Roast, Intensity, Acidity, and key flavors**. Body and sweetness may remain supporting details rather than mandatory inputs.
- Preparation guidance must respect the user's equipment and method. Do not show generic V60, ratio, or water-temperature advice to an espresso-machine user.

### Brew Journal

- The product name is **Brew Journal**, not Brew Logs or Blocks in user-facing navigation.
- The compact history is grouped by Bean and ordered so the Bean with the newest entry appears first.
- The entry composer opens on demand instead of permanently consuming most of the page.
- Core capture includes Bean, date, grind setting, and liking. Grind setting is required for the current workflow.
- Machine, grinder, and usual method can be stored once as equipment defaults.
- Dose is a controllable setting where method-relevant; yield and extraction time are actual observed outcomes.
- Drink types and milk details appear only when relevant. Milk type, amount, and pairing are supported for milk drinks.
- Water temperature appears for manual methods where it is useful, not for automatic or espresso-machine workflows by default.
- Quick sensory capture starts with the intuitive dimensions Acidity, Bitterness, and Natural sweetness. Body, Balance, and Aroma are additional detail.
- Missing sensory ratings must remain null. Never turn an untouched control into a fabricated midpoint value.
- Editing an entry must preserve Bean, drink, quick taste, problem tags, next-time action, equipment, and all other stored values.
- History should not repeat unchanged equipment context or empty fields.

### My Taste

My Taste deliberately separates two sources of evidence:

1. **Automatic Bean Preference** uses Bean Profile information, flavor labels, and the user's liking score. It can grow even when the user records only liking.
2. **Sensory Profile** uses only dimensions the user explicitly rated in the Brew Journal.

For an eligible liked brew, the initial sensory weight is:

```text
weight = max(liking_score - 5, 0)
```

Each displayed dimension is its weighted mean across non-null explicit ratings. A value such as `Acidity 3/5` describes the perceived character of enjoyed cups; it is not a quality score. Show sample size and coverage, handle zero-weight histories, and never infer missing sensory values.

The six supported sensory dimensions remain Acidity, Sweetness, Bitterness, Body, Balance, and Aroma. Use **Body** as the domain name and explain it with approachable mouthfeel language. Use **Balance** as the name and provide explanatory choices where a slider alone would be unclear.

### Coffee World

- Coffee World is a country-level view; region, farm GPS, and geocoding are out of scope.
- It derives country coverage from saved Beans and preference information from Brew Journal liking.
- Countries with no data must be distinct from countries with low scores.
- `Top Bean flavors` comes from flavor labels stored on the user's Beans, not from Brew Journal sensory ratings.
- Preserve custom flavor labels even when they do not match the built-in flavor-family taxonomy.
- Process is not a headline country metric because the user's current records contain too little process data.
- Exploration copy and preference copy must explain different things and must not repeat the same sentence.

### Authentication and mobile behavior

- Signup is public; every account creates a private Coffee Space, not a public profile.
- Email confirmation must work across devices without attaching the new confirmation to an existing browser session.
- Login, logout, repeated account switching, Google OAuth, and password recovery must use safe callback paths.
- Signed-out confirmation copy is distinct from the normal `Welcome back` login state.
- Mobile users must be able to navigate among My Beans, Brew Journal, My Taste, and Coffee World.
- Forms and journal rows must remain at the phone viewport width when fields receive focus or sections open and close.

## Brand, copy, and release discipline

- Brand name: **Beanmemo**.
- Descriptor: a private personal coffee journal / private coffee space.
- Do not include founder-specific sample names or initials in public product previews.
- Landing-page examples must clearly identify illustrative data and must match implemented calculations and fields.
- Avoid unsupported recommendations, invented insights, or claims such as a recent trend when the product does not calculate one.
- Keep canonical metadata, sitemap, robots directives, and public copy aligned with `beanmemo.com`.
- Record each accepted production change in a dated file under [`docs/releases/`](releases/README.md).
- A release note must state source commit, deployment, validation, user-visible changes, and related Linear issues.

## Current Linear status

Completed release foundations include COF-11, COF-12, COF-23, COF-25, COF-27, COF-30, COF-42, COF-45, COF-46, and COF-47. The remaining intentional product backlog is:

- **COF-7** — add useful Radar hover/focus interaction and dimension explanations.
- **COF-9** — build a complete Profile/Settings experience on top of the existing `user_profiles` data.
- **COF-10** — integrate the coffee assistant into the website; scope and production architecture still need definition.
- **COF-20** — Coffee Product Discovery and incremental shared Catalog.
- **COF-39** — continue brand positioning, SEO, conversion measurement, content/distribution strategy, and formal trademark work. Beanmemo naming, domains, and initial technical SEO are already delivered.

When COF-20 begins, keep the shared Catalog separate from private `beans` records and preserve source/license provenance. Prefer local Catalog matches, then licensed/open sources, then official roaster sources, with retailer data only as a compliant fallback. Never bulk-copy retailer descriptions, HTML, reviews, or unlicensed images.

## Development workflow

- Do not develop directly on `main`.
- Use a focused branch for each Linear item; new Codex-created branches use the `codex/` prefix unless an established issue branch is more appropriate.
- Do not combine unrelated product work in one branch.
- Preserve user changes already present in the working tree.
- Link commits and release notes to their Linear issue.
- Before merging frontend changes, run from [`frontend/`](../frontend/):

```bash
npm test
npm run lint
npm run build
```

- For authentication, ownership, migrations, or cross-device behavior, also run the relevant hosted smoke test and manual two-account/RLS check.
- Deployment is not complete until the target Vercel deployment is Ready and the production or preview user journey has been verified.

## Near-term priority

1. Keep production stable and close delivered Linear items after verifying their acceptance evidence.
2. Add the missing Profile/Settings experience (COF-9), especially reusable personal equipment and account preferences.
3. Define and implement the smallest useful first phase of Product Discovery (COF-20) without premature bulk ingestion.
4. Continue measurable brand/conversion work under COF-39.
5. Treat Radar hover and the embedded assistant as secondary enhancements unless user evidence raises their priority.
