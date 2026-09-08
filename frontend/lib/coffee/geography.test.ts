import { describe, expect, it } from "vitest";
import { aggregateCoffeeWorld, normalizeCountry, splitCountries } from "./geography";

describe("coffee geography", () => {
  it("normalizes aliases and ignores unsupported values", () => {
    expect(normalizeCountry(" USA ")).toBe("United States of America");
    expect(normalizeCountry("Cote d'Ivoire")).toBe("Côte d'Ivoire");
    expect(normalizeCountry("Unknown farm")).toBeNull();
    expect(splitCountries("Ethiopia / Kenya, Ethiopia")).toEqual(["Ethiopia", "Kenya"]);
  });

  it("counts distinct beans and brews without losing unrated countries", () => {
    const result = aggregateCoffeeWorld(
      [
        { id: "a", country: "Ethiopia", flavor_notes: "Jasmine, blueberry" },
        { id: "b", country: "Ethiopia / Kenya", flavor_notes: "Chocolate" },
        { id: "c", country: "Brazil", flavor_notes: "Hazelnut" },
      ],
      [
        { id: "1", bean_id: "a", score: 9 },
        { id: "2", bean_id: "a", score: 7 },
        { id: "3", bean_id: "b", score: null },
      ],
    );

    expect(result.find((item) => item.country === "Ethiopia")).toMatchObject({ coffeeCount: 2, brewedCoffeeCount: 2, brewCount: 3, averageLiking: 8 });
    expect(result.find((item) => item.country === "Kenya")).toMatchObject({ coffeeCount: 1, brewCount: 1, averageLiking: null });
    expect(result.find((item) => item.country === "Brazil")).toMatchObject({ coffeeCount: 1, brewCount: 0, averageLiking: null });
    expect(result.find((item) => item.country === "Ethiopia")?.topFlavorFamilies).toEqual(["Berry", "Chocolate", "Floral"]);
  });
});
