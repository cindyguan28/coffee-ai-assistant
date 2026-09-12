import { describe, expect, it } from "vitest";
import { PRODUCT_FORMAT_LABELS, supportsBeanMetadata, supportsCapsuleMetadata } from "./product";

describe("Coffee Product model", () => {
  it("keeps bean metadata format-specific", () => {
    expect(supportsBeanMetadata("whole_bean")).toBe(true);
    expect(supportsBeanMetadata("ground_coffee")).toBe(true);
    expect(supportsBeanMetadata("capsule")).toBe(false);
  });

  it("represents capsules without treating them as beans", () => {
    expect(supportsCapsuleMetadata("capsule")).toBe(true);
    expect(PRODUCT_FORMAT_LABELS.capsule).toBe("Capsule / pod");
  });
});
