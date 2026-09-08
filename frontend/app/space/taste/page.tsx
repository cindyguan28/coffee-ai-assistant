import Link from "next/link";
import { TasteRadar } from "../../components/taste-radar";
import { getCurrentUserId } from "../../../lib/auth/user";
import { calculateFlavorFamilies, calculateTasteProfile, explainTasteDimension, type SensoryDimension, type TasteLog } from "../../../lib/coffee/taste";
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
    {!hasProfile ? <div className="space-first-step"><h2>Your taste appears through the cups you enjoy.</h2><p>Log sensory ratings and a liking score above five. Missing details stay missing instead of being guessed.</p><Link className="button button-primary" href="/space/brews">Log a brew ↗</Link></div> : <>
      <div className="taste-layout"><TasteRadar values={profile.dimensions} /><div className="taste-summary"><span>LIKING-WEIGHTED PROFILE</span><h2>{profile.contributingBrews} {profile.contributingBrews === 1 ? "brew shapes" : "brews shape"} this view.</h2><p>This is not another liking score. It summarizes the sensory character of cups you enjoyed: higher-liked cups influence the result more, while scores of five or below do not define your preference.</p><div className="taste-example"><b>For example: Acidity 3/5</b><p>means the cups you enjoy have medium perceived brightness. It does not mean the coffee is only “3 out of 5 good.”</p></div><div className="dimension-list">{Object.entries(profile.dimensions).map(([dimension, value]) => <div key={dimension}><span><b>{dimension}</b><small>{explainTasteDimension(dimension as SensoryDimension, value)}</small></span><strong>{value === null ? "—" : `${value} / 5`}</strong></div>)}</div><details className="taste-method"><summary>How is this calculated?</summary><p>For every journal entry above 5/10, weight = liking score − 5. Each dimension is the weighted average of your own 1–5 ratings. Missing ratings are ignored, never guessed.</p></details></div></div>
      <div className="flavor-families"><span>FLAVORS IN COFFEES YOU ENJOY</span>{families.length ? <div>{families.map((family) => <article key={family.family}><h3>{family.family}</h3><p>{family.brewCount} contributing {family.brewCount === 1 ? "brew" : "brews"}</p></article>)}</div> : <p>Add flavor notes to your Beans to see preferred families.</p>}</div>
    </>}
  </section>;
}
