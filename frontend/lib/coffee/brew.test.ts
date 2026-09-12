import { describe, expect, it } from "vitest";
import { brewFieldVisibility, validateBrewLog } from "./brew";

function form(values: Record<string, string>) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}

function formWithProblems(values: Record<string, string>, problems: string[]) {
  const data = form(values);
  problems.forEach((problem) => data.append("problem_tags", problem));
  return data;
}

const valid = { bean_id: "bean-1", brew_date: "2026-09-08", score: "8.5", grind_setting: "10" };

describe("validateBrewLog", () => {
  it("accepts a compact brew log", () => {
    const result = validateBrewLog(form(valid));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.score).toBe(8.5);
      expect(result.value).toMatchObject({ acidity: null, bitterness: null, sweetness: null, body: null, balance: null, aroma: null });
    }
  });

  it("preserves multiple guided problem tags", () => {
    const result = validateBrewLog(formWithProblems(valid, ["too_sour", "too_weak"]));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.problem_tags).toBe("too_sour,too_weak");
  });

  it.each([
    [{ ...valid, bean_id: "" }, "Choose"],
    [{ ...valid, brew_date: "today" }, "date"],
    [{ ...valid, score: "11" }, "score"],
    [{ ...valid, acidity: "6" }, "acidity"],
    [{ ...valid, water_temp_c: "101" }, "water temp"],
    [{ ...valid, grind_setting: "1.5" }, "grind"],
    [{ ...valid, grind_setting: "" }, "grind"],
  ])("rejects invalid input", (values, message) => {
    const result = validateBrewLog(form(values));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message.toLowerCase()).toContain(message.toLowerCase());
  });

  it("keeps water temperature optional and stores it when supplied", () => {
    const withoutTemperature = validateBrewLog(form(valid));
    const withTemperature = validateBrewLog(form({ ...valid, water_temp_c: "93.5" }));
    expect(withoutTemperature.ok && withoutTemperature.value.water_temp_c).toBeNull();
    expect(withTemperature.ok && withTemperature.value.water_temp_c).toBe(93.5);
  });

  it("stores drink, milk type and per-cup milk pairing independently", () => {
    const result = validateBrewLog(form({
      ...valid,
      drink_type: "cortado",
      milk_type: "barista_oat_milk",
      milk_pairing: "excellent_match",
    }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toMatchObject({
      drink_type: "cortado",
      milk_type: "barista_oat_milk",
      milk_pairing: "excellent_match",
    });
  });

  it("preserves the user's flavor wording and stores normalized families separately", () => {
    const result = validateBrewLog(form({
      ...valid,
      perceived_flavor_notes: "grapefruit peel, green apple, Floral",
      taste_description: "Much sharper than the package suggested.",
    }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toMatchObject({
      perceived_flavor_notes: "grapefruit peel, green apple, Floral",
      normalized_flavor_families: ["Citrus", "Orchard fruit", "Floral"],
      taste_description: "Much sharper than the package suggested.",
    });
  });
});

describe("brewFieldVisibility", () => {
  it("shows milk only for milk drinks or an existing milk record", () => {
    expect(brewFieldVisibility("espresso_machine", "espresso").milk).toBe(false);
    expect(brewFieldVisibility("espresso_machine", "cappuccino").milk).toBe(true);
    expect(brewFieldVisibility("espresso_machine", "espresso", true).milk).toBe(true);
  });

  it("shows water for manual methods and omits automatic dose unless already recorded", () => {
    expect(brewFieldVisibility("v60", "filter_coffee")).toMatchObject({ water: true, dose: true });
    expect(brewFieldVisibility("espresso_machine", "espresso").water).toBe(false);
    expect(brewFieldVisibility("automatic_machine", "espresso").dose).toBe(false);
    expect(brewFieldVisibility("automatic_machine", "espresso", false, true).dose).toBe(true);
    expect(brewFieldVisibility("espresso_machine", "espresso", false, false, true).water).toBe(true);
    expect(brewFieldVisibility("", "", false, false, false, true).observedExtraction).toBe(true);
  });
});
