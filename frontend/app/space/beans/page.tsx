import Link from "next/link";
import { getCurrentUserId } from "../../../lib/auth/user";
import {
  ACIDITY_OPTIONS,
  COUNTRY_OPTIONS,
  FLAVOR_OPTIONS,
  MILK_COMPATIBILITY_OPTIONS,
  PROCESS_OPTIONS,
  ROASTER_OPTIONS,
  ROAST_LEVEL_OPTIONS,
} from "../../../lib/coffee/options";
import { buildCoffeeSummary } from "../../../lib/coffee/summary";
import { compatibleGuidedValue, normalizeGuidedValue } from "../../../lib/coffee/bean";
import { isSupabaseConfigured } from "../../../lib/supabase/config";
import { createClient } from "../../../lib/supabase/server";
import { SearchableFlavorPicker } from "../../components/searchable-flavor-picker";
import { SubmitButton } from "../../components/submit-button";
import { addBean, deleteBean, regenerateBeanProfile, updateBean } from "./actions";

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
    recommended_ratio: string | null;
    recommended_temp: string | null;
    confidence: number | null;
    reasoning: string | null;
  } | Array<{
    predicted_acidity: string | null;
    predicted_body: string | null;
    predicted_sweetness: string | null;
    predicted_notes: string | null;
    recommended_method: string | null;
    recommended_ratio: string | null;
    recommended_temp: string | null;
    confidence: number | null;
    reasoning: string | null;
  }> | null;
};

export const dynamic = "force-dynamic";

function mergeOptions(base: readonly string[], saved: Array<string | null>) {
  const options = [...base, ...saved.filter((value): value is string => Boolean(value))];
  return [...new Map(options.map((value) => [value.toLowerCase(), value])).values()];
}

function selectedFlavors(bean?: Bean) {
  return new Set((bean?.flavor_notes ?? "").split(",").map(normalizeGuidedValue).filter(Boolean));
}

function selectOptions(base: readonly string[], saved?: string | null) {
  const value = compatibleGuidedValue(saved, base);
  return { value, options: value && !base.includes(value) ? [...base, value] : [...base] };
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
    .select("id,name,roaster,country,process,roast_level,price,package_weight_g,weblink,flavor_notes,acidity,body,sweetness,milk_compatibility,notes,created_at,bean_profiles(predicted_acidity,predicted_body,predicted_sweetness,predicted_notes,recommended_method,recommended_ratio,recommended_temp,confidence,reasoning)")
    .eq("user_id", userId!)
    .order("created_at", { ascending: false });
  const legacy = missingPackageWeight(withPackageWeight.error)
    ? await supabase
      .from("beans")
      .select("id,name,roaster,country,process,roast_level,price,weblink,flavor_notes,acidity,body,sweetness,milk_compatibility,notes,created_at,bean_profiles(predicted_acidity,predicted_body,predicted_sweetness,predicted_notes,recommended_method,recommended_ratio,recommended_temp,confidence,reasoning)")
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
    .filter((value) => value && !FLAVOR_OPTIONS.some((option) => normalizeGuidedValue(option) === normalizeGuidedValue(value)))
    .join(", ");
  const roast = selectOptions(ROAST_LEVEL_OPTIONS, editingBean?.roast_level);
  const milkPairing = selectOptions(MILK_COMPATIBILITY_OPTIONS, editingBean?.milk_compatibility);
  const acidity = selectOptions(ACIDITY_OPTIONS, editingBean?.acidity);

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
          <form key={editingBean?.id ?? "new-bean"} className="bean-form" action={editingBean ? updateBean : addBean}>
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
                <select id="roast_level" name="roast_level" defaultValue={roast.value}>
                  <option value="">Not sure</option>
                  {roast.options.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="milk_compatibility">Milk pairing</label>
                <select id="milk_compatibility" name="milk_compatibility" defaultValue={milkPairing.value}>
                  <option value="">Not specified</option>
                  {milkPairing.options.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}
                </select>
              </div>
            </div>

            <label htmlFor="acidity">Expected acidity</label><select id="acidity" name="acidity" defaultValue={acidity.value}><option value="">Optional</option>{acidity.options.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}</select>
            <input type="hidden" name="body" value={editingBean?.body ?? ""} />
            <input type="hidden" name="sweetness" value={editingBean?.sweetness ?? ""} />

            <div className="bean-form-row">
              <div><label htmlFor="price">Price</label><input id="price" name="price" type="number" min="0" step="0.01" defaultValue={editingBean?.price ?? ""} placeholder="e.g. 16.50" /></div>
              <div><label htmlFor="package_weight_g">Package size (g)</label><input id="package_weight_g" name="package_weight_g" type="number" min="1" step="1" defaultValue={editingBean?.package_weight_g ?? ""} placeholder="e.g. 250" /></div>
            </div>

            <SearchableFlavorPicker key={editingBean?.id ?? "new-flavors"} options={FLAVOR_OPTIONS} initialSelected={FLAVOR_OPTIONS.filter((option) => flavors.has(normalizeGuidedValue(option)))} />
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
              const summary = buildCoffeeSummary({ ...bean, ...profile });
              return (
                <article className={`bean-item${bean.id === editingBean?.id ? " is-editing" : ""}`} key={bean.id}>
                  <div><h2>{bean.name}</h2><p>{[bean.roaster, bean.country].filter(Boolean).join(" · ") || "Your coffee"}</p></div>
                  {(price || bean.package_weight_g) && <dl className="bean-purchase-facts">
                    {bean.package_weight_g && <div><dt>Package</dt><dd>{Number(bean.package_weight_g).toLocaleString()} g</dd></div>}
                    {price && <div><dt>Price</dt><dd>{price}</dd></div>}
                  </dl>}
                  <div className="bean-tags"><span>{summary.profileLabel}</span>{summary.flavors.slice(0, 2).map((flavor) => <span key={flavor}>{flavor}</span>)}</div>
                  {profile ? <section className="bean-profile">
                    <div className="bean-profile-heading"><div><span>AT A GLANCE</span><h3>{summary.profileLabel}</h3></div><form action={regenerateBeanProfile}><input type="hidden" name="beanId" value={bean.id} /><button type="submit">Refresh</button></form></div>
                    <div className="bean-reference-grid">
                      {[
                        { label: "Roast", scale: summary.roast },
                        { label: "Intensity", scale: summary.intensity },
                        { label: "Acidity", scale: summary.acidity },
                      ].map(({ label, scale }) => <div className="bean-reference" key={label}><div><dt>{label}</dt><dd>{scale.score ? `${scale.score}/5` : "—"}</dd></div><progress max="5" value={scale.score ?? 0} /><small>{scale.label}</small></div>)}
                    </div>
                    {summary.flavors.length > 0 && <p><b>Main flavors:</b> {summary.flavors.join(" · ")}</p>}
                  </section> : <section className="bean-profile bean-profile-missing"><span>BEAN PROFILE</span><h3>Profile not generated yet</h3><p>Your Bean is safe. Generate its Roast, Intensity, Acidity and main flavors.</p><form action={regenerateBeanProfile}><input type="hidden" name="beanId" value={bean.id} /><button className="button button-primary" type="submit">Generate profile</button></form></section>}
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
