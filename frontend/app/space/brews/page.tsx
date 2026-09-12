import Link from "next/link";
import { getCurrentUserId } from "../../../lib/auth/user";
import {
  BREW_METHOD_OPTIONS,
  DRINK_TYPE_OPTIONS,
  GRINDER_TYPE_OPTIONS,
  MILK_TYPE_OPTIONS,
  MILK_PAIRING_OPTIONS,
  NEXT_ADJUSTMENT_OPTIONS,
  PROBLEM_TAG_OPTIONS,
  TASTE_RESULT_OPTIONS,
  type GuidedOption,
} from "../../../lib/coffee/brew-options";
import type { JournalEntry } from "../../../lib/coffee/journal";
import { isSupabaseConfigured } from "../../../lib/supabase/config";
import { createClient } from "../../../lib/supabase/server";
import { JournalHistory } from "../../components/journal-history";
import { BrewStarter } from "../../components/brew-starter";
import { BrewContextFields } from "../../components/brew-context-fields";
import { RangeField } from "../../components/range-field";
import { SensoryCapture } from "../../components/sensory-capture";
import { SubmitButton } from "../../components/submit-button";
import { addBrewLog, updateBrewLog, updateEquipment } from "./actions";

type PageProps = { searchParams: Promise<{ edit?: string; error?: string; message?: string }> };
type Log = Record<string, string | number | null>;

