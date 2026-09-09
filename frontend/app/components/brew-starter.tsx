"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { selectStarterBrew, starterValues, type JournalEntry } from "../../lib/coffee/journal";

function fill(form: HTMLFormElement, name: string, value: string | number) {
  const control = form.elements.namedItem(name);
  if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement)) return;
  control.value = String(value);
  control.dispatchEvent(new Event("change", { bubbles: true }));
}

export function BrewStarter({ entries, initialBeanId = "" }: { entries: JournalEntry[]; initialBeanId?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [beanId, setBeanId] = useState(initialBeanId);
  const starter = useMemo(() => selectStarterBrew(entries, beanId), [entries, beanId]);

  useEffect(() => {
    const form = root.current?.closest("form");
    const bean = form?.elements.namedItem("bean_id");
    if (!(bean instanceof HTMLSelectElement)) return;
    const update = () => setBeanId(bean.value);
    update();
    bean.addEventListener("change", update);
    return () => bean.removeEventListener("change", update);
  }, []);

  if (!starter) return <div ref={root} className="brew-starter brew-starter-empty"><span>STARTING POINT</span><p>Choose a Bean to see its last useful brew.</p></div>;

  const previous = [
    starter.espresso_volume_ml != null ? `${starter.espresso_volume_ml} ml yield` : null,
    starter.extraction_time_sec != null ? `${starter.extraction_time_sec} sec` : null,
  ].filter(Boolean).join(" · ");

  return <div ref={root} className="brew-starter">
    <div><span>LAST USEFUL BREW</span><strong>Grind {starter.grind_setting ?? "—"}{starter.default_dose_g != null ? ` · ${starter.default_dose_g} g dose` : ""}</strong><p>{previous ? `Previously observed: ${previous}.` : "Reuse its controllable settings."} New yield and time stay empty for today&apos;s actual result.</p></div>
    <button type="button" onClick={(event) => {
      const form = event.currentTarget.form;
      if (!form) return;
      const values = starterValues(starter);
      Object.entries(values).filter(([name]) => !name.startsWith("milk_")).forEach(([name, value]) => fill(form, name, value));
      window.setTimeout(() => Object.entries(values).filter(([name]) => name.startsWith("milk_")).forEach(([name, value]) => fill(form, name, value)), 0);
      event.currentTarget.textContent = "Settings applied ✓";
    }}>Start from this brew</button>
  </div>;
}
