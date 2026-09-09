type CoffeeSummaryInput = {
  roast_level?: string | null;
  acidity?: string | null;
  body?: string | null;
  sweetness?: string | null;
  flavor_notes?: string | null;
  predicted_acidity?: string | null;
  predicted_body?: string | null;
  predicted_sweetness?: string | null;
  predicted_notes?: string | null;
  recommended_temp?: string | null;
};

const ROAST_SCORES: Record<string, number> = {
  ultra_light: 1, light: 1, medium_light: 2, medium: 3, medium_dark: 4, dark: 5,
};
const BODY_SCORES: Record<string, number> = {
  light: 1, light_bodied: 1, delicate: 1, silky: 2, smooth: 2, medium: 3,
  round: 3, creamy: 4, heavy: 4, full_bodied: 4, dense: 5, syrupy: 5, very_heavy: 5,
};
const LEVEL_SCORES: Record<string, number> = {
  very_low: 1, very_low_acidity: 1, low: 2, low_acidity: 2, low_medium: 2,
  medium: 3, medium_acidity: 3, medium_high: 4, high: 4, high_acidity: 4,
  very_high: 5, very_high_acidity: 5,
};
const FRUIT = new Set(["fruit", "fruity", "citrus", "lemon", "lime", "orange", "berry", "strawberry", "raspberry", "blueberry", "peach", "apricot", "mango", "tropical_fruit"]);
const FLORAL = new Set(["floral", "jasmine", "rose", "lavender", "orange_blossom"]);
const COMFORT = new Set(["chocolatey", "milk_chocolate", "dark_chocolate", "cocoa", "nutty", "almond", "hazelnut", "caramel", "toffee", "brown_sugar"]);

function clean(value?: string | null) {
  return String(value ?? "").trim().toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");
}

function display(value: string) {
  return value.split("_").map((part) => part ? part[0].toUpperCase() + part.slice(1) : "").join(" ");
}

function first(...values: Array<string | null | undefined>) {
  return values.map(clean).find((value) => value && value !== "unknown") ?? "";
}

export function buildCoffeeSummary(bean: CoffeeSummaryInput) {
  const roast = clean(bean.roast_level);
  const acidity = first(bean.acidity, bean.predicted_acidity);
  const body = first(bean.body, bean.predicted_body);
  const sweetness = first(bean.sweetness, bean.predicted_sweetness);
  const notes = first(bean.flavor_notes, bean.predicted_notes).split(",").map(clean).filter(Boolean);
  const roastScore = ROAST_SCORES[roast] ?? null;
  const bodyScore = BODY_SCORES[body] ?? null;
  const acidityScore = LEVEL_SCORES[acidity] ?? null;
  const sweetnessScore = LEVEL_SCORES[sweetness] ?? null;
  const intensityScore = roastScore && bodyScore ? Math.round(roastScore * 0.6 + bodyScore * 0.4) : roastScore ?? bodyScore;
  const has = (set: Set<string>) => notes.some((note) => set.has(note));

  let profileLabel = roastScore || acidityScore || bodyScore || notes.length ? "Balanced & Smooth" : "Profile building";
  if (sweetnessScore && sweetnessScore >= 4 && bodyScore && bodyScore >= 3) profileLabel = "Sweet & Creamy";
  else if (has(FRUIT) && acidityScore && acidityScore >= 4) profileLabel = "Fruity & Bright";
  else if (has(FLORAL) && roastScore && roastScore <= 2) profileLabel = "Floral & Light";
  else if (has(COMFORT)) profileLabel = "Nutty & Chocolatey";
  else if (roastScore && roastScore >= 4) profileLabel = "Bold & Roasty";

  return {
    roast: { score: roastScore, label: roast ? display(roast) : "Not enough info" },
    intensity: { score: intensityScore, label: intensityScore ? ["", "Very gentle", "Gentle", "Balanced", "Rich", "Intense"][intensityScore] : "Not enough info" },
    acidity: { score: acidityScore, label: acidityScore ? ["", "Very low", "Low", "Balanced", "Bright", "Very bright"][acidityScore] : "Not enough info" },
    profileLabel,
    flavors: notes.slice(0, 4).map(display),
  };
}

export function preparationFor(method: string | null | undefined, recommendedTemp?: string | null) {
  const value = clean(method);
  if (!value) return null;
  const temp = recommendedTemp && recommendedTemp !== "unknown" ? `${recommendedTemp}°C` : null;
  const guidance: Record<string, { label: string; details: Array<string | null> }> = {
    espresso_machine: { label: "Espresso machine", details: ["Start around 1:2", temp] },
    automatic_machine: { label: "Automatic machine", details: ["Use your saved machine program"] },
    v60: { label: "V60", details: ["Start around 1:16", temp] },
    aeropress: { label: "AeroPress", details: ["Start around 1:14", temp] },
    french_press: { label: "French press", details: ["Start around 1:15", temp] },
    moka_pot: { label: "Moka pot", details: ["Fill the basket level; do not tamp"] },
    other: { label: "Your usual method", details: [] },
  };
  const result = guidance[value];
  return result ? { ...result, details: result.details.filter((detail): detail is string => Boolean(detail)) } : null;
}
