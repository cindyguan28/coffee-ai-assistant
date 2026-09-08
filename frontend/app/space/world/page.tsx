import Link from "next/link";
import { CoffeeWorldMap } from "../../components/coffee-world-map";
import { getCurrentUserId } from "../../../lib/auth/user";
import { aggregateCoffeeWorld, type GeographyBean, type GeographyBrew } from "../../../lib/coffee/geography";
import { isSupabaseConfigured } from "../../../lib/supabase/config";
import { createClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CoffeeWorldPage() {
  if (!isSupabaseConfigured()) return <section className="space-welcome"><h1>Coffee World</h1><div className="auth-notice">Connect Supabase to map your private coffee history.</div></section>;
  const userId = await getCurrentUserId();
  const supabase = await createClient();
  const [beansResult, brewsResult] = await Promise.all([
    supabase.from("beans").select("id,country,flavor_notes").eq("user_id", userId!),
    supabase.from("brew_logs").select("id,bean_id,score").eq("user_id", userId!),
  ]);
  if (beansResult.error || brewsResult.error) return <section className="space-welcome"><h1>Coffee World</h1><div className="auth-notice">Apply the Supabase migration to activate your Coffee World.</div></section>;

  const summaries = aggregateCoffeeWorld(
    (beansResult.data ?? []) as GeographyBean[],
    (brewsResult.data ?? []) as GeographyBrew[],
  );

  return <section className="space-welcome world-page">
    <p className="kicker"><span /> Your coffee geography</p>
    <h1>Coffee World</h1>
    {!summaries.length ? <div className="space-first-step"><h2>Your map begins with an origin.</h2><p>Add the country when you save a coffee. Your map will grow without requiring a rating.</p><Link className="button button-primary" href="/space/beans">Add a coffee ↗</Link></div> : <CoffeeWorldMap summaries={summaries} />}
  </section>;
}
