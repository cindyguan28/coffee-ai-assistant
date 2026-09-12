"use client";

import { useMemo, useState } from "react";
import { normalizeGuidedValue } from "../../lib/coffee/bean";
import { filterGuidedOptions } from "../../lib/coffee/guided";

type GuidedMultiSelectProps = {
  id: string;
  name: string;
  options: readonly string[];
  initialSelected: string[];
  placeholder: string;
  maxItems?: number;
};

export function GuidedMultiSelect({ id, name, options, initialSelected, placeholder, maxItems = 12 }: GuidedMultiSelectProps) {
  const [selected, setSelected] = useState(() => [...new Map(initialSelected.map((value) => [normalizeGuidedValue(value), value])).values()]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selectedKeys = useMemo(() => new Set(selected.map(normalizeGuidedValue)), [selected]);
  const visible = useMemo(
    () => filterGuidedOptions(options.filter((option) => !selectedKeys.has(normalizeGuidedValue(option))), query),
    [options, query, selectedKeys],
  );
  const customAllowed = Boolean(query.trim()) && !selectedKeys.has(normalizeGuidedValue(query)) && !options.some((option) => normalizeGuidedValue(option) === normalizeGuidedValue(query));
  const listId = `${id}-suggestions`;

  function add(value: string) {
    const clean = value.trim();
    if (!clean || selected.length >= maxItems || selectedKeys.has(normalizeGuidedValue(clean))) return;
    setSelected((current) => [...current, clean]);
    setQuery("");
    setOpen(false);
  }

  return <div className="guided-multi-select">
    {selected.map((value) => <input key={value} type="hidden" name={name} value={value} />)}
    {selected.length > 0 && <div className="guided-selected" aria-label="Selected origins">
      {selected.map((value) => <button key={value} type="button" onClick={() => setSelected((current) => current.filter((item) => item !== value))}>{value}<span aria-hidden="true">×</span></button>)}
    </div>}
    <div className="guided-combobox" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <div className="guided-combobox-control">
        <input
          id={id}
          value={query}
          placeholder={selected.length ? "Add another country" : placeholder}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open}
          onFocus={() => setOpen(true)}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
            if (event.key === "Enter" && query.trim()) { event.preventDefault(); add(visible[0] ?? query); }
          }}
        />
        <button type="button" className="guided-combobox-toggle" aria-label="Show country suggestions" aria-expanded={open} onClick={() => setOpen((current) => !current)}>⌄</button>
      </div>
      {open && selected.length < maxItems && <div className="guided-combobox-menu" id={listId} role="listbox">
        {visible.map((option) => <button key={option} type="button" role="option" aria-selected="false" onMouseDown={(event) => event.preventDefault()} onClick={() => add(option)}>{option}</button>)}
        {customAllowed && <button type="button" className="guided-combobox-custom" onMouseDown={(event) => event.preventDefault()} onClick={() => add(query)}>Add “{query.trim()}”</button>}
        {!visible.length && !customAllowed && <p>{query.trim() ? "Already selected." : "No more suggestions."}</p>}
      </div>}
    </div>
    <small>{selected.length ? `${selected.length} selected` : "Choose one or more countries if known."}</small>
  </div>;
}

