import { describe, expect, it } from "vitest";
import { calculateAutomaticBeanPreference, calculateFlavorFamilies, calculateTasteProfile, explainTasteDimension, sensoryCoverage } from "./taste";

describe("calculateTasteProfile", () => {
  it("matches the liking-weighted Python behavior", () => {
    const result = calculateTasteProfile([
      { score: 6, acidity: 1, sweetness: 2, bitterness: 3, body: 4, balance: 5, aroma: 2 },
      { score: 9, acidity: 5, sweetness: 4, bitterness: 3, body: 2, balance: 1, aroma: 5 },
    ]);
    expect(result.dimensions.acidity).toBe(4.2);
    expect(result.dimensions.aroma).toBe(4.4);
    expect(result.totalWeight).toBe(5);
  });
  it("does not invent missing values or use scores at five", () => {
    const result = calculateTasteProfile([{ score: 5, acidity: 5 }, { score: 8, acidity: 4, aroma: null }]);
    expect(result.dimensions.acidity).toBe(4);
    expect(result.dimensions.aroma).toBeNull();
    expect(result.contributingBrews).toBe(1);
  });
  it("supports an empty history", () => expect(calculateTasteProfile([]).totalBrews).toBe(0));
});

describe("calculateFlavorFamilies", () => {
  it("counts each family once per highly liked brew", () => {
    expect(calculateFlavorFamilies([{ score: 9, flavor_notes: "lemon,orange" }, { score: 7, flavor_notes: "cocoa" }])).toEqual([
      { family: "Citrus", weight: 4, brewCount: 1 },
      { family: "Chocolate", weight: 2, brewCount: 1 },
    ]);
  });

  it("keeps perceived flavor evidence separate from reference flavor claims", () => {
    const logs = [{ score: 9, flavor_notes: "cocoa", perceived_flavor_notes: "grapefruit peel, green apple" }];
    expect(calculateFlavorFamilies(logs)).toEqual([{ family: "Chocolate", weight: 4, brewCount: 1 }]);
    expect(calculateFlavorFamilies(logs, "perceived")).toEqual([
      { family: "Citrus", weight: 4, brewCount: 1 },
      { family: "Orchard fruit", weight: 4, brewCount: 1 },
    ]);
  });
});

describe("explainTasteDimension", () => {
  it("explains that a value is a sensory average, not a quality score", () => {
    expect(explainTasteDimension("acidity", 3)).toContain("weighted average");
    expect(explainTasteDimension("acidity", 3)).toContain("soft (1) to bright (5)");
  });
  it("handles missing ratings", () => expect(explainTasteDimension("aroma", null)).toContain("Not enough"));
});

describe("automatic Bean preference", () => {
  it("weights only available Bean Profile dimensions by liking", () => {
    const result = calculateAutomaticBeanPreference([
      { score: 6, bean_profile: { predicted_acidity: 1, predicted_sweetness: 2, predicted_body: 3 } },
      { score: 9, bean_profile: { predicted_acidity: 5, predicted_sweetness: 4, predicted_body: 2 } },
    ]);
    expect(result.dimensions).toEqual({ acidity: 4.2, sweetness: 3.6, body: 2.2 });
    expect(result.contributingBrews).toBe(2);
  });

  it("does not fabricate unavailable dimensions", () => {
    expect(calculateAutomaticBeanPreference([{ score: 9, bean_profile: null }]).dimensions).toEqual({ acidity: null, sweetness: null, body: null });
  });

  it("describes sensory coverage without implying statistical certainty", () => {
    expect([sensoryCoverage(1), sensoryCoverage(4), sensoryCoverage(8)]).toEqual(["Early", "Growing", "Established"]);
  });
});
