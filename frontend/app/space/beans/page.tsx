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
import { compatibleGuidedValue, normalizeGuidedValue, parseOriginCountries } from "../../../lib/coffee/bean";
import { libraryView, matchesLibraryView, type LibraryView } from "../../../lib/coffee/library";
import { isSupabaseConfigured } from "../../../lib/supabase/config";
import { createClient } from "../../../lib/supabase/server";
import { SearchableFlavorPicker } from "../../components/searchable-flavor-picker";
import { GuidedCombobox } from "../../components/guided-combobox";
import { GuidedMultiSelect } from "../../components/guided-multi-select";
import { SubmitButton } from "../../components/submit-button";
import { SpeciesSelector } from "../../components/species-selector";
import { addBean, deleteBean, regenerateBeanProfile, updateBean, updateBeanLibraryState } from "./actions";

type BeansPageProps = { searchParams: Promise<{ edit?: string; error?: string; message?: string; view?: string }> };

type Bean = {
  id: string;
  name: string;
  roaster: string | null;
  country: string | null;
  origin_countries: string[] | null;
  species: string | null;
  arabica_percentage: number | null;
  favorite: boolean;
  lifecycle_state: string | null;
  repurchase_intent: string | null;
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

function missingOriginCountries(error: { code?: string; message?: string } | null) {
  return Boolean(error && (error.code === "42703" || error.code === "PGRST204") && error.message?.includes("origin_countries"));
}

function missingSpecies(error: { code?: string; message?: string } | null) {
  return Boolean(error && (error.code === "42703" || error.code === "PGRST204") && (error.message?.includes("species") || error.message?.includes("arabica_percentage")));
}

function missingLibraryState(error: { code?: string; message?: string } | null) {
  return Boolean(error && (error.code === "42703" || error.code === "PGRST204") && (error.message?.includes("favorite") || error.message?.includes("lifecycle_state") || error.message?.includes("repurchase_intent")));
}

const VIEW_LABELS: Array<{ value: LibraryView; label: string }> = [
  { value: "all", label: "All" },
  { value: "current", label: "On hand" },
  { value: "favorites", label: "Favorites" },
  { value: "try", label: "Want to try" },
  { value: "buy-again", label: "Buy again" },
  { value: "not-for-me", label: "Not for me" },
  { value: "finished", label: "Finished" },
];

export default async function BeansPage({ searchParams }: BeansPageProps) {
  const params = await searchParams;
  if (!isSupabaseConfigured()) {
    return <section className="space-welcome"><h1>My Beans</h1><div className="auth-notice">Connect Supabase to save private beans.</div></section>;
  }

  const userId = await getCurrentUserId();
  const supabase = await createClient();
  const current = await supabase
    .from("beans")
    .select("id,name,roaster,country,origin_countries,species,arabica_percentage,favorite,lifecycle_state,repurchase_intent,process,roast_level,price,package_weight_g,weblink,flavor_notes,acidity,body,sweetness,milk_compatibility,notes,created_at,bean_profiles(predicted_acidity,predicted_body,predicted_sweetness,predicted_notes,recommended_method,recommended_ratio,recommended_temp,confidence,reasoning)")
    .eq("user_id", userId!)
    .order("created_at", { ascending: false });
  const withoutLibraryState = missingLibraryState(current.error) ? await supabase
    .from("beans")
    .select("id,name,roaster,country,origin_countries,species,arabica_percentage,process,roast_level,price,package_weight_g,weblink,flavor_notes,acidity,body,sweetness,milk_compatibility,notes,created_at,bean_profiles(predicted_acidity,predicted_body,predicted_sweetness,predicted_notes,recommended_method,recommended_ratio,recommended_temp,confidence,reasoning)")
    .eq("user_id", userId!)
    .order("created_at", { ascending: false }) : null;
  const libraryCompatible = withoutLibraryState ?? current;
  const withoutSpecies = missingSpecies(libraryCompatible.error) ? await supabase
    .from("beans")
    .select("id,name,roaster,country,origin_countries,process,roast_level,price,package_weight_g,weblink,flavor_notes,acidity,body,sweetness,milk_compatibility,notes,created_at,bean_profiles(predicted_acidity,predicted_body,predicted_sweetness,predicted_notes,recommended_method,recommended_ratio,recommended_temp,confidence,reasoning)")
    .eq("user_id", userId!)
    .order("created_at", { ascending: false }) : null;
  const speciesCompatible = withoutSpecies ?? libraryCompatible;
  const withoutOrigins = missingOriginCountries(speciesCompatible.error) ? await supabase
    .from("beans")
    .select("id,name,roaster,country,process,roast_level,price,package_weight_g,weblink,flavor_notes,acidity,body,sweetness,milk_compatibility,notes,created_at,bean_profiles(predicted_acidity,predicted_body,predicted_sweetness,predicted_notes,recommended_method,recommended_ratio,recommended_temp,confidence,reasoning)")
    .eq("user_id", userId!)
    .order("created_at", { ascending: false }) : null;
  const compatible = withoutOrigins ?? speciesCompatible;
  const legacy = missingPackageWeight(compatible.error)
    ? await supabase
      .from("beans")
      .select("id,name,roaster,country,process,roast_level,price,weblink,flavor_notes,acidity,body,sweetness,milk_compatibility,notes,created_at,bean_profiles(predicted_acidity,predicted_body,predicted_sweetness,predicted_notes,recommended_method,recommended_ratio,recommended_temp,confidence,reasoning)")
      .eq("user_id", userId!)
      .order("created_at", { ascending: false })
    : null;
  const error = legacy ? legacy.error : compatible.error;
  const beans = (legacy
    ? (legacy.data ?? []).map((bean) => ({ ...bean, package_weight_g: null, origin_countries: parseOriginCountries(bean.country), species: null, arabica_percentage: null, favorite: false, lifecycle_state: null, repurchase_intent: null }))
    : (compatible.data ?? []).map((bean) => ({ ...bean, origin_countries: "origin_countries" in bean && Array.isArray(bean.origin_countries) ? bean.origin_countries : parseOriginCountries(bean.country), species: "species" in bean ? bean.species : null, arabica_percentage: "arabica_percentage" in bean ? bean.arabica_percentage : null, favorite: "favorite" in bean ? Boolean(bean.favorite) : false, lifecycle_state: "lifecycle_state" in bean ? bean.lifecycle_state : null, repurchase_intent: "repurchase_intent" in bean ? bean.repurchase_intent : null }))) as Bean[];
  const view = libraryView(params.view);
  const visibleBeans = beans.filter((bean) => matchesLibraryView(bean, view));
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
  const countries = mergeOptions(COUNTRY_OPTIONS, beans.flatMap((bean) => bean.origin_countries ?? parseOriginCountries(bean.country)));
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
        <div className="beans-layout beans-workspace">
          <details key={editingBean?.id ?? (beans.length ? "add-bean" : "first-bean")} className="bean-composer" open={Boolean(editingBean) || !beans.length}>
            <summary>
              <span>{editingBean ? "EDITING BEAN" : "NEW BEAN"}</span>
              <strong>{editingBean ? `Edit ${editingBean.name}` : "Add a coffee"}</strong>
              <small>{editingBean ? "Update its details and profile" : "Open only when you need it"}</small>
              <i aria-hidden="true">+</i>
            </summary>
          <form key={editingBean?.id ?? "new-bean"} className="bean-form" action={editingBean ? updateBean : addBean}>
            <h2>{editingBean ? `Edit ${editingBean.name}` : "Add a coffee"}</h2>
            <p>Choose a suggestion or type your own. Only the coffee name is required.</p>
            {editingBean && <input type="hidden" name="beanId" value={editingBean.id} />}

            <label htmlFor="name">Coffee name *</label>
            <input id="name" name="name" required maxLength={200} defaultValue={editingBean?.name ?? ""} />

            <label htmlFor="roaster">Roaster</label>
            <GuidedCombobox id="roaster" name="roaster" options={roasters} initialValue={editingBean?.roaster} placeholder="Search or add a roaster" suggestionLabel="Show roaster suggestions" />

            <label htmlFor="origin-countries">Origin countries</label>
            <GuidedMultiSelect id="origin-countries" name="origin_countries" options={countries} initialSelected={editingBean?.origin_countries ?? parseOriginCountries(editingBean?.country)} placeholder="Search or add a country" />

            <SpeciesSelector initialSpecies={editingBean?.species} initialArabicaPercentage={editingBean?.arabica_percentage} />

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

            <details className="bean-more-details" open={Boolean(editingBean?.process || editingBean?.weblink)}>
              <summary>More coffee details <span>Optional</span></summary>
              <label htmlFor="process">Process</label>
              <GuidedCombobox id="process" name="process" options={processes} initialValue={editingBean?.process} placeholder="Washed, natural…" suggestionLabel="Show process suggestions" maxLength={100} />
              <label htmlFor="weblink">Product website</label>
              <input id="weblink" name="weblink" type="url" defaultValue={editingBean?.weblink ?? ""} placeholder="https://…" />
            </details>
            <label htmlFor="notes">Personal notes</label>
            <textarea id="notes" name="notes" rows={3} defaultValue={editingBean?.notes ?? ""} />
            <div className="bean-form-actions">
              <SubmitButton pendingLabel={editingBean ? "Updating profile…" : "Saving and generating profile…"}>{editingBean ? "Save changes" : "Save bean"}</SubmitButton>
              {editingBean && <Link className="text-link" href="/space/beans">Cancel</Link>}
            </div>
          </form>
          </details>

          <div className="bean-list">
            <nav className="bean-library-filters" aria-label="Filter coffee library">
              {VIEW_LABELS.map((item) => {
                const count = beans.filter((bean) => matchesLibraryView(bean, item.value)).length;
                return <Link key={item.value} className={view === item.value ? "is-active" : ""} href={item.value === "all" ? "/space/beans" : `/space/beans?view=${item.value}`}>{item.label}<span>{count}</span></Link>;
              })}
            </nav>
            <span>{visibleBeans.length}{view === "all" ? "" : ` OF ${beans.length}`} COFFEES</span>
            {visibleBeans.map((bean) => {
              const profile = beanProfile(bean);
              const price = bean.price === null ? null : `${Number(bean.price).toFixed(2)}`;
              const summary = buildCoffeeSummary({ ...bean, ...profile });
              return (
                <article className={`bean-item${bean.id === editingBean?.id ? " is-editing" : ""}`} key={bean.id}>
                  <div><h2>{bean.name}</h2><p>{[bean.roaster, (bean.origin_countries?.length ? bean.origin_countries.join(" · ") : bean.country)].filter(Boolean).join(" · ") || "Your coffee"}</p></div>
                  {(price || bean.package_weight_g) && <dl className="bean-purchase-facts">
                    {bean.package_weight_g && <div><dt>Package</dt><dd>{Number(bean.package_weight_g).toLocaleString()} g</dd></div>}
                    {price && <div><dt>Price</dt><dd>{price}</dd></div>}
                  </dl>}
                  <div className="bean-tags"><span>{summary.profileLabel}</span>{bean.species && bean.species !== "Unknown" && <span>{bean.species === "Blend" && bean.arabica_percentage !== null ? `${bean.arabica_percentage}% Arabica · ${100 - bean.arabica_percentage}% Robusta` : bean.species}</span>}{summary.flavors.slice(0, 2).map((flavor) => <span key={flavor}>{flavor}</span>)}</div>
                  <section className="bean-library-state" aria-label={`Library status for ${bean.name}`}>
                    <div><span>MY LIBRARY</span><small>Separate from your taste rating</small></div>
                    <div className="bean-state-actions">
                      {[
                        { field: "favorite", value: bean.favorite ? "false" : "true", label: "Favorite", active: bean.favorite },
                        { field: "lifecycle_state", value: bean.lifecycle_state === "want_to_try" ? "" : "want_to_try", label: "Want to try", active: bean.lifecycle_state === "want_to_try" },
                        { field: "lifecycle_state", value: bean.lifecycle_state === "currently_have" ? "" : "currently_have", label: "On hand", active: bean.lifecycle_state === "currently_have" },
                        { field: "lifecycle_state", value: bean.lifecycle_state === "finished" ? "" : "finished", label: "Finished", active: bean.lifecycle_state === "finished" },
                        { field: "repurchase_intent", value: bean.repurchase_intent === "buy_again" ? "" : "buy_again", label: "Buy again", active: bean.repurchase_intent === "buy_again" },
                        { field: "repurchase_intent", value: bean.repurchase_intent === "would_not_buy_again" ? "" : "would_not_buy_again", label: "Not for me", active: bean.repurchase_intent === "would_not_buy_again" },
                      ].map((item) => <form action={updateBeanLibraryState} key={`${item.field}-${item.label}`}>
                        <input type="hidden" name="beanId" value={bean.id} />
                        <input type="hidden" name="field" value={item.field} />
                        <input type="hidden" name="value" value={item.value} />
                        <input type="hidden" name="view" value={view} />
                        <button className={item.active ? "is-active" : ""} type="submit" aria-pressed={item.active}>{item.label}</button>
                      </form>)}
                    </div>
                  </section>
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
            {beans.length > 0 && !visibleBeans.length && <p className="bean-empty">No coffees match this library view yet.</p>}
          </div>
        </div>
      )}
    </section>
  );
}
