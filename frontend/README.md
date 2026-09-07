# Mylot Next.js frontend

## Local development

Use Node.js 22 or newer.

```bash
npm install
cp .env.example .env.local
npm run dev
```

The landing page remains available without Supabase configuration. Authentication becomes active after these public values are set:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Find the URL and publishable key in the Supabase project **Connect** dialog. Do not put a service-role or secret key in a `NEXT_PUBLIC_` variable.

## Supabase Auth settings

In **Authentication → URL Configuration**:

- Set the Site URL to the deployed Vercel URL.
- Add `http://localhost:3000/auth/callback` for local development.
- Add `https://<your-vercel-domain>/auth/callback` for the deployed site.

Email/password authentication works after the public environment variables are present. To enable the Google button, also configure the Google provider under **Authentication → Providers**.

## Routes

- `/` — public landing page
- `/login` — sign in
- `/login?mode=signup` — create an account
- `/auth/callback` — PKCE/OAuth and email confirmation callback
- `/space` — protected personal coffee space

## Verification

```bash
npm run lint
npm run build
```
