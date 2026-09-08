import Link from "next/link";
import { TasteRadar } from "../../components/taste-radar";
import { getCurrentUserId } from "../../../lib/auth/user";
import { calculateFlavorFamilies, calculateTasteProfile, type TasteLog } from "../../../lib/coffee/taste";
import { isSupabaseConfigured } from "../../../lib/supabase/config";
import { createClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function TastePage() {
  if (!isSupabaseConfigured()) return <section className="space-welcome"><h1>My Taste</h1><div className="auth-notice">Connect Supabase to calculate your private taste profile.</div></section>;
  const userId = await getCurrentUserId();
  const supabase = await createClient();
  const { data, error } = await supabase.from("brew_logs").select("score,acidity,sweetness,bitterness,body,balance,aroma,beans(flavor_notes)").eq("user_id", userId!);
  if (error) return <section className="space-welcome"><h1>My Taste</h1><div className="auth-notice">Apply the Supabase migration to activate your taste profile.</div></section>;
  const logs: TasteLog[] = (data ?? []).map((row) => {
    const bean = Array.isArray(row.beans) ? row.beans[0] : row.beans;
    return { score: row.score, acidity: row.acidity, sweetness: row.sweetness, bitterness: row.bitterness, body: row.body, balance: row.balance, aroma: row.aroma, flavor_notes: bean?.flavor_notes };
  });
  const profile = calculateTasteProfile(logs);
  const families = calculateFlavorFamilies(logs).slice(0, 5);
  const hasProfile = Object.values(profile.dimensions).some((value) => value !== null);

  return <section className="space-welcome taste-page"><p className="kicker"><span /> Understand yourself</p><h1>My Taste</h1>
    {!hasProfile ? <div className="space-first-step"><h2>Your taste appears through the cups you enjoy.</h2><p>Add sensory ratings and a liking score above five to your Brew Journal. Missing details stay missing instead of being guessed.</p><Link className="button button-primary" href="/space/brews">Add journal entry ↗</Link></div> : <>
      <div className="taste-layout"><TasteRadar values={profile.dimensions} /><div className="taste-summary"><span>LIKING-WEIGHTED PROFILE</span><h2>{profile.contributingBrews} brews shape this view.</h2><p>Higher-liked brews influence the profile more strongly. Scores of five or below do not define your preference.</p><div className="dimension-list">{Object.entries(profile.dimensions).map(([dimension, value]) => <div key={dimension}><span>{dimension}</span><b>{value === null ? "Not enough data" : `${value} / 5`}</b></div>)}</div></div></div>
      <div className="flavor-families"><span>FLAVORS IN COFFEES YOU ENJOY</span>{families.length ? <div>{families.map((family) => <article key={family.family}><h3>{family.family}</h3><p>{family.brewCount} contributing {family.brewCount === 1 ? "brew" : "brews"}</p></article>)}</div> : <p>Add flavor notes to your Beans to see preferred families.</p>}</div>
    </>}
  </section>;
}
