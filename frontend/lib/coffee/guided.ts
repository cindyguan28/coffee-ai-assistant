import { normalizeGuidedValue } from "./bean";

export function mergeGuidedOptions(base: readonly string[], saved: Array<string | null | undefined>) {
  const values = [...base, ...saved.filter((value): value is string => Boolean(value?.trim()))];
  return [...new Map(values.map((value) => [normalizeGuidedValue(value), value.trim()])).values()];
}

export function filterGuidedOptions(options: readonly string[], query: string, limit = 10) {
  const normalized = normalizeGuidedValue(query);
  if (!normalized) return options.slice(0, limit);
  return options
    .filter((option) => normalizeGuidedValue(option).includes(normalized))
    .slice(0, limit);
}

