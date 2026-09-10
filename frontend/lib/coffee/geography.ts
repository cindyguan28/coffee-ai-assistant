import { extractFlavorLabels } from "./taste";

export type GeographyBean = { id: string; country?: string | null; flavor_notes?: string | null };
export type GeographyBrew = { id: string; bean_id: string; score?: number | null };

export type CountrySummary = {
  country: string;
  coffeeCount: number;
  brewedCoffeeCount: number;
  brewCount: number;
  ratedBrewCount: number;
  averageLiking: number | null;
  topFlavorFamilies: string[];
};

export type CoffeeWorldMode = "explored" | "preference";

export function countryNarrative(summary: CountrySummary, mode: CoffeeWorldMode) {
  if (mode === "explored") {
    const coffee = summary.coffeeCount === 1 ? "coffee" : "coffees";
    const entry = summary.brewCount === 1 ? "journal entry" : "journal entries";
    return `You have saved ${summary.coffeeCount} ${coffee} from ${summary.country} and recorded ${summary.brewCount} ${entry}. This view shows exploration; liking scores do not change it.`;
  }
  if (summary.averageLiking === null) {
    return `${summary.country} is in your collection, but it has no scored journal entries yet. Add a liking score to include it in your Preference view.`;
  }
  const entry = summary.ratedBrewCount === 1 ? "scored journal entry" : "scored journal entries";
  return `Across ${summary.ratedBrewCount} ${entry}, coffees from ${summary.country} average ${summary.averageLiking}/10. This view reflects what you personally enjoyed.`;
}

const COUNTRY_ALIASES: Record<string, string> = {
  bolivia: "Bolivia",
  brazil: "Brazil",
  burundi: "Burundi",
  china: "China",
  colombia: "Colombia",
  "costa rica": "Costa Rica",
  "côte d'ivoire": "Côte d'Ivoire",
  "cote d'ivoire": "Côte d'Ivoire",
  "ivory coast": "Côte d'Ivoire",
  "democratic republic of the congo": "Dem. Rep. Congo",
  "dr congo": "Dem. Rep. Congo",
  "drc": "Dem. Rep. Congo",
  "dominican republic": "Dominican Rep.",
  ecuador: "Ecuador",
  "el salvador": "El Salvador",
  ethiopia: "Ethiopia",
  guatemala: "Guatemala",
  honduras: "Honduras",
  india: "India",
  indonesia: "Indonesia",
  jamaica: "Jamaica",
  kenya: "Kenya",
  laos: "Laos",
  madagascar: "Madagascar",
  malawi: "Malawi",
  mexico: "Mexico",
  myanmar: "Myanmar",
  nepal: "Nepal",
  nicaragua: "Nicaragua",
  panama: "Panama",
  "papua new guinea": "Papua New Guinea",
  peru: "Peru",
  philippines: "Philippines",
  rwanda: "Rwanda",
  tanzania: "Tanzania",
  thailand: "Thailand",
  uganda: "Uganda",
  "united states": "United States of America",
  "united states of america": "United States of America",
  usa: "United States of America",
  "u.s.a.": "United States of America",
  venezuela: "Venezuela",
  vietnam: "Vietnam",
  yemen: "Yemen",
  zambia: "Zambia",
  zimbabwe: "Zimbabwe",
};

export function normalizeCountry(value?: string | null) {
  const cleaned = (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  return COUNTRY_ALIASES[cleaned] ?? null;
}

export function splitCountries(value?: string | null) {
  return [...new Set(
    (value ?? "")
      .split(/\s*(?:,|\/|;|\band\b|&)\s*/i)
      .map(normalizeCountry)
      .filter((country): country is string => Boolean(country)),
  )];
}

export function aggregateCoffeeWorld(beans: GeographyBean[], brews: GeographyBrew[]) {
  const beanCountries = new Map<string, string[]>();
  const summaries = new Map<string, {
    beanIds: Set<string>;
    brewedBeanIds: Set<string>;
    brewIds: Set<string>;
    scores: number[];
    families: Map<string, number>;
  }>();

  for (const bean of beans) {
    const countries = splitCountries(bean.country);
    beanCountries.set(bean.id, countries);
    for (const country of countries) {
      const summary = summaries.get(country) ?? { beanIds: new Set(), brewedBeanIds: new Set(), brewIds: new Set(), scores: [], families: new Map() };
      summary.beanIds.add(bean.id);
      for (const flavor of extractFlavorLabels(bean.flavor_notes)) {
        summary.families.set(flavor, (summary.families.get(flavor) ?? 0) + 1);
      }
      summaries.set(country, summary);
    }
  }

  for (const brew of brews) {
    for (const country of beanCountries.get(brew.bean_id) ?? []) {
      const summary = summaries.get(country)!;
      summary.brewIds.add(brew.id);
      summary.brewedBeanIds.add(brew.bean_id);
      if (typeof brew.score === "number") summary.scores.push(brew.score);
    }
  }

  return [...summaries.entries()].map(([country, summary]): CountrySummary => ({
    country,
    coffeeCount: summary.beanIds.size,
    brewedCoffeeCount: summary.brewedBeanIds.size,
    brewCount: summary.brewIds.size,
    ratedBrewCount: summary.scores.length,
    averageLiking: summary.scores.length
      ? Number((summary.scores.reduce((total, score) => total + score, 0) / summary.scores.length).toFixed(2))
      : null,
    topFlavorFamilies: [...summary.families.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 3)
      .map(([family]) => family),
  })).sort((a, b) => b.coffeeCount - a.coffeeCount || a.country.localeCompare(b.country));
}
