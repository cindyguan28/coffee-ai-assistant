"use client";

import { useState } from "react";

type RangeFieldProps = {
  name: string;
  label: string;
  defaultValue: number;
  min: number;
  max: number;
  step?: number;
  lowLabel?: string;
  highLabel?: string;
  suffix?: string;
};

export function RangeField({ name, label, defaultValue, min, max, step = 1, lowLabel, highLabel, suffix = "" }: RangeFieldProps) {
  const [value, setValue] = useState(defaultValue);
  return (
    <label className="range-field" htmlFor={name}>
      <span><b>{label}</b><output htmlFor={name}>{value}{suffix}</output></span>
      <input id={name} name={name} type="range" min={min} max={max} step={step} value={value} onChange={(event) => setValue(Number(event.target.value))} />
      {(lowLabel || highLabel) && <small><span>{lowLabel}</span><span>{highLabel}</span></small>}
    </label>
  );
}
