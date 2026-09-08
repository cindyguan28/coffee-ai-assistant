import Link from "next/link";
import { getCurrentUserId } from "../../../lib/auth/user";
import { isSupabaseConfigured } from "../../../lib/supabase/config";
import { createClient } from "../../../lib/supabase/server";
import { SubmitButton } from "../../components/submit-button";
import { addBrewLog, deleteBrewLog, updateBrewLog } from "./actions";

type PageProps = { searchParams: Promise<{ edit?: string; error?: string; message?: string }> };
type Log = Record<string, string | number | null>;

const sensory = ["acidity", "sweetness", "bitterness", "body", "balance", "aroma"];
const today = () => new Date().toISOString().slice(0, 10);

export const dynamic = "force-dynamic";

export default async function BrewsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  if (!isSupabaseConfigured()) {
    return <section className="space-welcome"><h1>Brew Logs</h1><div className="auth-notice">Connect Supabase to start your cloud brew journal.</div></section>;
  }
  const userId = await getCurrentUserId();
  const supabase = await createClient();
  const [beansResult, logsResult] = await Promise.all([
    supabase.from("beans").select("id,name,roaster").eq("user_id", userId!).order("name"),
    supabase.from("brew_logs").select("*,beans(name,roaster)").eq("user_id", userId!).order("brew_date", { ascending: false }).limit(50),
  ]);
  const logs = (logsResult.data ?? []) as unknown as Array<Log & { beans?: { name?: string; roaster?: string } | null }>;
  const editing = params.edit ? logs.find((log) => log.id === params.edit) : undefined;
  const value = (field: string) => editing?.[field] ?? "";

  return (
    <section className="space-welcome brews-page">
      <p className="kicker"><span /> Remember the cup</p><h1>Brew Logs</h1>
      {params.error && <div className="auth-error" role="alert">{params.error}</div>}
      {params.message && <div className="auth-success" role="status">{params.message}</div>}
      {beansResult.error || logsResult.error ? <div className="auth-notice">Apply the Supabase migration to activate cloud logging.</div> : !beansResult.data?.length ? (
        <div className="space-first-step"><h2>Add a Bean before logging a brew.</h2><Link className="button button-primary" href="/space/beans">Add a coffee ↗</Link></div>
      ) : (
        <div className="beans-layout">
          <form className="bean-form brew-form" action={editing ? updateBrewLog : addBrewLog}>
            <h2>{editing ? "Edit this brew" : "Log a brew"}</h2>
            <p>Save the essentials now. Add sensory detail when it is useful.</p>
            {editing && <input type="hidden" name="log_id" value={String(editing.id)} />}
            <label htmlFor="bean_id">Coffee *</label>
            <select id="bean_id" name="bean_id" defaultValue={String(value("bean_id"))} required>
              <option value="">Choose a bean</option>{beansResult.data.map((bean) => <option key={bean.id} value={bean.id}>{bean.name}{bean.roaster ? ` · ${bean.roaster}` : ""}</option>)}
            </select>
            <div className="bean-form-row">
              <div><label htmlFor="brew_date">Date *</label><input id="brew_date" name="brew_date" type="date" defaultValue={String(value("brew_date") || today())} required /></div>
              <div><label htmlFor="score">Did you like it? *</label><input id="score" name="score" type="number" min="0" max="10" step="0.5" defaultValue={String(value("score"))} placeholder="0–10" required /></div>
            </div>
            <div className="bean-form-row">
              <div><label htmlFor="brew_method">Method</label><select id="brew_method" name="brew_method" defaultValue={String(value("brew_method"))}><option value="">Choose</option><option>Espresso</option><option>V60</option><option>Aeropress</option><option>French Press</option><option>Moka Pot</option></select></div>
              <div><label htmlFor="drink_type">Drink</label><select id="drink_type" name="drink_type" defaultValue={String(value("drink_type"))}><option value="">Choose</option><option>Black</option><option>Espresso</option><option>Americano</option><option>Cappuccino</option><option>Latte</option></select></div>
            </div>
            <div className="brew-numbers">
              <label>Dose (g)<input name="default_dose_g" type="number" min="0" step="0.1" defaultValue={String(value("default_dose_g"))} /></label>
              <label>Yield (ml)<input name="espresso_volume_ml" type="number" min="0" step="0.1" defaultValue={String(value("espresso_volume_ml"))} /></label>
              <label>Time (sec)<input name="extraction_time_sec" type="number" min="0" step="0.1" defaultValue={String(value("extraction_time_sec"))} /></label>
              <label>Grind<input name="grind_setting" type="number" min="0" step="1" defaultValue={String(value("grind_setting"))} /></label>
            </div>
            <details className="brew-details"><summary>Add sensory detail</summary>
              <div className="sensory-grid">{sensory.map((dimension) => <label key={dimension}>{dimension}<input name={dimension} type="number" min="1" max="5" step="1" defaultValue={String(value(dimension))} placeholder="1–5" /></label>)}</div>
              <label>Machine<input name="machine_model" defaultValue={String(value("machine_model"))} /></label>
              <label>Grinder<input name="grinder_type" defaultValue={String(value("grinder_type"))} /></label>
              <label>Milk (ml)<input name="milk_ml" type="number" min="0" step="1" defaultValue={String(value("milk_ml"))} /></label>
              <label>Milk type<input name="milk_type" defaultValue={String(value("milk_type"))} /></label>
              <label>What did it taste like?<textarea name="taste_result" rows={2} defaultValue={String(value("taste_result"))} /></label>
              <label>Problems/tags<input name="problem_tags" defaultValue={String(value("problem_tags"))} /></label>
              <label>Next adjustment<textarea name="next_adjustment" rows={2} defaultValue={String(value("next_adjustment"))} /></label>
              <label>Notes<textarea name="notes" rows={3} defaultValue={String(value("notes"))} /></label>
            </details>
            <SubmitButton pendingLabel={editing ? "Updating brew…" : "Saving brew…"}>{editing ? "Update brew" : "Save brew"}</SubmitButton>
            {editing && <Link className="auth-back" href="/space/brews">Cancel editing</Link>}
          </form>
          <div className="bean-list"><span>{logs.length} BREWS</span>
            {logs.map((log) => <article className="bean-item brew-item" key={String(log.id)}>
              <div><div><h2>{log.beans?.name || "Coffee"}</h2><p>{String(log.brew_date || "")}{log.brew_method ? ` · ${log.brew_method}` : ""}</p></div><strong>{String(log.score)}/10</strong></div>
              <p>{String(log.taste_result || log.notes || "No tasting note yet.")}</p>
              <div className="brew-actions"><Link href={`/space/brews?edit=${log.id}`}>Edit</Link><form action={deleteBrewLog}><input type="hidden" name="log_id" value={String(log.id)} /><button className="bean-delete" type="submit">Remove</button></form></div>
            </article>)}
            {!logs.length && <p className="bean-empty">Your first brew can be as simple as a Bean, a date, and whether you liked it.</p>}
          </div>
        </div>
      )}
    </section>
  );
}
