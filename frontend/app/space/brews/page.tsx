import Link from "next/link";
import { getCurrentUserId } from "../../../lib/auth/user";
import {
  BREW_METHOD_OPTIONS,
  DRINK_TYPE_OPTIONS,
  GRINDER_TYPE_OPTIONS,
  MILK_TYPE_OPTIONS,
  NEXT_ADJUSTMENT_OPTIONS,
  PROBLEM_TAG_OPTIONS,
  SENSORY_DIMENSIONS,
  TASTE_RESULT_OPTIONS,
  type GuidedOption,
} from "../../../lib/coffee/brew-options";
import { isSupabaseConfigured } from "../../../lib/supabase/config";
import { createClient } from "../../../lib/supabase/server";
import { RangeField } from "../../components/range-field";
import { SubmitButton } from "../../components/submit-button";
import { addBrewLog, deleteBrewLog, updateBrewLog, updateEquipment } from "./actions";

type PageProps = { searchParams: Promise<{ edit?: string; error?: string; message?: string }> };
type Log = Record<string, string | number | null>;

const today = () => new Date().toISOString().slice(0, 10);
function options(items: GuidedOption[], current?: string) {
  const legacy = current && !items.some((option) => option.value === current)
    ? [{ value: current, label: current.replaceAll("_", " ") }]
    : [];
  return [...legacy, ...items].map((option) => <option key={option.value} value={option.value}>{option.label}</option>);
}

function display(value: string | number | null | undefined) {
  return String(value ?? "").replaceAll("_", " ");
}

function isPresent(value: string | number | null | undefined) {
  return value !== null && value !== undefined && value !== "";
}

export const dynamic = "force-dynamic";

