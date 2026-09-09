import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "../components/auth-shell";
import { SubmitButton } from "../components/submit-button";
import { safeRedirectPath } from "../../lib/auth/validation";
import { isSupabaseConfigured } from "../../lib/supabase/config";
import { createClient } from "../../lib/supabase/server";
import { login, signInWithGoogle, signup } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; message?: string; mode?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const isSignup = params.mode === "signup";
  const configured = isSupabaseConfigured();
  const next = safeRedirectPath(params.next);

  if (configured) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (data?.claims && !isSignup) redirect(next);
  }

  return (
    <AuthShell>
      <p className="auth-step">MY COFFEE SPACE</p>
      <h2>{isSignup ? "Create your space" : "Welcome back"}</h2>
      <p className="auth-subtitle">
        {isSignup
          ? "Create a private home for your beans, brews and evolving taste."
          : "Return to your beans, brews and evolving taste."}
      </p>

      {!configured && (
        <div className="auth-notice">
          Preview mode: connect the Supabase environment variables to activate authentication.
        </div>
      )}
      {params.error && <div className="auth-error" role="alert">{params.error}</div>}
      {params.message && <div className="auth-success" role="status">{params.message}</div>}
      {configured && isSignup && (
        <div className="auth-notice">
          Creating a new account signs out any account currently open in this browser.
        </div>
      )}

      <form className="auth-form" action={isSignup ? signup : login}>
        <input name="next" type="hidden" value={next} />
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          placeholder={isSignup ? "8+ characters, with a letter and number" : "Your password"}
          minLength={8}
          required
        />
        {isSignup && (
          <>
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Enter the password again"
              minLength={8}
              required
            />
          </>
        )}
        {!isSignup && (
          <Link className="auth-forgot" href="/forgot-password">Forgot password?</Link>
        )}
        <SubmitButton pendingLabel={isSignup ? "Creating your space…" : "Signing in…"}>
          {isSignup ? "Create my coffee space" : "Enter my coffee space"}
        </SubmitButton>
      </form>

      <div className="auth-divider"><span>or</span></div>
      <form action={signInWithGoogle}>
        <input name="next" type="hidden" value={next} />
        <button className="auth-google" type="submit">
          <b>G</b> Continue with Google
        </button>
      </form>

      <p className="auth-switch">
        {isSignup ? "Already have a space?" : "New to Beanmemo?"}{" "}
        <Link href={isSignup ? `/login?next=${encodeURIComponent(next)}` : `/login?mode=signup&next=${encodeURIComponent(next)}`}>
          {isSignup ? "Sign in" : "Create yours"}
        </Link>
      </p>
      <p className="auth-legal">
        By continuing, you create a private account. Nothing is published to the community without your action. <Link href="/privacy">Read the preview privacy note.</Link>
      </p>
      <Link className="auth-back" href="/">← Back to the introduction</Link>
    </AuthShell>
  );
}
