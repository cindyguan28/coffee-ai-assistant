export type GuidedOption = { value: string; label: string };

function choices(values: string[]): GuidedOption[] {
  return values.map((value) => ({
    value,
    label: value.split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join(" "),
  }));
}

export const BREW_METHOD_OPTIONS = choices([
  "espresso_machine", "automatic_machine", "moka_pot", "v60", "aeropress", "french_press", "other",
]);
export const DRINK_TYPE_OPTIONS = choices([
  "espresso", "lungo", "americano", "cappuccino", "latte", "flat_white", "milk_coffee", "other",
]);
export const GRINDER_TYPE_OPTIONS = choices([
  "built_in_grinder", "external_electric_grinder", "manual_grinder", "pre_ground", "unknown",
]);
export const MILK_TYPE_OPTIONS = choices([
  "whole_milk", "low_fat_milk", "lactose_free_milk", "oat_milk", "soy_milk", "almond_milk", "other",
]);
export const TASTE_RESULT_OPTIONS = choices([
  "excellent", "good", "okay", "too_sour", "too_bitter", "too_weak", "too_strong", "watery",
  "astringent", "flat", "good_with_milk", "bad_with_milk",
]);
export const PROBLEM_TAG_OPTIONS = choices([
  "too_sour", "too_bitter", "too_weak", "too_strong", "watery", "astringent", "flat",
  "not_enough_body", "milk_too_much", "milk_too_little", "good_with_milk", "good_balance",
]);
export const NEXT_ADJUSTMENT_OPTIONS = choices([
  "grind_finer", "grind_coarser", "increase_dose", "decrease_dose", "increase_milk", "decrease_milk",
  "try_as_espresso", "try_with_milk", "keep_setting",
]);

export const SENSORY_DIMENSIONS = [
  { name: "acidity", label: "Acidity", hint: "Low / soft", high: "Bright / vivid" },
  { name: "sweetness", label: "Sweetness", hint: "Subtle", high: "Pronounced" },
  { name: "bitterness", label: "Bitterness", hint: "Gentle", high: "Strong" },
  { name: "body", label: "Body", hint: "Light", high: "Full" },
  { name: "balance", label: "Balance", hint: "Uneven", high: "Harmonious" },
  { name: "aroma", label: "Aroma", hint: "Delicate", high: "Intense" },
] as const;
