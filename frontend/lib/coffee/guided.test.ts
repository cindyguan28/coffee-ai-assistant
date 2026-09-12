import { describe, expect, it } from "vitest";
import { filterGuidedOptions, mergeGuidedOptions } from "./guided";

describe("guided coffee metadata", () => {
  it("merges saved custom values without case-insensitive duplicates", () => {
    expect(mergeGuidedOptions(["The Barn", "Five Elephant"], ["the barn", "Local Roaster"]))
      .toEqual(["the barn", "Five Elephant", "Local Roaster"]);
  });

  it("filters suggestions using normalized partial text", () => {
    expect(filterGuidedOptions(["Coffee Circle", "The Barn", "Five Elephant"], "  coffee  "))
      .toEqual(["Coffee Circle"]);
  });
});

