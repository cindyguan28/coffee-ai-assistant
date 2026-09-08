import Link from "next/link";
import { getCurrentUserId } from "../../lib/auth/user";
import { isSupabaseConfigured } from "../../lib/supabase/config";
import { createClient } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CoffeeSpacePage() {
  if (!isSupabaseConfigured()) {
    return (
      <section className="space-empty">
        <p className="kicker"><span /> Cloud foundation ready</p>
        <h1>Connect Supabase<br /><em>to open your space.</em></h1>
        <p>The authentication UI, user-owned schema, and Row Level Security policies are ready. Add the values from <code>frontend/.env.example</code> to activate them.</p>
        <Link className="button button-primary" href="/login?mode=signup">View signup <span>↗</span></Link>
      </section>
    );
  }

  const userId = await getCurrentUserId();
  const supabase = await createClient();
  const [beansResult, brewsResult] = await Promise.all([
    supabase.from("beans").select("id,name,roaster,country,created_at", { count: "exact" }).eq("user_id", userId!).order("created_at", { ascending: false }).limit(3),
    supabase.from("brew_logs").select("id", { count: "exact", head: true }).eq("user_id", userId!),
  ]);
  const schemaReady = !beansResult.error && !brewsResult.error;

  return (
    <section className="space-welcome">
      <p className="kicker"><span /> Your private coffee space</p>
      <h1>Welcome home.</h1>
      {!schemaReady ? (
        <div className="auth-notice">Authentication is connected. Apply the Supabase migration to activate your coffee data.</div>
      ) : (
        <>
          <div className="space-stats">
            <div><strong>{beansResult.count ?? 0}</strong><span>beans remembered</span></div>
            <div><strong>{brewsResult.count ?? 0}</strong><span>brews logged</span></div>
          </div>
          {beansResult.data?.length ? (
            <div className="space-recent">
              <span>RECENT BEANS</span>
              {beansResult.data.map((bean) => (
                <article key={bean.id}>
                  <div><h2>{bean.name}</h2><p>{[bean.roaster, bean.country].filter(Boolean).join(" · ") || "Details can be added later"}</p></div>
                  <Link href="/space/beans">View →</Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="space-first-step">
              <span>YOUR FIRST STEP</span>
              <h2>Add the coffee that is on your shelf today.</h2>
              <p>You only need its name. We will generate a useful first profile from whatever else you know.</p>
              <Link className="button button-primary" href="/space/beans">Add my first bean <b>↗</b></Link>
            </div>
          )}
        </>
      )}
    </section>
  );
}
