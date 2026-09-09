"use client";

import { useState } from "react";

type RangeFieldProps = {
  name: string;
  label: string;
  defaultValue: number | null;
  min: number;
  max: number;
  step?: number;
  lowLabel?: string;
  highLabel?: string;
  suffix?: string;
};

export function RangeField({ name, label, defaultValue, min, max, step = 1, lowLabel, highLabel, suffix = "" }: RangeFieldProps) {
  const [value, setValue] = useState(defaultValue ?? (min + max) / 2);
  const [rated, setRated] = useState(defaultValue !== null);
  return (
    <label className="range-field" htmlFor={name}>
      <span><b>{label}</b><output htmlFor={name}>{rated ? `${value}${suffix}` : "Move to rate"}</output></span>
      <input id={name} name={rated ? name : undefined} type="range" min={min} max={max} step={step} value={value} onChange={(event) => { setValue(Number(event.target.value)); setRated(true); }} />
      {(lowLabel || highLabel) && <small><span>{lowLabel}</span><span>{highLabel}</span></small>}
    </label>
  );
}
