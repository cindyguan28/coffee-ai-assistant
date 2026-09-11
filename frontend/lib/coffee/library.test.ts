import { describe, expect, it } from "vitest";
import { libraryView, matchesLibraryView, validateLibraryState } from "./library";

describe("Coffee library state", () => {
  const bean = { favorite: true, lifecycle_state: "finished", repurchase_intent: "would_not_buy_again" };

  it("normalizes supported filters and safely falls back to all", () => {
    expect(libraryView("favorites")).toBe("favorites");
    expect(libraryView("unexpected")).toBe("all");
  });

  it("filters independent lifecycle and intent signals", () => {
    expect(matchesLibraryView(bean, "favorites")).toBe(true);
    expect(matchesLibraryView(bean, "finished")).toBe(true);
    expect(matchesLibraryView(bean, "not-for-me")).toBe(true);
    expect(matchesLibraryView(bean, "buy-again")).toBe(false);
  });

  it("validates state updates without conflating intent and lifecycle", () => {
    expect(validateLibraryState("favorite", "true")).toEqual({ ok: true, value: true });
    expect(validateLibraryState("lifecycle_state", "finished")).toEqual({ ok: true, value: "finished" });
    expect(validateLibraryState("repurchase_intent", "would_not_buy_again")).toEqual({ ok: true, value: "would_not_buy_again" });
    expect(validateLibraryState("repurchase_intent", "favorite")).toEqual({ ok: false });
  });
});
