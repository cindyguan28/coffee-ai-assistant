# Beanmemo v0.1.0 — Next.js Public Beta

## Release record

| Field | Value |
| --- | --- |
| Status | Production |
| Production time | 2026-09-09 22:55:13 CEST |
| Production deployment | `dpl_Fsf66CU2mHx9GGixmptNBUFoQ9xf` |
| Production commit | `31579ca539189d2091782e8c2d8d7b91bbd4b2e0` |
| Primary domain | `https://beanmemo.com` |
| Previous product | Streamlit prototype, preserved on `archive/streamlit-main-before-nextjs-production-2026-09-09` |

## Customer-facing release notes

Beanmemo is now a private, account-based coffee space available as a standalone web product.

### A private Coffee Space

- Public signup, email confirmation, password login, Google login, password recovery, and sign-out.
- Cross-device email confirmation and safeguards against one browser session opening another account's Coffee Space.
- User-owned Beans and Brew Journal records stored in Supabase and protected with Row Level Security.
- A private overview connecting My Beans, Brew Journal, My Taste, and Coffee World.

### My Beans

- Save coffees with guided or custom roaster, origin, roast, flavor, price, package weight, and supporting details.
- Search common flavor labels while retaining custom notes.
- Automatically generate a compact Bean Profile after saving: Roast, Intensity, Acidity, and main flavors.
- Edit and remove Beans without losing previously saved values.
- Consumer-friendly summaries keep advanced information available without making the collection difficult to scan.

### Brew Journal

- Record the Bean, date, grind setting, and personal liking for every cup.
- Save default machine, grinder, and usual brew method once instead of repeating equipment on every entry.
- Capture drink type, milk type, milk amount, and milk pairing when relevant.
- Show dose, actual yield, extraction time, and water temperature only for methods where they are useful.
- Add quick taste results, problem tags, next-time adjustments, notes, and optional sensory ratings.
- Reuse controllable settings from a previous brew without copying observed results as targets.
- Search entries and group history by Bean, date, or all entries; expand a compact row for the full record.
- Edit records without clearing previously saved Bean, drink, taste, problem, or next-step information.

### My Taste

- A six-dimensional Sensory Profile covering Acidity, Natural sweetness, Bitterness, Body, Balance, and Aroma.
- Ratings are based only on sensations the user explicitly recorded; missing values remain missing.
- Personal liking weights the profile, with brews rated above 5/10 contributing more strongly.
- Coverage labels explain whether the profile is Early, Growing, or Established.
- A separate Automatic Bean Preference uses generated Bean Profiles plus liking to summarize Acidity, Natural sweetness, and Body.
- Flavor-family preferences summarize labels from coffees the user enjoyed without pretending they are sensory ratings.

### Coffee World

- Country-level map built from the signed-in user's saved Beans and Brew Journal.
- Exploration view shows where coffees came from without requiring a rating.
- Preference view shows average personal liking while keeping unrated countries neutral.
- Country details include saved coffees, brewed coffees, journal entries, scored entries, and top flavor families.
- Sparse processing-method data is intentionally excluded.

### Mobile and product presentation

- Persistent mobile navigation connects Home, Beans, Journal, Taste, and World.
- Add Bean collapses when a collection already exists, keeping saved Beans visible first.
- Responsive Bean cards, journal history, taste profile, and Coffee World layouts.
- Beanmemo brand, custom domains, metadata, privacy page, health endpoint, and deployment verification.

## Platform and data foundation

- Next.js frontend hosted on Vercel.
- Supabase authentication and PostgreSQL persistence.
- Additive migrations for Beans, generated profiles, Brew Logs, equipment defaults, water temperature, preferred method, milk pairing, and Row Level Security.
- SQLite export and Supabase import tooling for migrating the owner's prototype data.
- CI verifies frontend tests, lint, TypeScript, and production build.

## Important product boundaries

- My Taste is dynamically calculated; there is no materialized user taste-profile table.
- Coffee World is country-level and does not geocode regions, farms, or GPS coordinates.
- The public coffee-product discovery catalog is not included yet.
- Personal data is private by default; community publishing is not included yet.

## Linear traceability

Primary work: COF-19, COF-23, COF-24, COF-26 through COF-44, plus the earlier Radar and Coffee World work under COF-6, COF-11, and COF-12.

Release-management policy is tracked in COF-47.