const today = () => new Date().toISOString().slice(0, 10);
function options(items: GuidedOption[], current?: string) {
  const legacy = current && !items.some((option) => option.value === current)
    ? [{ value: current, label: current.replaceAll("_", " ") }]
    : [];
  return [...legacy, ...items].map((option) => <option key={option.value} value={option.value}>{option.label}</option>);
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
    supabase.from("brew_logs").select("*,beans(name,roaster,flavor_notes,acidity)").eq("user_id", userId!).order("brew_date", { ascending: false }).limit(50),
    supabase.from("user_profiles").select("default_machine_model,default_grinder_type,default_brew_method").eq("user_id", userId!).maybeSingle(),
  ]);
  const legacyEquipmentResult = profileResult.error
    ? await supabase.from("user_profiles").select("default_machine_model,default_grinder_type").eq("user_id", userId!).maybeSingle()
    : null;
  const logs = (logsResult.data ?? []) as unknown as Array<Log & { beans?: { name?: string; roaster?: string; flavor_notes?: string; acidity?: string } | null }>;
  const editing = params.edit ? logs.find((log) => log.id === params.edit) : undefined;
  const value = (field: string) => editing?.[field] ?? "";
  const numberValue = (field: string, fallback: number) => value(field) === "" || value(field) === null ? fallback : Number(value(field));
  const selectedProblems = new Set(String(value("problem_tags")).split(",").map((item) => item.trim()).filter(Boolean));
  const equipment = profileResult.data ?? legacyEquipmentResult?.data;
  const machineModel = editing ? String(value("machine_model")) : String(equipment?.default_machine_model || "");
  const grinderType = editing ? String(value("grinder_type")) : String(equipment?.default_grinder_type || "");
  const brewMethod = editing ? String(value("brew_method")) : String(profileResult.data?.default_brew_method || "");
  const sensoryValue = (field: string) => value(field) === "" || value(field) === null ? null : Number(value(field));

  return (
    <section className="space-welcome brews-page">
      <p className="kicker"><span /> Remember the cup</p><h1>Brew Journal</h1>
      {params.error && <div className="auth-error" role="alert">{params.error}</div>}
      {params.message && <div className="auth-success" role="status">{params.message}</div>}
      {beansResult.error || logsResult.error ? <div className="auth-notice">Apply the Supabase migration to activate your private journal.</div> : !beansResult.data?.length ? (
        <div className="space-first-step"><h2>Add a Bean before creating a journal entry.</h2><Link className="button button-primary" href="/space/beans">Add a coffee ↗</Link></div>
      ) : (
        <div className="journal-workspace">
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
          <details key={editing ? `edit-${editing.id}` : "new-entry"} className="journal-composer" id="journal-composer" open={Boolean(editing) || !logs.length}>
            <summary><span>{editing ? "EDITING ENTRY" : "NEW ENTRY"}</span><b>{editing ? "Edit journal entry" : "+ Add journal entry"}</b><small>{editing ? "Update this recipe" : "Open the compact composer"}</small></summary>
            <form key={editing ? `edit-form-${editing.id}` : "new-form"} className="bean-form brew-form" action={editing ? updateBrewLog : addBrewLog}>
            <h2>{editing ? "Edit journal entry" : "Add journal entry"}</h2>
            <p>Choose the coffee, record its grind setting, then describe the cup. Everything under Recipe details is optional.</p>
            {editing && <input type="hidden" name="log_id" value={String(editing.id)} />}
            <input type="hidden" name="machine_model" value={machineModel} />
            <input type="hidden" name="grinder_type" value={grinderType} />
            <label htmlFor="bean_id">Coffee *</label>
            <select id="bean_id" name="bean_id" defaultValue={String(value("bean_id"))} required>
              <option value="">Choose a coffee</option>{beansResult.data.map((bean) => <option key={bean.id} value={bean.id}>{bean.name}{bean.roaster ? ` · ${bean.roaster}` : ""}</option>)}
            </select>
            {!editing && <BrewStarter entries={logs as unknown as JournalEntry[]} initialBeanId={String(value("bean_id"))} />}
            <div className="bean-form-row">
              <div><label htmlFor="brew_date">Date *</label><input id="brew_date" name="brew_date" type="date" defaultValue={String(value("brew_date") || today())} required /></div>
              <div><label htmlFor="grind_setting">Grind setting *</label><input id="grind_setting" name="grind_setting" type="number" min="0" max="1000" step="1" defaultValue={String(value("grind_setting"))} placeholder="e.g. 10" required /><small>Use the number shown on your grinder.</small></div>
            </div>

            <RangeField name="score" label="How much did you like it?" min={0} max={10} step={0.5} defaultValue={numberValue("score", 8)} suffix="/10" lowLabel="Not for me" highLabel="Loved it" />

            <SensoryCapture key={editing ? `sensory-${editing.id}` : "sensory-new"} initialValues={{
              acidity: sensoryValue("acidity"), bitterness: sensoryValue("bitterness"), sweetness: sensoryValue("sweetness"),
              aroma: sensoryValue("aroma"), body: sensoryValue("body"), balance: sensoryValue("balance"),
            }} />

            <section className="perception-capture">
              <span>YOUR PERCEPTION</span>
              <p>Use your own words. This stays separate from the roaster or product description.</p>
              <label htmlFor="perceived_flavor_notes">Flavors you tasted</label>
              <input id="perceived_flavor_notes" name="perceived_flavor_notes" defaultValue={String(value("perceived_flavor_notes"))} placeholder="e.g. grapefruit peel, green apple" />
              <label htmlFor="taste_description">Taste description</label>
              <textarea id="taste_description" name="taste_description" rows={2} defaultValue={String(value("taste_description"))} placeholder="e.g. much brighter and sharper than the package suggested" />
            </section>

            <BrewContextFields key={editing ? `context-${editing.id}` : "context-new"} methods={BREW_METHOD_OPTIONS} drinks={DRINK_TYPE_OPTIONS} milks={MILK_TYPE_OPTIONS} pairings={MILK_PAIRING_OPTIONS} initial={{
              brewMethod, drinkType: String(value("drink_type")), milkType: String(value("milk_type")), milkMl: String(value("milk_ml")), milkPairing: String(value("milk_pairing")),
              dose: String(value("default_dose_g")), yieldMl: String(value("espresso_volume_ml")), timeSec: String(value("extraction_time_sec")), waterTemp: String(value("water_temp_c")),
            }} />

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

            <label htmlFor="notes">Notes</label><textarea id="notes" name="notes" rows={3} defaultValue={String(value("notes"))} placeholder="Anything you want to remember about this cup." />
            <SubmitButton pendingLabel={editing ? "Updating entry…" : "Saving entry…"}>{editing ? "Update entry" : "Save to journal"}</SubmitButton>
            {editing && <Link className="auth-back" href="/space/brews">Cancel editing</Link>}
            </form>
          </details>
          {logs.length ? <JournalHistory entries={logs as unknown as JournalEntry[]} equipmentDefaults={{ machineModel: equipment?.default_machine_model, grinderType: equipment?.default_grinder_type }} /> : <p className="bean-empty">Your first entry only needs a Bean, date, grind setting, and liking score.</p>}
        </div>
      )}
    </section>
  );
}
