# Authentication setup

Mylot uses Supabase Auth as its managed identity backend and Next.js Server Actions/Route Handlers for the application flow. Access and refresh tokens are managed in secure Supabase SSR cookies; passwords and provider secrets are never stored by this repository.

## 1. Create and configure Supabase

1. Create a Supabase project.
2. Copy the project URL and publishable key from the **Connect** dialog.
3. In **Authentication → Providers → Email**, enable email/password signup. Keep email confirmation enabled for the public release.
4. In **Authentication → URL Configuration**, set the production Site URL and add these redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://<your-vercel-domain>/auth/callback`
5. Optional: enable Google under **Authentication → Providers → Google**, then add Supabase's displayed callback URL to the Google OAuth client.

Supabase's Auth rate limits should remain enabled. Before a wider launch, enable CAPTCHA/Turnstile in Supabase and add the corresponding client token to the signup flow.

## 2. Configure local development

Copy `.env.example` to `.env.local` and replace every placeholder. `.env.local` is ignored by Git.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Run `npm run dev`, register at `/login?mode=signup`, and confirm the email before signing in.

## 3. Configure Vercel

Add the same three variables in **Project Settings → Environment Variables** for Preview and Production. Use the final production domain for `NEXT_PUBLIC_SITE_URL` in Production. Redeploy after changing variables.

## 4. Test checklist

1. Register a new email and confirm it.
2. Sign in and verify `/space` opens.
3. Sign out and verify `/space` redirects to `/login`.
4. Request a password reset, open the email link, and choose a new password.
5. If Google is enabled, create an account with Google and verify the callback returns to `/space`.
6. Verify an external `next` URL never redirects outside the Mylot domain.

## Security boundary

Authentication identifies the user. It does not by itself isolate application rows. Every user-owned table must include `user_id uuid references auth.users(id)` and enable Row Level Security policies before real coffee data is stored. That database work remains tracked in COF-23.
