import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
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
        <p className="auth-privacy">Public signup · Personal data private by default</p>
      </section>

      <section className="auth-panel">
        <div className="auth-form-wrap">{children}</div>
      </section>
    </main>
  );
}
