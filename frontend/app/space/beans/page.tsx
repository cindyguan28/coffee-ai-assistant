import { getCurrentUserId } from "../../../lib/auth/user";
import { isSupabaseConfigured } from "../../../lib/supabase/config";
import { createClient } from "../../../lib/supabase/server";
import { SubmitButton } from "../../components/submit-button";
import { addBean, deleteBean } from "./actions";

type BeansPageProps = { searchParams: Promise<{ error?: string; message?: string }> };

export const dynamic = "force-dynamic";

export default async function BeansPage({ searchParams }: BeansPageProps) {
  const params = await searchParams;
  if (!isSupabaseConfigured()) {
    return <section className="space-welcome"><h1>My Beans</h1><div className="auth-notice">Connect Supabase to save private beans.</div></section>;
  }

  const userId = await getCurrentUserId();
  const supabase = await createClient();
  const { data: beans, error } = await supabase
    .from("beans")
    .select("id,name,roaster,country,process,roast_level,flavor_notes,created_at,bean_profiles(predicted_acidity,predicted_body,predicted_sweetness,predicted_notes,recommended_method)")
    .eq("user_id", userId!)
    .order("created_at", { ascending: false });

  return (
    <section className="space-welcome beans-page">
      <p className="kicker"><span /> Your shelf</p>
      <h1>My Beans</h1>
      {params.error && <div className="auth-error" role="alert">{params.error}</div>}
      {params.message && <div className="auth-success" role="status">{params.message}</div>}
      {error ? (
        <div className="auth-notice">Apply the Supabase migration before adding coffee data.</div>
      ) : (
        <div className="beans-layout">
          <form className="bean-form" action={addBean}>
            <h2>Add a coffee</h2>
            <p>Start with its name. Every other field is optional.</p>
            <label htmlFor="name">Coffee name *</label><input id="name" name="name" required maxLength={200} />
            <label htmlFor="roaster">Roaster</label><input id="roaster" name="roaster" maxLength={200} />
            <div className="bean-form-row">
              <div><label htmlFor="country">Origin</label><input id="country" name="country" /></div>
              <div><label htmlFor="process">Process</label><input id="process" name="process" /></div>
            </div>
            <div className="bean-form-row">
              <div><label htmlFor="roast_level">Roast</label><select id="roast_level" name="roast_level"><option value="">Not sure</option><option>Light</option><option>Medium</option><option>Dark</option></select></div>
              <div><label htmlFor="price">Price</label><input id="price" name="price" type="number" min="0" step="0.01" /></div>
            </div>
            <label htmlFor="flavor_notes">Flavor notes</label><input id="flavor_notes" name="flavor_notes" placeholder="Jasmine, peach, chocolate" />
            <label htmlFor="notes">Personal notes</label><textarea id="notes" name="notes" rows={3} />
            <SubmitButton pendingLabel="Saving and generating profile…">Save bean</SubmitButton>
          </form>
          <div className="bean-list">
            <span>{beans?.length ?? 0} COFFEES</span>
            {beans?.map((bean) => {
              const profile = Array.isArray(bean.bean_profiles) ? bean.bean_profiles[0] : bean.bean_profiles;
              return (
                <article className="bean-item" key={bean.id}>
                  <div><h2>{bean.name}</h2><p>{[bean.roaster, bean.country].filter(Boolean).join(" · ") || "Your coffee"}</p></div>
                  <div className="bean-tags"><span>{bean.roast_level || "Roast unknown"}</span><span>{profile?.recommended_method || "Profile ready"}</span></div>
                  <p>{profile?.predicted_notes?.split(",").filter(Boolean).join(" · ") || bean.flavor_notes || "Add a brew to learn more."}</p>
                  <form action={deleteBean}><input type="hidden" name="beanId" value={bean.id} /><button className="bean-delete" type="submit">Remove</button></form>
                </article>
              );
            })}
            {!beans?.length && <p className="bean-empty">Your shelf is waiting for its first coffee.</p>}
          </div>
        </div>
      )}
    </section>
  );
}
