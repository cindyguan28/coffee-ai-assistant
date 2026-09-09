import { describe, expect, it } from "vitest";
import { generateBeanProfile } from "./profile";

describe("generateBeanProfile", () => {
  it("creates an origin-aware profile for a new bean", () => {
    const profile = generateBeanProfile({
      country: "Ethiopia",
      process: "Natural",
      roast_level: "Light",
      flavor_notes: "Jasmine,peach",
    });
    expect(profile.predicted_acidity).toBe("high");
    expect(profile.predicted_sweetness).toBe("high");
    expect(profile.predicted_notes).toContain("Jasmine");
    expect(profile.recommended_method).toBeNull();
    expect(profile.recommended_temp).toBe("94");
    expect(profile.confidence).toBe(1);
  });

  it("returns safe defaults when only a name is known", () => {
    const profile = generateBeanProfile({});
    expect(profile.predicted_acidity).toBe("unknown");
    expect(profile.recommended_ratio).toBeNull();
    expect(profile.recommended_temp).toBeNull();
    expect(profile.confidence).toBe(0);
  });
});
