import { describe, expect, it } from "vitest";
import { compatibleGuidedValue, normalizeGuidedValue, parseOriginCountries, validateBean } from "./bean";

describe("Bean validation", () => {
  it("accepts guided and custom metadata and deduplicates flavor labels", () => {
    const form = new FormData();
    form.set("name", "Halo Beriti"); form.set("roaster", "Five Elephant");
    form.set("country", "Ethiopia"); form.set("package_weight_g", "250"); form.set("price", "17.5");
    form.append("flavor_notes", "Jasmine"); form.append("flavor_notes", "Peach");
    form.set("custom_flavor_notes", "jasmine, white tea");
    const result = validateBean(form);
    expect(result.ok && result.value).toMatchObject({ name: "Halo Beriti", package_weight_g: 250, flavor_notes: "jasmine,Peach,white tea" });
  });

  it("rejects missing names and invalid package weights", () => {
    expect(validateBean(new FormData()).ok).toBe(false);
    const form = new FormData(); form.set("name", "Coffee"); form.set("package_weight_g", "0");
    expect(validateBean(form)).toEqual({ ok: false, message: "Enter a valid package weight above zero." });
  });

  it("matches legacy enum values without erasing their meaning", () => {
    expect(normalizeGuidedValue("  GOOD_with-Milk ")).toBe("good with milk");
    expect(compatibleGuidedValue("medium_dark", ["Light", "Medium dark"])).toBe("Medium dark");
    expect(compatibleGuidedValue("good_with_milk", ["Good with milk"])).toBe("Good with milk");
    expect(compatibleGuidedValue("roaster_custom_value", ["Known"])).toBe("roaster_custom_value");
  });

  it("stores multiple origins while retaining a compatible country summary", () => {
    const form = new FormData();
    form.set("name", "House blend");
    form.append("origin_countries", "Brazil");
    form.append("origin_countries", "India");
    const result = validateBean(form);
    expect(result.ok && result.value).toMatchObject({ country: "Brazil, India", origin_countries: ["Brazil", "India"] });
    expect(parseOriginCountries("Brazil / India, Brazil")).toEqual(["Brazil", "India"]);
  });
});
