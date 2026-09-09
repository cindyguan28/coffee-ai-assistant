import { describe, expect, it } from "vitest";
import { buildCoffeeSummary } from "./summary";

describe("buildCoffeeSummary", () => {
  it("ports the consumer Roast, Intensity and Acidity scales", () => {
    const summary = buildCoffeeSummary({
      roast_level: "medium_dark",
      predicted_body: "full_bodied",
      predicted_acidity: "low",
      predicted_notes: "cocoa,hazelnut",
    });
    expect(summary.roast.score).toBe(4);
    expect(summary.intensity.score).toBe(4);
    expect(summary.acidity.score).toBe(2);
    expect(summary.profileLabel).toBe("Nutty & Chocolatey");
  });

  it("does not invent reference scores from missing data", () => {
    const summary = buildCoffeeSummary({});
    expect(summary.roast.score).toBeNull();
    expect(summary.intensity.score).toBeNull();
    expect(summary.acidity.score).toBeNull();
  });
});
