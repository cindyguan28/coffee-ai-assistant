import Link from "next/link";
import { getCurrentUserId } from "../../../lib/auth/user";
import {
  ACIDITY_OPTIONS,
  BODY_OPTIONS,
  COUNTRY_OPTIONS,
  FLAVOR_OPTIONS,
  MILK_COMPATIBILITY_OPTIONS,
  PROCESS_OPTIONS,
  ROASTER_OPTIONS,
  ROAST_LEVEL_OPTIONS,
  SWEETNESS_OPTIONS,
} from "../../../lib/coffee/options";
import { isSupabaseConfigured } from "../../../lib/supabase/config";
import { createClient } from "../../../lib/supabase/server";
import { SubmitButton } from "../../components/submit-button";
import { addBean, deleteBean, updateBean } from "./actions";

type BeansPageProps = { searchParams: Promise<{ edit?: string; error?: string; message?: string }> };

type Bean = {
  id: string;
  name: string;
  roaster: string | null;
  country: string | null;
  process: string | null;
  roast_level: string | null;
  price: number | null;
  package_weight_g: number | null;
  weblink: string | null;
  flavor_notes: string | null;
  acidity: string | null;
  body: string | null;
  sweetness: string | null;
  milk_compatibility: string | null;
  notes: string | null;
  created_at: string;
  bean_profiles: {
    predicted_acidity: string | null;
    predicted_body: string | null;
    predicted_sweetness: string | null;
    predicted_notes: string | null;
    recommended_method: string | null;
  } | Array<{
    predicted_acidity: string | null;
    predicted_body: string | null;
    predicted_sweetness: string | null;
    predicted_notes: string | null;
    recommended_method: string | null;
  }> | null;
};

export const dynamic = "force-dynamic";

function mergeOptions(base: readonly string[], saved: Array<string | null>) {
  const options = [...base, ...saved.filter((value): value is string => Boolean(value))];
  return [...new Map(options.map((value) => [value.toLowerCase(), value])).values()];
}

function selectedFlavors(bean?: Bean) {
  return new Set((bean?.flavor_notes ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean));
}

function beanProfile(bean: Bean) {
  return Array.isArray(bean.bean_profiles) ? bean.bean_profiles[0] : bean.bean_profiles;
}

function missingPackageWeight(error: { code?: string; message?: string } | null) {
  return Boolean(error && (error.code === "42703" || error.code === "PGRST204" || error.message?.includes("package_weight_g")));
}

