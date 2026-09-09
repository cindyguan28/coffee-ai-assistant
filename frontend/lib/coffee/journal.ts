export type JournalEntry = {
  id: string;
  bean_id?: string | null;
  brew_date?: string | null;
  machine_model?: string | null;
  grinder_type?: string | null;
  default_dose_g?: number | null;
  brew_method?: string | null;
  drink_type?: string | null;
  grind_setting?: number | null;
  water_temp_c?: number | null;
  espresso_volume_ml?: number | null;
  extraction_time_sec?: number | null;
  milk_ml?: number | null;
  milk_type?: string | null;
  milk_pairing?: string | null;
  acidity?: number | null;
  bitterness?: number | null;
  sweetness?: number | null;
  body?: number | null;
  balance?: number | null;
  aroma?: number | null;
  score?: number | null;
  taste_result?: string | null;
  problem_tags?: string | null;
  next_adjustment?: string | null;
  notes?: string | null;
  beans?: { name?: string | null; roaster?: string | null } | null;
};

export type JournalGroupMode = "bean" | "date" | "all";

const WATER_RELEVANT_METHODS = new Set(["v60", "aeropress", "french_press"]);

export function showsWaterTemperature(method: string | null | undefined) {
  return WATER_RELEVANT_METHODS.has(String(method ?? "").trim().toLowerCase().replaceAll("-", "_").replaceAll(" ", "_"));
}

export type JournalGroup = {
  key: string;
  label: string;
  entries: JournalEntry[];
  bestScore: number | null;
  latestDate: string | null;
};

function searchable(entry: JournalEntry) {
  return [
    entry.beans?.name,
    entry.beans?.roaster,
    entry.brew_method,
    entry.drink_type,
    entry.machine_model,
    entry.milk_type,
    entry.milk_pairing,
    entry.taste_result,
    entry.problem_tags,
    entry.next_adjustment,
    entry.notes,
  ].filter(Boolean).join(" ").replaceAll("_", " ").toLowerCase();
}

export function filterJournalEntries(entries: JournalEntry[], query: string) {
  const normalized = query.trim().toLowerCase();
  return normalized ? entries.filter((entry) => searchable(entry).includes(normalized)) : entries;
}

function monthLabel(key: string) {
  if (!/^\d{4}-\d{2}$/.test(key)) return "Date unknown";
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${key}-01T00:00:00Z`));
}

export function groupJournalEntries(entries: JournalEntry[], mode: JournalGroupMode): JournalGroup[] {
  const grouped = new Map<string, JournalEntry[]>();
  for (const entry of entries) {
    const key = mode === "bean"
      ? entry.bean_id || `bean:${entry.beans?.name || "unknown"}`
      : mode === "date"
        ? entry.brew_date?.slice(0, 7) || "unknown"
        : "all";
    grouped.set(key, [...(grouped.get(key) ?? []), entry]);
  }

  return [...grouped.entries()].map(([key, groupEntries]) => {
    const scores = groupEntries.flatMap((entry) => entry.score === null || entry.score === undefined ? [] : [Number(entry.score)]).filter(Number.isFinite);
    const dates = groupEntries.map((entry) => entry.brew_date).filter((date): date is string => Boolean(date));
    return {
      key,
      label: mode === "bean"
        ? groupEntries[0]?.beans?.name || "Coffee"
        : mode === "date" ? monthLabel(key) : "All entries",
      entries: groupEntries,
      bestScore: scores.length ? Math.max(...scores) : null,
      latestDate: dates.sort().at(-1) ?? null,
    };
  });
}

export function bestEntryId(entries: JournalEntry[]) {
  return entries.reduce<JournalEntry | null>((best, entry) => {
    if (entry.score === null || entry.score === undefined) return best;
    if (!Number.isFinite(Number(entry.score))) return best;
    return !best || Number(entry.score) > Number(best.score) ? entry : best;
  }, null)?.id ?? null;
}

export function selectStarterBrew(entries: JournalEntry[], beanId: string) {
  const matching = entries.filter((entry) => entry.bean_id === beanId);
  return matching.find((entry) => Number(entry.score ?? 0) > 5) ?? matching[0] ?? null;
}

export function starterValues(entry: JournalEntry | null) {
  if (!entry) return {};
  return {
    brew_method: entry.brew_method ?? "",
    drink_type: entry.drink_type ?? "",
    grind_setting: entry.grind_setting ?? "",
    default_dose_g: entry.default_dose_g ?? "",
    milk_type: entry.milk_type ?? "",
    milk_ml: entry.milk_ml ?? "",
    milk_pairing: entry.milk_pairing ?? "",
  };
}

export type EquipmentDefaults = { machineModel?: string | null; grinderType?: string | null };

export function journalDetailFacts(entry: JournalEntry, defaults: EquipmentDefaults = {}) {
  const present = (value: unknown) => value !== null && value !== undefined && value !== "";
  const facts: Array<[string, string | null | undefined]> = [
    ["Different machine", entry.machine_model && entry.machine_model !== defaults.machineModel ? entry.machine_model : null],
    ["Different grinder", entry.grinder_type && entry.grinder_type !== defaults.grinderType ? entry.grinder_type : null],
    ["Dose", present(entry.default_dose_g) ? `${entry.default_dose_g} g` : null],
    ["Actual yield", present(entry.espresso_volume_ml) ? `${entry.espresso_volume_ml} ml` : null],
    ["Actual time", present(entry.extraction_time_sec) ? `${entry.extraction_time_sec} sec` : null],
    ["Drink", entry.drink_type],
    ["Milk", entry.milk_type],
    ["Milk amount", present(entry.milk_ml) ? `${entry.milk_ml} ml` : null],
    ["Milk pairing", entry.milk_pairing],
  ];
  return facts.filter((fact): fact is [string, string] => present(fact[1]));
}
