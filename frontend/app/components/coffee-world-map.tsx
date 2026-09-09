"use client";

import { Mercator } from "@visx/geo";
import type { Feature, Geometry, GeoJsonProperties } from "geojson";
import { useMemo, useState } from "react";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import world from "world-atlas/countries-110m.json";
import { countryNarrative, type CoffeeWorldMode, type CountrySummary } from "../../lib/coffee/geography";

type CountryFeature = Feature<Geometry, GeoJsonProperties & { name?: string }>;

const topology = world as unknown as Topology<{ countries: GeometryCollection<{ name?: string }> }>;
const countries = feature(topology, topology.objects.countries).features as CountryFeature[];

function fillFor(summary: CountrySummary | undefined, mode: CoffeeWorldMode, maximum: number) {
  if (!summary) return "#e9e1d5";
  if (mode === "preference") {
    if (summary.averageLiking === null) return "#d7d1c6";
    const lightness = 76 - Math.max(0, Math.min(1, (summary.averageLiking - 1) / 9)) * 42;
    return `hsl(22 49% ${lightness}%)`;
  }
  const intensity = maximum ? summary.coffeeCount / maximum : 0;
  return `hsl(82 15% ${82 - intensity * 42}%)`;
}

export function CoffeeWorldMap({ summaries }: { summaries: CountrySummary[] }) {
  const [mode, setMode] = useState<CoffeeWorldMode>("explored");
  const [selectedCountry, setSelectedCountry] = useState(summaries[0]?.country ?? "");
  const byCountry = useMemo(() => new Map(summaries.map((summary) => [summary.country, summary])), [summaries]);
  const maximum = Math.max(1, ...summaries.map((summary) => summary.coffeeCount));
  const selected = byCountry.get(selectedCountry) ?? summaries[0];

  return <>
    <div className="world-toolbar" aria-label="Map view">
      <div><span>MAP VIEW</span><h2>{mode === "explored" ? "Coffees explored" : "Average liking"}</h2></div>
      <div className="world-toggle">
        <button aria-pressed={mode === "explored"} onClick={() => setMode("explored")} type="button">Explored</button>
        <button aria-pressed={mode === "preference"} onClick={() => setMode("preference")} type="button">Preference</button>
      </div>
    </div>
    <div className="world-map-wrap">
      <svg className="world-map" viewBox="0 0 920 480" role="img" aria-label={`${mode === "explored" ? "Coffee exploration" : "Coffee preference"} world map`}>
        <Mercator<CountryFeature> data={countries} scale={145} translate={[460, 305]}>
          {({ features }) => features.map(({ feature: country, path }) => {
            const name = country.properties?.name ?? "";
            const summary = byCountry.get(name);
            const interactive = Boolean(summary);
            const label = summary
              ? `${name}: ${mode === "explored" ? `${summary.coffeeCount} saved coffees` : summary.averageLiking === null ? "not rated yet" : `${summary.averageLiking} average liking`}`
              : name;
            return <path
              className={interactive ? "world-country world-country-active" : "world-country"}
              d={path ?? undefined}
              fill={fillFor(summary, mode, maximum)}
              key={country.id ?? name}
              onClick={() => interactive && setSelectedCountry(name)}
              tabIndex={interactive ? 0 : undefined}
              onKeyDown={(event) => {
                if (interactive && (event.key === "Enter" || event.key === " ")) setSelectedCountry(name);
              }}
              aria-label={label}
              role={interactive ? "button" : undefined}
            ><title>{label}</title></path>;
          })}
        </Mercator>
      </svg>
      <div className="world-legend"><span><i className="legend-none" /> No saved coffee</span><span><i className="legend-known" /> {mode === "explored" ? "More coffees" : "Rated"}</span>{mode === "preference" && <span><i className="legend-unrated" /> Saved, not rated</span>}</div>
    </div>
    {selected && <section className="country-detail" aria-live="polite">
      <div><span>{mode === "explored" ? "EXPLORATION DETAILS" : "PREFERENCE DETAILS"}</span><h2>{selected.country}</h2><p>{countryNarrative(selected, mode)}</p></div>
      <dl>
        {mode === "preference" && <div><dt>Average liking</dt><dd>{selected.averageLiking === null ? "Not rated" : `${selected.averageLiking}/10`}</dd></div>}
        {mode === "preference" && <div><dt>Scored entries</dt><dd>{selected.ratedBrewCount}</dd></div>}
        <div><dt>Saved coffees</dt><dd>{selected.coffeeCount}</dd></div>
        {mode === "explored" && <div><dt>Brewed coffees</dt><dd>{selected.brewedCoffeeCount}</dd></div>}
        {mode === "explored" && <div><dt>Journal entries</dt><dd>{selected.brewCount}</dd></div>}
        <div><dt>Top flavors</dt><dd>{selected.topFlavorFamilies.join(" · ") || "Add flavor notes"}</dd></div>
      </dl>
    </section>}
  </>;
}
