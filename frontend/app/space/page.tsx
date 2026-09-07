import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "../../lib/supabase/config";
import { createClient } from "../../lib/supabase/server";
import { logout } from "./actions";

export const dynamic = "force-dynamic";

export default async function CoffeeSpacePage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="space-page">
        <nav className="space-nav">
          <Link className="brand" href="/"><span className="coffee-mark" aria-hidden="true"><span /></span><span>Mylot</span></Link>
        </nav>
        <section className="space-empty">
          <p className="kicker"><span /> Login foundation ready</p>
          <h1>Connect Supabase<br /><em>to open your space.</em></h1>
          <p>Add the values from <code>frontend/.env.example</code> locally and in Vercel. Then this route will require a real signed-in session.</p>
          <Link className="button button-primary" href="/login">View login page <span>↗</span></Link>
        </section>
      </main>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  const email = typeof data.claims.email === "string" ? data.claims.email : "Coffee lover";

  return (
    <main className="space-page">
      <nav className="space-nav">
        <Link className="brand" href="/"><span className="coffee-mark" aria-hidden="true"><span /></span><span>Mylot</span></Link>
        <form action={logout}><button className="space-logout" type="submit">Sign out</button></form>
      </nav>
      <section className="space-welcome">
        <p className="kicker"><span /> Your private coffee space</p>
        <h1>Welcome home.</h1>
        <p>Signed in as {email}</p>
        <div className="space-first-step">
          <span>YOUR FIRST STEP</span>
          <h2>Add the coffee that is on your shelf today.</h2>
          <p>You only need its name. We will help with the rest.</p>
          <button type="button">Add my first bean <b>↗</b></button>
        </div>
      </section>
    </main>
  );
}
