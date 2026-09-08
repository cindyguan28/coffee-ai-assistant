import { describe, expect, it } from "vitest";
import { validateBrewLog } from "./brew";

function form(values: Record<string, string>) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}

const valid = { bean_id: "bean-1", brew_date: "2026-09-08", score: "8.5" };

describe("validateBrewLog", () => {
  it("accepts a compact brew log", () => {
    const result = validateBrewLog(form(valid));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.score).toBe(8.5);
  });

  it.each([
    [{ ...valid, bean_id: "" }, "Choose"],
    [{ ...valid, brew_date: "today" }, "date"],
    [{ ...valid, score: "11" }, "score"],
    [{ ...valid, acidity: "6" }, "acidity"],
    [{ ...valid, grind_setting: "1.5" }, "grind"],
  ])("rejects invalid input", (values, message) => {
    const result = validateBrewLog(form(values));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message.toLowerCase()).toContain(message.toLowerCase());
  });
});
