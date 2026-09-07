import Link from "next/link";
import { AuthShell } from "../components/auth-shell";
import { SubmitButton } from "../components/submit-button";
import { isSupabaseConfigured } from "../../lib/supabase/config";
import { requestPasswordReset } from "./actions";

type ForgotPasswordPageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = await searchParams;

  return (
    <AuthShell>
      <p className="auth-step">ACCOUNT RECOVERY</p>
      <h2>Reset your password</h2>
      <p className="auth-subtitle">
        Enter your account email and we will send a secure link to choose a new password.
      </p>
      {!isSupabaseConfigured() && (
        <div className="auth-notice">Preview mode: connect Supabase to send reset emails.</div>
      )}
      {params.error && <div className="auth-error" role="alert">{params.error}</div>}
      {params.message && <div className="auth-success" role="status">{params.message}</div>}

      <form className="auth-form" action={requestPasswordReset}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        <SubmitButton pendingLabel="Sending reset link…">Send reset link</SubmitButton>
      </form>

      <Link className="auth-back" href="/login">← Back to sign in</Link>
    </AuthShell>
  );
}
