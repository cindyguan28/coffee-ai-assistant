import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "../components/auth-shell";
import { SubmitButton } from "../components/submit-button";
import { isSupabaseConfigured } from "../../lib/supabase/config";
import { createClient } from "../../lib/supabase/server";
import { updatePassword } from "./actions";

type ResetPasswordPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims) redirect("/forgot-password?error=Open%20a%20valid%20reset%20link%20first.");
  }

  return (
    <AuthShell>
      <p className="auth-step">ACCOUNT RECOVERY</p>
      <h2>Choose a new password</h2>
      <p className="auth-subtitle">Use at least eight characters, including a letter and a number.</p>
      {!isSupabaseConfigured() && (
        <div className="auth-notice">Preview mode: connect Supabase to update a real account.</div>
      )}
      {params.error && <div className="auth-error" role="alert">{params.error}</div>}

      <form className="auth-form" action={updatePassword}>
        <label htmlFor="password">New password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        <label htmlFor="confirmPassword">Confirm new password</label>
        <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
        <SubmitButton pendingLabel="Updating password…">Update password</SubmitButton>
      </form>

      <Link className="auth-back" href="/login">← Back to sign in</Link>
    </AuthShell>
  );
}
