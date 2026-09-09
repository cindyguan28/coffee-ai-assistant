"use client";

import { useMemo, useState } from "react";

type SearchableFlavorPickerProps = {
  options: readonly string[];
  initialSelected: string[];
};

export function SearchableFlavorPicker({ options, initialSelected }: SearchableFlavorPickerProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(() => new Set(initialSelected));
  const normalizedQuery = query.trim().toLowerCase();
  const visible = useMemo(
    () => options.filter((option) => !normalizedQuery || option.toLowerCase().includes(normalizedQuery)),
    [normalizedQuery, options],
  );

  function toggle(option: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(option)) next.delete(option);
      else next.add(option);
      return next;
    });
  }

  return (
    <fieldset className="option-fieldset flavor-picker">
      <legend>Flavor labels <span>Optional · {selected.size} selected</span></legend>
      {[...selected].map((option) => <input key={option} type="hidden" name="flavor_notes" value={option} />)}
      <label className="flavor-search" htmlFor="flavor-search">
        <span>Search flavors</span>
        <input id="flavor-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try chocolate, berry, floral…" autoComplete="off" />
      </label>
      {selected.size > 0 && <div className="selected-flavors" aria-label="Selected flavors">
        {[...selected].map((option) => <button key={option} type="button" onClick={() => toggle(option)}>{option} <span aria-hidden="true">×</span></button>)}
      </div>}
      <div className="option-chips flavor-results">
        {visible.map((option) => (
          <button key={option} className="option-chip" type="button" aria-pressed={selected.has(option)} onClick={() => toggle(option)}>
            <span>{option}</span>
          </button>
        ))}
        {!visible.length && <p>No matching label. Add it under Other flavors.</p>}
      </div>
    </fieldset>
  );
}
