export type BeanProfileInput = {
  country?: string | null;
  process?: string | null;
  roast_level?: string | null;
  flavor_notes?: string | null;
};

const ORIGINS: Record<string, { acidity: string; body: string; sweetness: string; notes: string[] }> = {
  ethiopia: { acidity: "high", body: "light", sweetness: "high", notes: ["floral", "citrus", "berry"] },
  kenya: { acidity: "high", body: "medium", sweetness: "high", notes: ["blackcurrant", "citrus"] },
  colombia: { acidity: "medium", body: "medium", sweetness: "high", notes: ["caramel", "red fruit"] },
  brazil: { acidity: "low", body: "full", sweetness: "medium", notes: ["chocolate", "nuts"] },
  guatemala: { acidity: "medium", body: "full", sweetness: "medium", notes: ["cocoa", "stone fruit"] },
};

export function generateBeanProfile(bean: BeanProfileInput) {
  const country = bean.country?.split(/[,;/]/)[0]?.trim().toLowerCase() ?? "";
  const origin = ORIGINS[country];
  const roast = bean.roast_level?.trim().toLowerCase() ?? "";
  const process = bean.process?.trim().toLowerCase() ?? "";
  const suppliedNotes = (bean.flavor_notes ?? "").split(",").map((note) => note.trim()).filter(Boolean);
  const notes = [...new Set([...suppliedNotes, ...(origin?.notes ?? [])])].slice(0, 6);

  let acidity = origin?.acidity ?? "unknown";
  let body = origin?.body ?? "medium";
  let sweetness = origin?.sweetness ?? "medium";
  let temp: string | null = null;

  if (roast.includes("dark")) {
    acidity = "low";
    body = "full";
    temp = "90";
  } else if (roast.includes("light")) {
    temp = "94";
  } else if (roast) {
    temp = "92";
  }
  if (process.includes("natural")) sweetness = "high";
  if (process.includes("washed") && acidity === "unknown") acidity = "medium-high";

  const matchedSignals = [origin, roast, process, suppliedNotes.length ? suppliedNotes : null].filter(Boolean).length;
  return {
    predicted_acidity: acidity,
    predicted_body: body,
    predicted_sweetness: sweetness,
    predicted_notes: notes.join(","),
    recommended_method: null,
    recommended_ratio: null,
    recommended_temp: temp,
    confidence: Math.min(1, Number((matchedSignals / 4).toFixed(3))),
    reasoning: matchedSignals
      ? "Generated from the available origin, process, roast and flavor information."
      : "Generated with neutral defaults because only limited bean information is available.",
  };
}