export default async function BrewsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  if (!isSupabaseConfigured()) {
    return <section className="space-welcome"><h1>Brew Journal</h1><div className="auth-notice">Connect Supabase to start your private Brew Journal.</div></section>;
  }
  const userId = await getCurrentUserId();
  const supabase = await createClient();
  const [beansResult, logsResult, profileResult] = await Promise.all([
    supabase.from("beans").select("id,name,roaster").eq("user_id", userId!).order("name"),
    supabase.from("brew_logs").select("*,beans(name,roaster)").eq("user_id", userId!).order("brew_date", { ascending: false }).limit(50),
    supabase.from("user_profiles").select("default_machine_model,default_grinder_type,default_brew_method").eq("user_id", userId!).maybeSingle(),
  ]);
  const legacyEquipmentResult = profileResult.error
    ? await supabase.from("user_profiles").select("default_machine_model,default_grinder_type").eq("user_id", userId!).maybeSingle()
    : null;
  const logs = (logsResult.data ?? []) as unknown as Array<Log & { beans?: { name?: string; roaster?: string } | null }>;
  const editing = params.edit ? logs.find((log) => log.id === params.edit) : undefined;
  const value = (field: string) => editing?.[field] ?? "";
  const numberValue = (field: string, fallback: number) => value(field) === "" || value(field) === null ? fallback : Number(value(field));
  const selectedProblems = new Set(String(value("problem_tags")).split(",").map((item) => item.trim()).filter(Boolean));
  const equipment = profileResult.data ?? legacyEquipmentResult?.data;
  const machineModel = String(value("machine_model") || equipment?.default_machine_model || "");
  const grinderType = String(value("grinder_type") || equipment?.default_grinder_type || "");
  const brewMethod = String(value("brew_method") || profileResult.data?.default_brew_method || "");

  return (
    <section className="space-welcome brews-page">
      <p className="kicker"><span /> Remember the cup</p><h1>Brew Journal</h1>
      {params.error && <div className="auth-error" role="alert">{params.error}</div>}
      {params.message && <div className="auth-success" role="status">{params.message}</div>}
      {beansResult.error || logsResult.error ? <div className="auth-notice">Apply the Supabase migration to activate your private journal.</div> : !beansResult.data?.length ? (
        <div className="space-first-step"><h2>Add a Bean before creating a journal entry.</h2><Link className="button button-primary" href="/space/beans">Add a coffee ↗</Link></div>
      ) : (
        <div className="beans-layout">
          <div className="journal-entry-column">
            <section className="equipment-card">
              <div><span>MY EQUIPMENT</span><h2>{equipment?.default_machine_model || "Save your machine once"}</h2><p>{[equipment?.default_grinder_type, profileResult.data?.default_brew_method].filter(Boolean).map((item) => String(item).replaceAll("_", " ")).join(" · ") || "It will be attached to new journal entries automatically."}</p></div>
              {legacyEquipmentResult?.error ? <p>Apply the latest database migration to save equipment defaults.</p> : <details open={!equipment?.default_machine_model}><summary>{equipment?.default_machine_model ? "Edit equipment" : "Add equipment"}</summary><form action={updateEquipment}>
                <label htmlFor="default_machine_model">Machine</label><input id="default_machine_model" name="default_machine_model" defaultValue={equipment?.default_machine_model ?? ""} placeholder="e.g. Sage Barista Express" />
                <label htmlFor="default_grinder_type">Grinder type</label><select id="default_grinder_type" name="default_grinder_type" defaultValue={equipment?.default_grinder_type ?? ""}><option value="">Choose</option>{options(GRINDER_TYPE_OPTIONS, equipment?.default_grinder_type ?? "")}</select>
                <label htmlFor="default_brew_method">Usual brew method</label><select id="default_brew_method" name="default_brew_method" defaultValue={profileResult.data?.default_brew_method ?? ""}><option value="">No default</option>{options(BREW_METHOD_OPTIONS, profileResult.data?.default_brew_method ?? "")}</select>
                {profileResult.error && <small>Apply the newest migration before saving a usual brew method.</small>}
                <SubmitButton pendingLabel="Saving equipment…">Save equipment</SubmitButton>
              </form></details>}
            </section>
            <form className="bean-form brew-form" action={editing ? updateBrewLog : addBrewLog}>
            <h2>{editing ? "Edit journal entry" : "Add journal entry"}</h2>
            <p>Choose the coffee, record its grind setting, then describe the cup. Everything under Recipe details is optional.</p>
            {editing && <input type="hidden" name="log_id" value={String(editing.id)} />}
            <input type="hidden" name="machine_model" value={machineModel} />
            <input type="hidden" name="grinder_type" value={grinderType} />
            <label htmlFor="bean_id">Coffee *</label>
            <select id="bean_id" name="bean_id" defaultValue={String(value("bean_id"))} required>
              <option value="">Choose a bean</option>{beansResult.data.map((bean) => <option key={bean.id} value={bean.id}>{bean.name}{bean.roaster ? ` · ${bean.roaster}` : ""}</option>)}
            </select>
            <div className="bean-form-row">
              <div><label htmlFor="brew_date">Date *</label><input id="brew_date" name="brew_date" type="date" defaultValue={String(value("brew_date") || today())} required /></div>
              <div><label htmlFor="grind_setting">Grind setting *</label><input id="grind_setting" name="grind_setting" type="number" min="0" max="1000" step="1" defaultValue={String(value("grind_setting"))} placeholder="e.g. 10" required /><small>Use the number shown on your grinder.</small></div>
            </div>

            <RangeField name="score" label="How much did you like it?" min={0} max={10} step={0.5} defaultValue={numberValue("score", 8)} suffix="/10" lowLabel="Not for me" highLabel="Loved it" />

            <div className="bean-form-row">
              <div><label htmlFor="brew_method">Method</label><select id="brew_method" name="brew_method" defaultValue={brewMethod}><option value="">Choose</option>{options(BREW_METHOD_OPTIONS, brewMethod)}</select></div>
              <div><label htmlFor="drink_type">Drink</label><select id="drink_type" name="drink_type" defaultValue={String(value("drink_type"))}><option value="">Choose</option>{options(DRINK_TYPE_OPTIONS, String(value("drink_type")))}</select></div>
            </div>

            <fieldset className="sensory-fieldset">
              <legend>Taste evaluation <span>1 = low, 5 = high intensity</span></legend>
              <p>These describe the cup; a higher number does not automatically mean better.</p>
              <div className="sensory-sliders">
                {SENSORY_DIMENSIONS.map((dimension) => (
                  <RangeField key={dimension.name} name={dimension.name} label={dimension.label} min={1} max={5} defaultValue={numberValue(dimension.name, 3)} suffix="/5" lowLabel={dimension.hint} highLabel={dimension.high} />
                ))}
              </div>
            </fieldset>

            <label htmlFor="taste_result">Quick taste result</label>
            <select id="taste_result" name="taste_result" defaultValue={String(value("taste_result"))}><option value="">Choose if useful</option>{options(TASTE_RESULT_OPTIONS, String(value("taste_result")))}</select>

            <fieldset className="option-fieldset">
              <legend>Problem tags <span>Select all that apply</span></legend>
              <div className="option-chips">
                {PROBLEM_TAG_OPTIONS.map((option) => <label className="option-chip" key={option.value}><input type="checkbox" name="problem_tags" value={option.value} defaultChecked={selectedProblems.has(option.value)} /><span>{option.label}</span></label>)}
              </div>
            </fieldset>

            <label htmlFor="next_adjustment">Try next time</label>
            <select id="next_adjustment" name="next_adjustment" defaultValue={String(value("next_adjustment"))}><option value="">No adjustment yet</option>{options(NEXT_ADJUSTMENT_OPTIONS, String(value("next_adjustment")))}</select>

            <details className="brew-details"><summary>Recipe details (optional)</summary>
              <div className="brew-numbers">
                <label>Dose (g)<input name="default_dose_g" type="number" min="0" step="0.1" defaultValue={String(value("default_dose_g"))} /></label>
                <label>Yield (ml)<input name="espresso_volume_ml" type="number" min="0" step="0.1" defaultValue={String(value("espresso_volume_ml"))} /></label>
                <label>Time (sec)<input name="extraction_time_sec" type="number" min="0" step="0.1" defaultValue={String(value("extraction_time_sec"))} /></label>
                <label>Water (°C)<input name="water_temp_c" type="number" min="0" max="100" step="0.1" defaultValue={String(value("water_temp_c"))} /></label>
              </div>
              <label>Milk (ml)<input name="milk_ml" type="number" min="0" step="1" defaultValue={String(value("milk_ml"))} /></label>
              <label>Milk type<select name="milk_type" defaultValue={String(value("milk_type"))}><option value="">None / choose</option>{options(MILK_TYPE_OPTIONS, String(value("milk_type")))}</select></label>
            </details>
            <label htmlFor="notes">Notes</label><textarea id="notes" name="notes" rows={3} defaultValue={String(value("notes"))} placeholder="Anything you want to remember about this cup." />
            <SubmitButton pendingLabel={editing ? "Updating entry…" : "Saving entry…"}>{editing ? "Update entry" : "Save to journal"}</SubmitButton>
            {editing && <Link className="auth-back" href="/space/brews">Cancel editing</Link>}
            </form>
          </div>
          <div className="bean-list"><span>{logs.length} JOURNAL ENTRIES</span>
            {logs.map((log) => {
              const facts = [
                ["Grind", log.grind_setting],
                ["Method", log.brew_method],
                ["Water", isPresent(log.water_temp_c) ? `${log.water_temp_c}°C` : null],
                ["Machine", log.machine_model],
                ["Grinder", log.grinder_type],
                ["Dose", isPresent(log.default_dose_g) ? `${log.default_dose_g} g` : null],
                ["Yield", isPresent(log.espresso_volume_ml) ? `${log.espresso_volume_ml} ml` : null],
                ["Time", isPresent(log.extraction_time_sec) ? `${log.extraction_time_sec} sec` : null],
              ].filter((fact) => isPresent(fact[1]));
              const problems = display(log.problem_tags).split(",").map((item) => item.trim()).filter(Boolean);
              return <article className="bean-item brew-item" key={String(log.id)}>
                <div className="brew-item-heading"><div><span>{display(log.brew_date)}</span><h2>{log.beans?.name || "Coffee"}</h2><p>{log.beans?.roaster || "Your recipe"}</p></div><strong>{String(log.score)}/10</strong></div>
                <dl className="brew-facts">
                  {facts.map(([label, fact]) => <div key={String(label)}><dt>{label}</dt><dd>{display(fact)}</dd></div>)}
                </dl>
                {(log.taste_result || log.notes) && <div className="brew-observation">{log.taste_result && <b>{display(log.taste_result)}</b>}{log.notes && <p>{String(log.notes)}</p>}</div>}
                {problems.length > 0 && <div className="brew-problems"><span>Observed</span>{problems.map((problem) => <b key={problem}>{display(problem)}</b>)}</div>}
                {log.next_adjustment && <p className="brew-next"><span>Next time</span>{display(log.next_adjustment)}</p>}
                <div className="brew-actions"><Link href={`/space/brews?edit=${log.id}`}>Edit</Link><form action={deleteBrewLog}><input type="hidden" name="log_id" value={String(log.id)} /><button className="bean-delete" type="submit">Remove</button></form></div>
              </article>;
            })}
            {!logs.length && <p className="bean-empty">Your first entry only needs a Bean, date, grind setting, and liking score.</p>}
          </div>
        </div>
      )}
    </section>
  );
}
