import Link from "next/link";
import { TasteRadar } from "../../components/taste-radar";
import { getCurrentUserId } from "../../../lib/auth/user";
import { calculateAutomaticBeanPreference, calculateFlavorFamilies, calculateTasteProfile, explainTasteDimension, sensoryCoverage, type SensoryDimension, type TasteLog } from "../../../lib/coffee/taste";
import { isSupabaseConfigured } from "../../../lib/supabase/config";
import { createClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function TastePage() {
  if (!isSupabaseConfigured()) return <section className="space-welcome"><h1>My Taste</h1><div className="auth-notice">Connect Supabase to calculate your private taste profile.</div></section>;
  const userId = await getCurrentUserId();
  const supabase = await createClient();
  const { data, error } = await supabase.from("brew_logs").select("score,acidity,sweetness,bitterness,body,balance,aroma,beans(flavor_notes,bean_profiles(predicted_acidity,predicted_sweetness,predicted_body))").eq("user_id", userId!);
  if (error) return <section className="space-welcome"><h1>My Taste</h1><div className="auth-notice">Apply the Supabase migration to activate your taste profile.</div></section>;
  const logs: TasteLog[] = (data ?? []).map((row) => {
    const bean = Array.isArray(row.beans) ? row.beans[0] : row.beans;
    const beanProfiles = bean?.bean_profiles;
    const beanProfile = Array.isArray(beanProfiles) ? beanProfiles[0] : beanProfiles;
    return { score: row.score, acidity: row.acidity, sweetness: row.sweetness, bitterness: row.bitterness, body: row.body, balance: row.balance, aroma: row.aroma, flavor_notes: bean?.flavor_notes, bean_profile: beanProfile };
  });
  const profile = calculateTasteProfile(logs);
  const automatic = calculateAutomaticBeanPreference(logs);
  const families = calculateFlavorFamilies(logs).slice(0, 5);
  const hasProfile = Object.values(profile.dimensions).some((value) => value !== null);

  return <section className="space-welcome taste-page"><p className="kicker"><span /> Understand yourself</p><h1>My Taste</h1>
    {!hasProfile ? <div className="space-first-step"><h2>Your sensory radar needs your own impressions.</h2><p>Your liking scores already shape the flavor preferences below. Add a quick Acidity, Bitterness and Natural sweetness review when you want to build the radar—missing details stay missing instead of being guessed.</p><Link className="button button-primary" href="/space/brews">Add quick taste ↗</Link></div> :
      <div className="taste-layout"><TasteRadar values={profile.dimensions} /><div className="taste-summary"><span>YOUR SENSORY PROFILE · {sensoryCoverage(profile.contributingBrews)} COVERAGE</span><h2>{profile.contributingBrews} explicit sensory {profile.contributingBrews === 1 ? "review shapes" : "reviews shape"} this view.</h2><p>This is not another liking score. It summarizes the sensory character of cups you enjoyed: higher-liked cups influence the result more, while scores of five or below do not define your preference.</p><div className="taste-example"><b>For example: Acidity 3/5</b><p>means the cups you enjoy have medium perceived brightness. It does not mean the coffee is only “3 out of 5 good.”</p></div><div className="dimension-list">{Object.entries(profile.dimensions).map(([dimension, value]) => <div key={dimension}><span><b>{dimension === "sweetness" ? "Natural sweetness" : dimension}</b><small>{explainTasteDimension(dimension as SensoryDimension, value)}</small></span><strong>{value === null ? "—" : `${value} / 5`}</strong></div>)}</div><details className="taste-method"><summary>How is this calculated?</summary><p>For every journal entry above 5/10, weight = liking score − 5. Each dimension is the weighted average of your own explicit 1–5 ratings. Missing ratings stay empty and are never replaced with a midpoint.</p></details></div></div>
    }
    {automatic.contributingBrews > 0 && <section className="automatic-preference"><span>AUTOMATIC BEAN PREFERENCE</span><div><h2>What the Beans you enjoy have in common.</h2><p>Based on generated Bean Profiles and your liking—not on sensory answers. Only dimensions available in the Bean Profile are shown.</p></div><dl>{[
      ["Acidity", automatic.dimensions.acidity], ["Natural sweetness", automatic.dimensions.sweetness], ["Body", automatic.dimensions.body],
    ].map(([label, value]) => <div key={String(label)}><dt>{label}</dt><dd>{value === null ? "—" : `${value} / 5`}</dd><progress max="5" value={Number(value ?? 0)} /></div>)}</dl><small>Based on {automatic.contributingBrews} liked {automatic.contributingBrews === 1 ? "brew" : "brews"} with a Bean Profile.</small></section>}
    <div className="flavor-families"><span>FLAVORS IN COFFEES YOU ENJOY</span>{families.length ? <div>{families.map((family) => <article key={family.family}><h3>{family.family}</h3><p>{family.brewCount} contributing {family.brewCount === 1 ? "brew" : "brews"}</p></article>)}</div> : <p>Add flavor notes to your Beans and a liking score above five to see preferred families.</p>}</div>
  </section>;
}
