import { describe, expect, it } from "vitest";
import { bestEntryId, experienceDiffersFromReference, filterJournalEntries, groupJournalEntries, journalDetailFacts, journalSensoryFacts, selectStarterBrew, showsWaterTemperature, starterValues, type JournalEntry } from "./journal";

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

  it("uses the latest liked brew as a starting point", () => {
    expect(selectStarterBrew(entries, "a")?.id).toBe("a1");
    expect(selectStarterBrew(entries, "missing")).toBeNull();
  });

  it("copies settings and context but not observed outputs", () => {
    const values = starterValues({ id: "x", brew_method: "espresso_machine", grind_setting: 7, default_dose_g: 9, espresso_volume_ml: 20, extraction_time_sec: 25 });
    expect(values).toMatchObject({ brew_method: "espresso_machine", grind_setting: 7, default_dose_g: 9 });
    expect(values).not.toHaveProperty("espresso_volume_ml");
    expect(values).not.toHaveProperty("extraction_time_sec");
  });

  it("omits repeated default equipment and summary facts from expanded details", () => {
    const facts = journalDetailFacts({ id: "x", machine_model: "Sage", grinder_type: "Built in", grind_setting: 7, brew_method: "espresso_machine", score: 8, default_dose_g: 9, espresso_volume_ml: 20 }, { machineModel: "Sage", grinderType: "Built in" });
    expect(facts).toEqual([["Dose", "9 g"], ["Actual yield", "20 ml"]]);
  });

  it("calls out equipment only when it differs from the saved setup", () => {
    expect(journalDetailFacts({ id: "x", machine_model: "Picopresso" }, { machineModel: "Sage" })[0]).toEqual(["Different machine", "Picopresso"]);
  });

  it("combines milk type and amount into one history fact", () => {
    expect(journalDetailFacts({ id: "x", milk_type: "oat_milk", milk_ml: 80 })).toEqual([["Milk", "oat_milk · 80 ml"]]);
  });

  it("puts the Bean with the most recently added entry first", () => {
    const groups = groupJournalEntries([
      { id: "new", bean_id: "old-date", brew_date: "2026-01-01", created_at: "2026-09-10T12:00:00Z", beans: { name: "Recently logged" } },
      { id: "old", bean_id: "new-date", brew_date: "2026-09-09", created_at: "2026-09-09T12:00:00Z", beans: { name: "Previously logged" } },
    ], "bean");
    expect(groups.map((group) => group.label)).toEqual(["Recently logged", "Previously logged"]);
  });

  it("keeps explicit perception and reference disagreement visible without rewriting either", () => {
    const entry: JournalEntry = { id: "x", acidity: 5, perceived_flavor_notes: "grapefruit peel", beans: { acidity: "low", flavor_notes: "milk chocolate" } };
    expect(journalSensoryFacts(entry)).toContainEqual(["Acidity", "5/5"]);
    expect(experienceDiffersFromReference(entry)).toBe(true);
    expect(entry.beans?.flavor_notes).toBe("milk chocolate");
    expect(entry.perceived_flavor_notes).toBe("grapefruit peel");
  });
});
