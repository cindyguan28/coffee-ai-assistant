export const SENSORY_DIMENSIONS = ["acidity", "sweetness", "bitterness", "body", "balance", "aroma"] as const;
export type SensoryDimension = (typeof SENSORY_DIMENSIONS)[number];
export type TasteLog = Partial<Record<SensoryDimension, number | null>> & {
  score?: number | null;
  flavor_notes?: string | null;
  bean_profile?: { predicted_acidity?: number | null; predicted_sweetness?: number | null; predicted_body?: number | null } | null;
};

export const TASTE_DIMENSION_GUIDE: Record<SensoryDimension, { low: string; high: string; meaning: string }> = {
  acidity: { low: "soft", high: "bright", meaning: "the brightness or lively fruit-like quality you perceived" },
  sweetness: { low: "subtle", high: "pronounced", meaning: "the natural sweetness you perceived" },
  bitterness: { low: "gentle", high: "strong", meaning: "the strength of bitter taste you perceived" },
  body: { low: "light", high: "full", meaning: "the weight and texture of the cup" },
  balance: { low: "uneven", high: "harmonious", meaning: "how well acidity, bitterness, sweetness and body worked together" },
  aroma: { low: "delicate", high: "intense", meaning: "the strength of the coffee's aroma" },
};

export function explainTasteDimension(dimension: SensoryDimension, value: number | null) {
  if (value === null) return `Not enough ${dimension} ratings yet.`;
  const guide = TASTE_DIMENSION_GUIDE[dimension];
  return `${value}/5 is your weighted average for ${guide.meaning}. The scale runs from ${guide.low} (1) to ${guide.high} (5).`;
}

const FAMILY_BY_NOTE: Record<string, string> = {
  lemon: "Citrus", orange: "Citrus", bergamot: "Citrus", citrus: "Citrus",
  strawberry: "Berry", blueberry: "Berry", raspberry: "Berry", berry: "Berry", blackcurrant: "Berry",
  jasmine: "Floral", floral: "Floral", rose: "Floral",
  peach: "Stone fruit", apricot: "Stone fruit", plum: "Stone fruit", "stone fruit": "Stone fruit",
  cocoa: "Chocolate", chocolate: "Chocolate", cacao: "Chocolate",
  caramel: "Sweet", honey: "Sweet", vanilla: "Sweet",
  almond: "Nutty", hazelnut: "Nutty", nuts: "Nutty", nutty: "Nutty",
};

function splitFlavorNotes(flavorNotes?: string | null) {
  return (flavorNotes ?? "")
    .split(",")
    .map((note) => note.trim())
    .filter(Boolean);
}

export function extractFlavorFamilies(flavorNotes?: string | null) {
  return [...new Set(
    splitFlavorNotes(flavorNotes)
      .map((note) => FAMILY_BY_NOTE[note.toLowerCase()])
      .filter((family): family is string => Boolean(family)),
  )];
}

export function extractFlavorLabels(flavorNotes?: string | null) {
  const labels = new Map<string, string>();
  splitFlavorNotes(flavorNotes).forEach((note) => {
    const label = FAMILY_BY_NOTE[note.toLowerCase()] ?? `${note[0].toUpperCase()}${note.slice(1).toLowerCase()}`;
    const key = label.toLocaleLowerCase();
    if (!labels.has(key)) labels.set(key, label);
  });
  return [...labels.values()];
}

export function calculateTasteProfile(logs: TasteLog[]) {
  const sums = Object.fromEntries(SENSORY_DIMENSIONS.map((dimension) => [dimension, 0])) as Record<SensoryDimension, number>;
  const weights = { ...sums };
  let contributingBrews = 0;
  let totalWeight = 0;

  for (const log of logs) {
    const score = typeof log.score === "number" ? log.score : null;
    if (score === null) continue;
    const weight = Math.max(score - 5, 0);
    if (!weight) continue;
    let contributed = false;
    for (const dimension of SENSORY_DIMENSIONS) {
      const rating = log[dimension];
      if (typeof rating !== "number") continue;
      sums[dimension] += rating * weight;
      weights[dimension] += weight;
      contributed = true;
    }
    if (contributed) { contributingBrews += 1; totalWeight += weight; }
  }

  return {
    dimensions: Object.fromEntries(SENSORY_DIMENSIONS.map((dimension) => [
      dimension,
      weights[dimension] ? Number((sums[dimension] / weights[dimension]).toFixed(2)) : null,
    ])) as Record<SensoryDimension, number | null>,
    totalBrews: logs.length,
    contributingBrews,
    totalWeight: Number(totalWeight.toFixed(2)),
  };
}

export function calculateFlavorFamilies(logs: TasteLog[]) {
  const weights: Record<string, number> = {};
  const counts: Record<string, number> = {};
  for (const log of logs) {
    const weight = Math.max((typeof log.score === "number" ? log.score : 0) - 5, 0);
    if (!weight) continue;
    const families = extractFlavorFamilies(log.flavor_notes);
    families.forEach((family) => { weights[family] = (weights[family] ?? 0) + weight; counts[family] = (counts[family] ?? 0) + 1; });
  }
  return Object.entries(weights).map(([family, weight]) => ({ family, weight, brewCount: counts[family] })).sort((a, b) => b.weight - a.weight || a.family.localeCompare(b.family));
}

export function calculateAutomaticBeanPreference(logs: TasteLog[]) {
  const fields = ["acidity", "sweetness", "body"] as const;
  const source = { acidity: "predicted_acidity", sweetness: "predicted_sweetness", body: "predicted_body" } as const;
  const sums = { acidity: 0, sweetness: 0, body: 0 };
  const weights = { ...sums };
  let contributingBrews = 0;
  for (const log of logs) {
    const weight = Math.max((typeof log.score === "number" ? log.score : 0) - 5, 0);
    if (!weight || !log.bean_profile) continue;
    let contributed = false;
    fields.forEach((field) => {
      const value = log.bean_profile?.[source[field]];
      if (typeof value !== "number") return;
      sums[field] += value * weight;
      weights[field] += weight;
      contributed = true;
    });
    if (contributed) contributingBrews += 1;
  }
  return {
    dimensions: Object.fromEntries(fields.map((field) => [field, weights[field] ? Number((sums[field] / weights[field]).toFixed(2)) : null])) as Record<(typeof fields)[number], number | null>,
    contributingBrews,
  };
}

export function sensoryCoverage(contributingBrews: number) {
  if (contributingBrews >= 7) return "Established";
  if (contributingBrews >= 3) return "Growing";
  return "Early";
}
