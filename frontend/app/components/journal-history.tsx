"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { bestEntryId, filterJournalEntries, groupJournalEntries, type JournalEntry, type JournalGroupMode } from "../../lib/coffee/journal";
import { deleteBrewLog } from "../space/brews/actions";

function display(value: string | number | null | undefined) {
  return String(value ?? "").replaceAll("_", " ");
}

function present(value: unknown) {
  return value !== null && value !== undefined && value !== "";
}

export function JournalHistory({ entries }: { entries: JournalEntry[] }) {
  const [mode, setMode] = useState<JournalGroupMode>("bean");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const filtered = useMemo(() => filterJournalEntries(entries, query), [entries, query]);
  const groups = useMemo(() => groupJournalEntries(filtered, mode), [filtered, mode]);

  return <section className="journal-history">
    <div className="journal-controls">
      <label><span>Search journal</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Bean, roaster, method or note" /></label>
      <label><span>Group entries</span><select value={mode} onChange={(event) => setMode(event.target.value as JournalGroupMode)}><option value="bean">By Bean</option><option value="date">By Date</option><option value="all">All entries</option></select></label>
    </div>
    <p className="journal-result-count">{filtered.length} of {entries.length} entries</p>
    {groups.map((group) => {
      const bestId = mode === "bean" ? bestEntryId(group.entries) : null;
      const roaster = mode === "bean" ? group.entries[0]?.beans?.roaster : null;
      return <section className="journal-group" key={group.key}>
        {mode !== "all" && <header><div><span>{roaster || (mode === "bean" ? "COFFEE" : "JOURNAL")}</span><h2>{group.label}</h2></div><p>{group.entries.length} {group.entries.length === 1 ? "entry" : "entries"}{group.bestScore !== null ? ` · Best ${group.bestScore}/10` : ""}{group.latestDate ? ` · Latest ${group.latestDate}` : ""}</p></header>}
        <div className="journal-rows">
          {group.entries.map((entry) => {
            const expanded = expandedId === entry.id;
            const secondaryFacts = [
              ["Machine", entry.machine_model], ["Grinder", entry.grinder_type],
              ["Dose", present(entry.default_dose_g) ? `${entry.default_dose_g} g` : null],
              ["Yield", present(entry.espresso_volume_ml) ? `${entry.espresso_volume_ml} ml` : null],
              ["Time", present(entry.extraction_time_sec) ? `${entry.extraction_time_sec} sec` : null],
              ["Drink", entry.drink_type], ["Milk", present(entry.milk_ml) ? `${entry.milk_ml} ml` : entry.milk_type],
            ].filter((fact) => present(fact[1]));
            const problems = display(entry.problem_tags).split(",").map((item) => item.trim()).filter(Boolean);
            return <article className={`journal-row${expanded ? " is-expanded" : ""}`} key={entry.id}>
              <button className={`journal-row-summary${mode !== "bean" ? " has-bean" : ""}`} type="button" aria-expanded={expanded} onClick={() => setExpandedId(expanded ? null : entry.id)}>
                <span className="journal-row-date">{entry.brew_date || "No date"}</span>
                {mode !== "bean" && <span className="journal-row-bean"><b>{entry.beans?.name || "Coffee"}</b><small>{entry.beans?.roaster}</small></span>}
                <span><small>Grind</small><b>{present(entry.grind_setting) ? entry.grind_setting : "—"}</b></span>
                <span><small>Method</small><b>{entry.brew_method ? display(entry.brew_method) : "—"}</b></span>
                <span><small>Water</small><b>{present(entry.water_temp_c) ? `${entry.water_temp_c}°C` : "—"}</b></span>
                <span className="journal-row-score"><b>{present(entry.score) ? `${entry.score}/10` : "—"}</b>{entry.id === bestId && <small>Best so far</small>}</span>
                <i aria-hidden="true">{expanded ? "−" : "+"}</i>
              </button>
              {expanded && <div className="journal-row-details">
                {secondaryFacts.length > 0 && <dl>{secondaryFacts.map(([label, value]) => <div key={String(label)}><dt>{label}</dt><dd>{display(value)}</dd></div>)}</dl>}
                {(entry.taste_result || entry.notes) && <div className="brew-observation">{entry.taste_result && <b>{display(entry.taste_result)}</b>}{entry.notes && <p>{entry.notes}</p>}</div>}
                {problems.length > 0 && <div className="brew-problems"><span>Observed</span>{problems.map((problem) => <b key={problem}>{display(problem)}</b>)}</div>}
                {entry.next_adjustment && <p className="brew-next"><span>Next time</span>{display(entry.next_adjustment)}</p>}
                <div className="brew-actions"><Link href={`/space/brews?edit=${entry.id}#journal-composer`}>Edit</Link><form action={deleteBrewLog}><input type="hidden" name="log_id" value={entry.id} /><button className="bean-delete" type="submit">Remove</button></form></div>
              </div>}
            </article>;
          })}
        </div>
      </section>;
    })}
    {!groups.length && <div className="journal-no-results"><h2>No matching entries</h2><p>Try another Bean, roaster, method or note.</p></div>}
  </section>;
}