export default async function BeansPage({ searchParams }: BeansPageProps) {
  const params = await searchParams;
  if (!isSupabaseConfigured()) {
    return <section className="space-welcome"><h1>My Beans</h1><div className="auth-notice">Connect Supabase to save private beans.</div></section>;
  }

  const userId = await getCurrentUserId();
  const supabase = await createClient();
  const withPackageWeight = await supabase
    .from("beans")
    .select("id,name,roaster,country,process,roast_level,price,package_weight_g,weblink,flavor_notes,acidity,body,sweetness,milk_compatibility,notes,created_at,bean_profiles(predicted_acidity,predicted_body,predicted_sweetness,predicted_notes,recommended_method)")
    .eq("user_id", userId!)
    .order("created_at", { ascending: false });
  const legacy = missingPackageWeight(withPackageWeight.error)
    ? await supabase
      .from("beans")
      .select("id,name,roaster,country,process,roast_level,price,weblink,flavor_notes,acidity,body,sweetness,milk_compatibility,notes,created_at,bean_profiles(predicted_acidity,predicted_body,predicted_sweetness,predicted_notes,recommended_method)")
      .eq("user_id", userId!)
      .order("created_at", { ascending: false })
    : null;
  const error = legacy ? legacy.error : withPackageWeight.error;
  const beans = (legacy
    ? (legacy.data ?? []).map((bean) => ({ ...bean, package_weight_g: null }))
    : (withPackageWeight.data ?? [])) as Bean[];
  const editingBean = beans.find((bean) => bean.id === params.edit);
  const flavors = selectedFlavors(editingBean);
  const customFlavors = (editingBean?.flavor_notes ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value && !FLAVOR_OPTIONS.some((option) => option.toLowerCase() === value.toLowerCase()))
    .join(", ");

  const roasters = mergeOptions(ROASTER_OPTIONS, beans.map((bean) => bean.roaster));
  const countries = mergeOptions(COUNTRY_OPTIONS, beans.map((bean) => bean.country));
  const processes = mergeOptions(PROCESS_OPTIONS, beans.map((bean) => bean.process));

  return (
    <section className="space-welcome beans-page">
      <p className="kicker"><span /> Your shelf</p>
      <h1>My Beans</h1>
      {params.error && <div className="auth-error" role="alert">{params.error}</div>}
      {params.message && <div className="auth-success" role="status">{params.message}</div>}
      {error ? (
        <div className="auth-notice">Apply the latest Supabase migration before adding coffee data.</div>
      ) : (
        <div className="beans-layout">
          <form className="bean-form" action={editingBean ? updateBean : addBean}>
            <h2>{editingBean ? `Edit ${editingBean.name}` : "Add a coffee"}</h2>
            <p>Choose a suggestion or type your own. Only the coffee name is required.</p>
            {editingBean && <input type="hidden" name="beanId" value={editingBean.id} />}

            <label htmlFor="name">Coffee name *</label>
            <input id="name" name="name" required maxLength={200} defaultValue={editingBean?.name ?? ""} />

            <label htmlFor="roaster">Roaster</label>
            <input id="roaster" name="roaster" list="roaster-options" maxLength={200} defaultValue={editingBean?.roaster ?? ""} placeholder="Choose or add a roaster" />
            <datalist id="roaster-options">{roasters.map((option) => <option key={option} value={option} />)}</datalist>

            <div className="bean-form-row">
              <div>
                <label htmlFor="country">Origin</label>
                <input id="country" name="country" list="country-options" defaultValue={editingBean?.country ?? ""} placeholder="Choose or add an origin" />
                <datalist id="country-options">{countries.map((option) => <option key={option} value={option} />)}</datalist>
              </div>
              <div>
                <label htmlFor="process">Process</label>
                <input id="process" name="process" list="process-options" defaultValue={editingBean?.process ?? ""} placeholder="Optional" />
                <datalist id="process-options">{processes.map((option) => <option key={option} value={option} />)}</datalist>
              </div>
            </div>

            <div className="bean-form-row">
              <div>
                <label htmlFor="roast_level">Roast</label>
                <select id="roast_level" name="roast_level" defaultValue={editingBean?.roast_level ?? ""}>
                  <option value="">Not sure</option>
                  {ROAST_LEVEL_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="milk_compatibility">Milk pairing</label>
                <select id="milk_compatibility" name="milk_compatibility" defaultValue={editingBean?.milk_compatibility ?? ""}>
                  <option value="">Not specified</option>
                  {MILK_COMPATIBILITY_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                </select>
              </div>
            </div>

            <div className="bean-form-row bean-form-row-three">
              <div><label htmlFor="acidity">Acidity</label><select id="acidity" name="acidity" defaultValue={editingBean?.acidity ?? ""}><option value="">Optional</option>{ACIDITY_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></div>
              <div><label htmlFor="body">Body</label><select id="body" name="body" defaultValue={editingBean?.body ?? ""}><option value="">Optional</option>{BODY_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></div>
              <div><label htmlFor="sweetness">Sweetness</label><select id="sweetness" name="sweetness" defaultValue={editingBean?.sweetness ?? ""}><option value="">Optional</option>{SWEETNESS_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></div>
            </div>

            <div className="bean-form-row">
              <div><label htmlFor="price">Price</label><input id="price" name="price" type="number" min="0" step="0.01" defaultValue={editingBean?.price ?? ""} placeholder="e.g. 16.50" /></div>
              <div><label htmlFor="package_weight_g">Package size (g)</label><input id="package_weight_g" name="package_weight_g" type="number" min="1" step="1" defaultValue={editingBean?.package_weight_g ?? ""} placeholder="e.g. 250" /></div>
            </div>

            <fieldset className="option-fieldset">
              <legend>Flavor labels <span>Optional</span></legend>
              <div className="option-chips">
                {FLAVOR_OPTIONS.map((option) => (
                  <label key={option} className="option-chip">
                    <input type="checkbox" name="flavor_notes" value={option} defaultChecked={flavors.has(option.toLowerCase())} />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label htmlFor="custom_flavor_notes">Other flavors</label>
            <input id="custom_flavor_notes" name="custom_flavor_notes" defaultValue={customFlavors} placeholder="Comma-separated, e.g. white tea, nougat" />

            <label htmlFor="weblink">Product website</label>
            <input id="weblink" name="weblink" type="url" defaultValue={editingBean?.weblink ?? ""} placeholder="https://…" />
            <label htmlFor="notes">Personal notes</label>
            <textarea id="notes" name="notes" rows={3} defaultValue={editingBean?.notes ?? ""} />
            <div className="bean-form-actions">
              <SubmitButton pendingLabel={editingBean ? "Updating profile…" : "Saving and generating profile…"}>{editingBean ? "Save changes" : "Save bean"}</SubmitButton>
              {editingBean && <Link className="text-link" href="/space/beans">Cancel</Link>}
            </div>
          </form>

          <div className="bean-list">
            <span>{beans.length} COFFEES</span>
            {beans.map((bean) => {
              const profile = beanProfile(bean);
              const price = bean.price === null ? null : `${Number(bean.price).toFixed(2)}`;
              return (
                <article className={`bean-item${bean.id === editingBean?.id ? " is-editing" : ""}`} key={bean.id}>
                  <div><h2>{bean.name}</h2><p>{[bean.roaster, bean.country].filter(Boolean).join(" · ") || "Your coffee"}</p></div>
                  <div className="bean-tags"><span>{bean.roast_level || "Roast unknown"}</span><span>{profile?.recommended_method || "Profile ready"}</span></div>
                  <p>{profile?.predicted_notes?.split(",").filter(Boolean).join(" · ") || bean.flavor_notes || "Add a journal entry to learn more."}</p>
                  {(price || bean.package_weight_g) && <p>{[price && `Price ${price}`, bean.package_weight_g && `${bean.package_weight_g} g`].filter(Boolean).join(" · ")}</p>}
                  <div className="bean-actions">
                    <Link className="bean-edit" href={`/space/beans?edit=${bean.id}`}>Edit</Link>
                    <form action={deleteBean}><input type="hidden" name="beanId" value={bean.id} /><button className="bean-delete" type="submit">Remove</button></form>
                  </div>
                </article>
              );
            })}
            {!beans.length && <p className="bean-empty">Your shelf is waiting for its first coffee.</p>}
          </div>
        </div>
      )}
    </section>
  );
}
