import Link from "next/link";
import { isSupabaseConfigured } from "../../lib/supabase/config";
import { login, signInWithGoogle, signup } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; message?: string; mode?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const isSignup = params.mode === "signup";
  const configured = isSupabaseConfigured();

  return (
    <main className="auth-page">
      <section className="auth-story">
        <Link className="brand auth-brand" href="/">
          <span className="coffee-mark" aria-hidden="true"><span /></span>
          <span>Mylot</span>
        </Link>
        <div>
          <p className="kicker"><span /> A space that remembers</p>
          <h1>Your coffee life,<br /><em>kept close.</em></h1>
          <p>
            Your beans, brews and taste belong together — in one private place that becomes more useful every time you return.
          </p>
        </div>
        <p className="auth-privacy">Private by default · Your data stays yours</p>
      </section>

      <section className="auth-panel">
        <div className="auth-form-wrap">
          <p className="auth-step">MY COFFEE SPACE</p>
          <h2>{isSignup ? "Create your space" : "Welcome back"}</h2>
          <p className="auth-subtitle">
            {isSignup
              ? "Begin with one bean. The rest can grow slowly."
              : "Return to your beans, brews and evolving taste."}
          </p>

          {!configured && (
            <div className="auth-notice">
              Login UI is ready. Add the three Supabase environment variables in Vercel to connect it.
            </div>
          )}
          {params.error && <div className="auth-error">{params.error}</div>}
          {params.message && <div className="auth-success">{params.message}</div>}

          <form className="auth-form" action={isSignup ? signup : login}>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              placeholder="At least 8 characters"
              minLength={8}
              required
            />
            <button className="auth-submit" type="submit">
              {isSignup ? "Create my coffee space" : "Enter my coffee space"} <span>↗</span>
            </button>
          </form>

          <div className="auth-divider"><span>or</span></div>
          <form action={signInWithGoogle}>
            <button className="auth-google" type="submit">
              <b>G</b> Continue with Google
            </button>
          </form>

          <p className="auth-switch">
            {isSignup ? "Already have a space?" : "New to Mylot?"}{" "}
            <Link href={isSignup ? "/login" : "/login?mode=signup"}>
              {isSignup ? "Sign in" : "Create yours"}
            </Link>
          </p>
          <Link className="auth-back" href="/">← Back to the introduction</Link>
        </div>
      </section>
    </main>
  );
}
