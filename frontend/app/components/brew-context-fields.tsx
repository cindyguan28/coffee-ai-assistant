"use client";

import { useState } from "react";
import { brewFieldVisibility } from "../../lib/coffee/brew";
import type { GuidedOption } from "../../lib/coffee/brew-options";

type InitialValues = {
  brewMethod: string;
  drinkType: string;
  milkType: string;
  milkMl: string;
  milkPairing: string;
  dose: string;
  yieldMl: string;
  timeSec: string;
  waterTemp: string;
};

function OptionList({ items, current }: { items: GuidedOption[]; current: string }) {
  const legacy = current && !items.some((option) => option.value === current)
    ? [{ value: current, label: current.replaceAll("_", " ") }]
    : [];
  return [...legacy, ...items].map((option) => <option key={option.value} value={option.value}>{option.label}</option>);
}

export function BrewContextFields({ methods, drinks, milks, pairings, initial }: {
  methods: GuidedOption[];
  drinks: GuidedOption[];
  milks: GuidedOption[];
  pairings: GuidedOption[];
  initial: InitialValues;
}) {
  const [method, setMethod] = useState(initial.brewMethod);
  const [drink, setDrink] = useState(initial.drinkType);
  const visibility = brewFieldVisibility(method, drink, Boolean(initial.milkType || initial.milkMl || initial.milkPairing), Boolean(initial.dose), Boolean(initial.waterTemp), Boolean(initial.yieldMl || initial.timeSec));

  return <>
    <div className="bean-form-row">
      <div><label htmlFor="brew_method">Method</label><select id="brew_method" name="brew_method" value={method} onChange={(event) => setMethod(event.target.value)}><option value="">Choose</option><OptionList items={methods} current={method} /></select></div>
      <div><label htmlFor="drink_type">Drink</label><select id="drink_type" name="drink_type" value={drink} onChange={(event) => setDrink(event.target.value)}><option value="">Choose</option><OptionList items={drinks} current={drink} /></select></div>
    </div>

    {visibility.milk && <div className="bean-form-row bean-form-row-three contextual-fields">
      <div><label htmlFor="milk_type">Milk</label><select id="milk_type" name="milk_type" defaultValue={initial.milkType}><option value="">Choose milk</option><OptionList items={milks} current={initial.milkType} /></select></div>
      <div><label htmlFor="milk_ml">Milk amount (ml)</label><input id="milk_ml" name="milk_ml" type="number" min="0" step="1" defaultValue={initial.milkMl} placeholder="e.g. 80" /></div>
      <div><label htmlFor="milk_pairing">Milk pairing</label><select id="milk_pairing" name="milk_pairing" defaultValue={initial.milkPairing}><option value="">Not rated</option><OptionList items={pairings} current={initial.milkPairing} /></select><small>How well did this milk complement the Bean?</small></div>
    </div>}

    {(visibility.observedExtraction || visibility.dose || visibility.water) && <details className="brew-details" open={Boolean(initial.dose || initial.yieldMl || initial.timeSec || initial.waterTemp)}>
      <summary>{method ? "Settings and observed results" : "Recipe details"} (optional)</summary>
      <p className="brew-details-help">Settings are choices you can repeat. Yield and time are what actually happened in this cup.</p>
      <div className="brew-numbers">
        {visibility.dose && <label>Dose setting (g)<input name="default_dose_g" type="number" min="0" step="0.1" defaultValue={initial.dose} placeholder="e.g. 9" /></label>}
        {visibility.observedExtraction && <label>Actual yield (ml)<input name="espresso_volume_ml" type="number" min="0" step="0.1" defaultValue={initial.yieldMl} placeholder="e.g. 20" /></label>}
        {visibility.observedExtraction && <label>Actual time (sec)<input name="extraction_time_sec" type="number" min="0" step="0.1" defaultValue={initial.timeSec} placeholder="e.g. 25" /></label>}
        {visibility.water && <label>Water (°C)<input name="water_temp_c" type="number" min="0" max="100" step="0.1" defaultValue={initial.waterTemp} /></label>}
      </div>
    </details>}
  </>;
}
