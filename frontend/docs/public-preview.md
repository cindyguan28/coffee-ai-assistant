# Public preview runbook

This runbook deploys the Next.js application from `release/public-preview`. The legacy Streamlit/Ollama application is not part of this deployment.

## 1. Supabase

1. Create a Supabase project in the closest region to the first testers.
2. Open **SQL Editor** and apply every file in `../../supabase/migrations/` in filename order. For an existing Preview database, apply only the newer files that have not been run yet. The current order is:
   - `202609070001_public_preview.sql` — initial private user data model and RLS.
   - `202609080002_bean_package_weight.sql` — optional Bean package size.
   - `202609090001_user_brew_setup.sql` — reusable machine and grinder defaults.
   - `202609090002_brew_water_temperature.sql` — optional per-entry brew-water temperature.
   - `202609090003_user_preferred_brew_method.sql` — usual brew method for equipment-aware Bean guidance.
   These migrations are additive/idempotent; do not import local coffee records or remove existing cloud records.
3. In **Authentication → Providers → Email**, enable public email signup and keep email confirmation enabled.
4. In **Authentication → URL Configuration**, set the Vercel Preview URL as the Site URL and allow `https://<preview-domain>/auth/callback` as a redirect URL.
5. Copy the project URL and publishable key. Never use a service-role key in the browser.

## 2. Vercel

1. Import `cindyguan28/coffee-ai-assistant` into Vercel.
2. Set **Root Directory** to `frontend` and Framework Preset to **Next.js**.
3. Deploy the `release/public-preview` branch.
4. Add these variables to the Preview environment and redeploy:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
NEXT_PUBLIC_SITE_URL=https://your-preview-domain.vercel.app
```

5. Confirm `https://<preview-domain>/api/health` returns HTTP 200 with `"status":"ready"`.

## 3. Automated verification

With the deployed URL:

```bash
SMOKE_BASE_URL=https://your-preview-domain.vercel.app npm run smoke
npm run lint
npm test
npm run build
```

The smoke test covers the landing, signup, privacy, and health routes. The account/data journey still needs the manual two-user test below because it requires confirmation emails.

## 4. Two-user acceptance test

1. Register Tester A, confirm the email, and sign in.
2. Add an Ethiopia Bean and verify its Bean Profile appears.
3. Add a Brew Log with a liking score and sensory values.
4. Verify My Taste and Coffee World update.
5. Sign out, register Tester B, and verify A's Bean and Brew Log are absent.
6. Add a different Bean as B, sign back in as A, and verify B's record is absent.
7. Request a password reset and complete it.
8. Redeploy the same commit and verify both users' records remain.

## 5. Monitoring, rollback, and recovery

Use Vercel deployment/function logs for application errors and Supabase Auth/Postgres logs for backend errors. Do not add tasting notes, passwords, tokens, or complete request payloads to logs.

To roll back, open **Vercel → Deployments**, select the last verified deployment, and choose **Promote to Production**. Application rollback does not delete Supabase data. Before any destructive schema change, create a Supabase backup and add a new forward migration; do not edit the migration already applied.
