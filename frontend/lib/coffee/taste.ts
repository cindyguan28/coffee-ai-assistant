export const SENSORY_DIMENSIONS = ["acidity", "sweetness", "bitterness", "body", "balance", "aroma"] as const;
export type SensoryDimension = (typeof SENSORY_DIMENSIONS)[number];
export type TasteLog = Partial<Record<SensoryDimension, number | null>> & { score?: number | null; flavor_notes?: string | null };

const FAMILY_BY_NOTE: Record<string, string> = {
  lemon: "Citrus", orange: "Citrus", bergamot: "Citrus", citrus: "Citrus",
  strawberry: "Berry", blueberry: "Berry", raspberry: "Berry", berry: "Berry", blackcurrant: "Berry",
  jasmine: "Floral", floral: "Floral", rose: "Floral",
  peach: "Stone fruit", apricot: "Stone fruit", plum: "Stone fruit", "stone fruit": "Stone fruit",
  cocoa: "Chocolate", chocolate: "Chocolate", cacao: "Chocolate",
  caramel: "Sweet", honey: "Sweet", vanilla: "Sweet",
  almond: "Nutty", hazelnut: "Nutty", nuts: "Nutty", nutty: "Nutty",
};

export function extractFlavorFamilies(flavorNotes?: string | null) {
  return [...new Set(
    (flavorNotes ?? "")
      .split(",")
      .map((note) => FAMILY_BY_NOTE[note.trim().toLowerCase()])
      .filter((family): family is string => Boolean(family)),
  )];
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
