export type BrewValidation =
  | { ok: true; value: Record<string, string | number | null> }
  | { ok: false; message: string };

function stringValue(formData: FormData, field: string, maxLength = 2000) {
  const value = String(formData.get(field) ?? "").trim();
  return value ? value.slice(0, maxLength) : null;
}

function numberValue(
  formData: FormData,
  field: string,
  minimum: number,
  maximum: number,
  integer = false,
) {
  const raw = stringValue(formData, field, 40);
  if (raw === null) return { ok: true as const, value: null };
  const value = Number(raw);
  if (!Number.isFinite(value) || value < minimum || value > maximum || (integer && !Number.isInteger(value))) {
    return { ok: false as const };
  }
  return { ok: true as const, value };
}

export function validateBrewLog(formData: FormData): BrewValidation {
  const beanId = stringValue(formData, "bean_id", 100);
  if (!beanId) return { ok: false, message: "Choose one of your coffee beans." };

  const brewDate = stringValue(formData, "brew_date", 10);
  if (!brewDate || !/^\d{4}-\d{2}-\d{2}$/.test(brewDate)) {
    return { ok: false, message: "Choose a valid brew date." };
  }

  const numericFields: Array<[string, number, number, boolean]> = [
    ["default_dose_g", 0, 1000, false],
    ["espresso_volume_ml", 0, 5000, false],
    ["extraction_time_sec", 0, 3600, false],
    ["milk_ml", 0, 5000, false],
    ["grind_setting", 0, 1000, true],
    ["score", 0, 10, false],
    ["acidity", 1, 5, true],
    ["bitterness", 1, 5, true],
    ["body", 1, 5, true],
    ["sweetness", 1, 5, true],
    ["balance", 1, 5, true],
    ["aroma", 1, 5, true],
  ];
  const numbers: Record<string, number | null> = {};
  for (const [field, minimum, maximum, integer] of numericFields) {
    const result = numberValue(formData, field, minimum, maximum, integer);
    if (!result.ok) return { ok: false, message: `Check the value entered for ${field.replaceAll("_", " ")}.` };
    numbers[field] = result.value;
  }
  if (numbers.score === null) return { ok: false, message: "Add a liking score from 0 to 10." };

  return {
    ok: true,
    value: {
      bean_id: beanId,
      brew_date: brewDate,
      brew_method: stringValue(formData, "brew_method", 100),
      drink_type: stringValue(formData, "drink_type", 100),
      machine_model: stringValue(formData, "machine_model", 200),
      grinder_type: stringValue(formData, "grinder_type", 200),
      milk_type: stringValue(formData, "milk_type", 100),
      taste_result: stringValue(formData, "taste_result", 500),
      problem_tags: stringValue(formData, "problem_tags", 500),
      next_adjustment: stringValue(formData, "next_adjustment", 1000),
      notes: stringValue(formData, "notes", 2000),
      ...numbers,
    },
  };
}
