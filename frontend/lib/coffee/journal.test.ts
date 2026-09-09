import { describe, expect, it } from "vitest";
import { bestEntryId, filterJournalEntries, groupJournalEntries, showsWaterTemperature, type JournalEntry } from "./journal";

const entries: JournalEntry[] = [
  { id: "a1", bean_id: "a", brew_date: "2026-09-09", score: 7, brew_method: "espresso_machine", notes: "Too bitter", beans: { name: "Halo", roaster: "The Barn" } },
  { id: "a2", bean_id: "a", brew_date: "2026-09-08", score: 9, beans: { name: "Halo", roaster: "The Barn" } },
  { id: "b1", bean_id: "b", brew_date: "2026-08-20", score: 8, beans: { name: "Serra", roaster: "Coffee Circle" } },
];

describe("journal organization", () => {
  it("groups by Bean with comparison metadata", () => {
    const groups = groupJournalEntries(entries, "bean");
    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({ label: "Halo", bestScore: 9, latestDate: "2026-09-09" });
    expect(groups[0].entries).toHaveLength(2);
  });

  it("groups dates by month", () => {
    expect(groupJournalEntries(entries, "date").map((group) => group.label)).toEqual(["September 2026", "August 2026"]);
  });

  it("searches Bean, roaster, method and notes", () => {
    expect(filterJournalEntries(entries, "the barn")).toHaveLength(2);
    expect(filterJournalEntries(entries, "espresso machine").map((entry) => entry.id)).toEqual(["a1"]);
    expect(filterJournalEntries(entries, "bitter").map((entry) => entry.id)).toEqual(["a1"]);
  });

  it("selects the highest-rated recipe", () => {
    expect(bestEntryId(entries.slice(0, 2))).toBe("a2");
  });

  it("treats water temperature as a primary fact only for manual methods", () => {
    expect(showsWaterTemperature("v60")).toBe(true);
    expect(showsWaterTemperature("AeroPress")).toBe(true);
    expect(showsWaterTemperature("french press")).toBe(true);
    expect(showsWaterTemperature("espresso_machine")).toBe(false);
    expect(showsWaterTemperature("automatic_machine")).toBe(false);
    expect(showsWaterTemperature(null)).toBe(false);
  });
});
