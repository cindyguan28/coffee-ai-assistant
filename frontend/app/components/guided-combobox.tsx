"use client";

import { useMemo, useState } from "react";
import { filterGuidedOptions } from "../../lib/coffee/guided";
import { normalizeGuidedValue } from "../../lib/coffee/bean";

type GuidedComboboxProps = {
  id: string;
  name: string;
  options: readonly string[];
  initialValue?: string | null;
  placeholder: string;
  suggestionLabel: string;
  maxLength?: number;
};

export function GuidedCombobox({ id, name, options, initialValue, placeholder, suggestionLabel, maxLength = 200 }: GuidedComboboxProps) {
  const [value, setValue] = useState(initialValue ?? "");
  const [open, setOpen] = useState(false);
  const visible = useMemo(() => filterGuidedOptions(options, value), [options, value]);
  const exactMatch = options.some((option) => normalizeGuidedValue(option) === normalizeGuidedValue(value));
  const listId = `${id}-suggestions`;

  return <div className="guided-combobox" onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <div className="guided-combobox-control">
      <input
        id={id}
        name={name}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={open}
        onFocus={() => setOpen(true)}
        onChange={(event) => { setValue(event.target.value); setOpen(true); }}
        onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}
      />
      <button type="button" className="guided-combobox-toggle" aria-label={suggestionLabel} aria-expanded={open} onClick={() => setOpen((current) => !current)}>⌄</button>
    </div>
    {open && <div className="guided-combobox-menu" id={listId} role="listbox">
      {visible.map((option) => <button
        type="button"
        role="option"
        aria-selected={normalizeGuidedValue(option) === normalizeGuidedValue(value)}
        key={option}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => { setValue(option); setOpen(false); }}
      >{option}</button>)}
      {value.trim() && !exactMatch && <button type="button" className="guided-combobox-custom" onMouseDown={(event) => event.preventDefault()} onClick={() => setOpen(false)}>Use “{value.trim()}”</button>}
      {!visible.length && !value.trim() && <p>No suggestions yet.</p>}
    </div>}
  </div>;
}

