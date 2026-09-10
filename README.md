# Beanmemo

Beanmemo is a private personal coffee journal for remembering beans, recording brews, understanding your taste, and improving the next cup.

Production: [beanmemo.com](https://beanmemo.com)

## What Beanmemo does

- **My Beans** keeps a private shelf of coffees and generates an approachable Bean Profile after a Bean is saved.
- **Brew Journal** records grind settings, brew outcomes, drinks, milk details, tasting observations, and personal liking.
- **My Taste** separates automatic Bean preferences from sensory ratings the user explicitly recorded.
- **Coffee World** shows countries explored, average liking, and flavor labels from saved Beans.
- **Private accounts** use Supabase authentication and database Row Level Security so each user can access only their own coffee data.

## Production stack

- Next.js 16, React 19, and TypeScript
- Vercel hosting
- Supabase Auth and PostgreSQL
- PostgreSQL Row Level Security for user-owned data
- Vitest, ESLint, TypeScript, and Next.js production-build validation

The production frontend lives in [`frontend/`](frontend/). The previous Streamlit, SQLite, and local Ollama application is retained for reference on the `archive/streamlit-main-before-nextjs-production-2026-09-09` branch; it is not the current production application.

## Run locally

Requirements:

- Node.js 22
- A Supabase project for real authentication and private data

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Configure these values in `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

The URL and publishable key are browser-safe project configuration values. Never place a Supabase secret or service-role key in a `NEXT_PUBLIC_` variable.

Open [http://localhost:3000](http://localhost:3000).

## Database setup

Supabase migrations are stored in [`supabase/migrations/`](supabase/migrations/). Apply migrations in timestamp order to the intended environment.

Preview and Production must use separate Supabase projects or equivalent isolated data environments. Apply and verify a migration in Preview before applying it to Production. Never point a Preview deployment at the Production database.

The application currently uses:

- `auth.users` — Supabase-managed identities
- `public.user_profiles` — personal equipment and method defaults
- `public.beans` — private saved coffees
- `public.bean_profiles` — generated profiles owned through a Bean
- `public.brew_logs` — private Brew Journal entries

See [`docs/data-architecture.md`](docs/data-architecture.md) for relationships, RLS, schema boundaries, and migration policy.

## Validate changes

Run from `frontend/`:

```bash
npm test
npm run lint
npm run build
```

Authentication, ownership, migration, and cross-device changes also require the relevant hosted smoke test and a two-account isolation check.

## Repository guide

```text
frontend/              Production Next.js application
supabase/migrations/   Supabase schema and RLS migrations
docs/                  Architecture, development context, and release records
app.py                 Legacy Streamlit application retained in repository history
ai/, data/, ui/        Legacy local application modules
tests/                 Legacy Python tests and migration checks
```

## Product and development context

- [`docs/codex-context.md`](docs/codex-context.md) — current canonical product and implementation brief
- [`docs/data-architecture.md`](docs/data-architecture.md) — data ownership and schema decisions
- [`docs/releases/`](docs/releases/README.md) — versioned production release notes
- [`frontend/docs/authentication.md`](frontend/docs/authentication.md) — Supabase and authentication setup
- [`frontend/docs/public-preview.md`](frontend/docs/public-preview.md) — deployment, smoke-test, and rollback guidance

Development work should happen on focused branches linked to Linear issues, not directly on `main`. Preserve missing sensory values as missing, keep user data private by default, and avoid presenting inferred or sample information as a user's real data.
