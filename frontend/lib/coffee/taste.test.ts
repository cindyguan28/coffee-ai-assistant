import { describe, expect, it } from "vitest";
import { calculateFlavorFamilies, calculateTasteProfile, explainTasteDimension } from "./taste";

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
});

describe("explainTasteDimension", () => {
  it("explains that a value is a sensory average, not a quality score", () => {
    expect(explainTasteDimension("acidity", 3)).toContain("weighted average");
    expect(explainTasteDimension("acidity", 3)).toContain("soft (1) to bright (5)");
  });
  it("handles missing ratings", () => expect(explainTasteDimension("aroma", null)).toContain("Not enough"));
});
