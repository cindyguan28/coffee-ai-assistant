# Mylot Next.js frontend

## Local development

Use Node.js 22.12 or newer.

```bash
npm install
cp .env.example .env.local
npm run dev
```

The landing page and authentication UI remain available in preview mode without Supabase. Real account creation and sessions become active after these values are set:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Find the URL and publishable key in the Supabase project **Connect** dialog. Never put a secret or service-role key in a `NEXT_PUBLIC_` variable.

## Authentication model

- Signup is public so anyone can create an account.
- Email confirmation can be required in Supabase.
- Email/password login, Google OAuth, password recovery, password update, and logout are implemented.
- `/space` is private and validates the session on the server.
- Account creation does not publish personal data. Database Row Level Security is tracked separately in COF-23.

See [docs/authentication.md](docs/authentication.md) for Supabase and Vercel configuration.

## Routes

- `/` — public landing page
- `/login` — sign in
- `/login?mode=signup` — create an account
- `/forgot-password` — request a recovery email
- `/reset-password` — choose a new password after opening a valid recovery link
- `/auth/callback` — OAuth, email confirmation, and recovery callback
- `/space` — protected personal coffee space
- `/space/beans` — private Bean library and generated profiles
- `/space/brews` — private Brew Log CRUD
- `/space/taste` — liking-weighted personal taste radar
- `/space/world` — personal exploration and preference map
- `/privacy` — public-preview privacy information

## Verification

```bash
npm run lint
npm test
npm run build
```

For Preview deployment, environment setup, two-user isolation testing, and rollback, see [docs/public-preview.md](docs/public-preview.md).
