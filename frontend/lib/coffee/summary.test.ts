import { describe, expect, it } from "vitest";
import { buildCoffeeSummary, preparationFor } from "./summary";

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

describe("preparationFor", () => {
  it("uses the user's espresso context instead of a Bean-level V60 default", () => {
    expect(preparationFor("espresso_machine", "90")).toEqual({
      label: "Espresso machine",
      details: ["Start around 1:2", "90°C"],
    });
  });

  it("shows no fabricated preparation when the user has no known method", () => {
    expect(preparationFor(null, "92")).toBeNull();
  });
});
