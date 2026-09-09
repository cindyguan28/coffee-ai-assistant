"use client";

import { useState } from "react";
import { RangeField } from "./range-field";

type SensoryValues = Partial<Record<"acidity" | "bitterness" | "sweetness" | "body" | "balance" | "aroma", number | null>>;

export function SensoryCapture({ initialValues }: { initialValues: SensoryValues }) {
  const hasPrimary = ["acidity", "bitterness", "sweetness"].some((name) => initialValues[name as keyof SensoryValues] != null);
  const hasAdvanced = ["body", "balance", "aroma"].some((name) => initialValues[name as keyof SensoryValues] != null);
  const [active, setActive] = useState(hasPrimary || hasAdvanced);
  const [advanced, setAdvanced] = useState(hasAdvanced);

  if (!active) return (
    <section className="sensory-invite">
      <div><span>HELP BUILD MY TASTE</span><h3>How did this cup taste?</h3><p>Add three familiar impressions. Nothing is assumed if you skip this.</p></div>
      <button type="button" onClick={() => setActive(true)}>Add quick taste · 15 sec</button>
    </section>
  );

  return <fieldset className="sensory-fieldset sensory-capture">
    <legend>Your quick taste <span>1 = low, 5 = high intensity</span></legend>
    <p>Describe what you perceived—not whether it was good. These explicit ratings help shape My Taste.</p>
    <div className="sensory-primary">
      <RangeField name="acidity" label="Acidity" min={1} max={5} defaultValue={initialValues.acidity ?? null} suffix="/5" lowLabel="Soft" highLabel="Bright / tangy" />
      <RangeField name="bitterness" label="Bitterness" min={1} max={5} defaultValue={initialValues.bitterness ?? null} suffix="/5" lowLabel="Gentle" highLabel="Strong" />
      <RangeField name="sweetness" label="Natural sweetness" min={1} max={5} defaultValue={initialValues.sweetness ?? null} suffix="/5" lowLabel="Hard to notice" highLabel="Clearly sweet" />
    </div>
    {!advanced ? <button className="sensory-more" type="button" onClick={() => setAdvanced(true)}>+ Describe aroma and body</button> : <div className="sensory-advanced">
      <RangeField name="aroma" label="Aroma" min={1} max={5} defaultValue={initialValues.aroma ?? null} suffix="/5" lowLabel="Subtle" highLabel="Very aromatic" />
      <RangeField name="body" label="Body" min={1} max={5} defaultValue={initialValues.body ?? null} suffix="/5" lowLabel="Light mouthfeel" highLabel="Rich mouthfeel" />
      <label className="balance-field" htmlFor="balance"><span>Balance <small>Optional</small></span><select id="balance" name="balance" defaultValue={initialValues.balance ?? ""}><option value="">Not rated</option><option value="1">Very uneven</option><option value="2">Somewhat uneven</option><option value="3">Neutral</option><option value="4">Mostly balanced</option><option value="5">Harmonious</option></select></label>
    </div>}
  </fieldset>;
}
