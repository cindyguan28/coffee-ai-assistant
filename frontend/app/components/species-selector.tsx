"use client";

import { useState } from "react";

const SPECIES_OPTIONS = ["100% Arabica", "100% Robusta", "Blend", "Other", "Unknown"] as const;

type SpeciesSelectorProps = {
  initialSpecies?: string | null;
  initialArabicaPercentage?: number | null;
};

export function SpeciesSelector({ initialSpecies, initialArabicaPercentage }: SpeciesSelectorProps) {
  const [species, setSpecies] = useState(initialSpecies ?? "");

  return <div className="species-selector">
    <label htmlFor="species">Species</label>
    <select id="species" name="species" value={species} onChange={(event) => setSpecies(event.target.value)}>
      <option value="">Not specified</option>
      {SPECIES_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
    {species === "Blend" && <div className="species-composition">
      <label htmlFor="arabica_percentage">Arabica in blend (%)</label>
      <input
        id="arabica_percentage"
        name="arabica_percentage"
        type="number"
        min="0"
        max="100"
        step="1"
        defaultValue={initialSpecies === "Blend" ? initialArabicaPercentage ?? "" : ""}
        placeholder="e.g. 70"
      />
      <small>Optional. The remaining share is Robusta.</small>
    </div>}
  </div>;
}
