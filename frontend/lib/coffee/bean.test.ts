import { describe, expect, it } from "vitest";
import { validateBean } from "./bean";

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
});
