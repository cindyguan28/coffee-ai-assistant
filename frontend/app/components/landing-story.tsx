"use client";

import { useEffect, useState } from "react";

const steps = ["Bean", "Brew", "Taste", "World"] as const;

export function LandingStory() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % steps.length), 2400);
    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <div className="story-demo" aria-label="Example of how Beanmemo grows with each coffee">
      <div className="story-tabs" role="tablist" aria-label="Product story steps">
        {steps.map((step, index) => (
          <button aria-controls={`story-panel-${index}`} aria-selected={active === index} id={`story-tab-${index}`} key={step} onClick={() => { setActive(index); setPaused(true); }} role="tab" type="button"><span>0{index + 1}</span>{step}</button>
        ))}
      </div>
      <div className="story-stage">
        <div className="story-copy"><p>One coffee, remembered over time</p><h3>{["Add a bean", "Log the cup", "Notice what you love", "Trace your coffee journey"][active]}</h3><span>{["Save the label, then meet the Bean Profile behind it.", "Keep your setup, recipe, result, and one useful next step together.", "Your own sensory ratings shape the Radar; liked Beans reveal a separate preference.", "Watch the places behind your coffees become a map that is uniquely yours."][active]}</span></div>
        <div className={`story-panel story-panel-${active}`} id={`story-panel-${active}`} role="tabpanel" aria-labelledby={`story-tab-${active}`}>
          {active === 0 && <div className="story-bean-card"><span>On your shelf · Example</span><div className="story-bean-heading"><b>Espresso</b><p>Blue Bottle · Indonesia</p></div><div className="story-bean-tags"><small>Bold &amp; Roasty</small><small>Passion Fruit</small><small>Spicy</small></div><div className="story-bean-profile"><div className="story-profile-heading"><span>At a glance</span><b>Bold &amp; Roasty</b></div>{[["Roast", "5/5", "Dark", "100%"], ["Intensity", "5/5", "Intense", "100%"], ["Acidity", "1/5", "Very Low", "20%"]].map(([label, value, meaning, score]) => <div className="story-profile-row" key={label}><dt>{label}</dt><dd>{value}</dd><i><span style={{ width: score }} /></i><small>{meaning}</small></div>)}<p><b>Main flavors:</b> Passion Fruit · Spicy · Roasted</p></div></div>}
          {active === 1 && <div className="story-brew-card"><span>Espresso journal · Example</span><b>Bellissimo Italian Blend</b><dl><div><dt>Machine</dt><dd>Isomac</dd></div><div><dt>Grind</dt><dd>Setting 8</dd></div><div><dt>Dose</dt><dd>18 g</dd></div><div><dt>Yield</dt><dd>36 g</dd></div><div><dt>Time</dt><dd>28 sec</dd></div></dl><p><strong>Liked · 8 / 10</strong> Smooth and chocolatey, slightly bitter at the end. Next: try one step coarser.</p></div>}
          {active === 2 && <div className="story-taste-card"><span>Your sensory profile · Example</span><div className="story-taste-layout"><div><b>Six dimensions from your own ratings</b><svg className="story-radar" viewBox="0 0 330 285" role="img" aria-label="Example six-dimensional taste radar"><g transform="translate(15 -8)"><polygon className="story-radar-grid" points="150,35 249.6,92.5 249.6,207.5 150,265 50.4,207.5 50.4,92.5" /><polygon className="story-radar-grid" points="150,74 216,112 216,188 150,226 84,188 84,112" /><polygon className="story-radar-grid" points="150,112 183,131 183,169 150,188 117,169 117,131" /><g className="story-radar-axes"><line x1="150" y1="150" x2="150" y2="35" /><line x1="150" y1="150" x2="249.6" y2="92.5" /><line x1="150" y1="150" x2="249.6" y2="207.5" /><line x1="150" y1="150" x2="150" y2="265" /><line x1="150" y1="150" x2="50.4" y2="207.5" /><line x1="150" y1="150" x2="50.4" y2="92.5" /></g><polygon className="story-radar-data" points="150,58 225,107 202,180 150,210 75,193 91,116" /><g className="story-radar-labels"><text x="150" y="20">Acidity</text><text x="267" y="88">Natural sweetness</text><text x="270" y="218">Bitterness</text><text x="150" y="282">Body</text><text x="31" y="218">Balance</text><text x="30" y="88">Aroma</text></g></g></svg></div><div className="story-preference"><b>Bean directions you may enjoy</b><div><span>Bright acidity</span><i style={{ "--story-score": "82%" } as React.CSSProperties} /></div><div><span>Natural sweetness</span><i style={{ "--story-score": "74%" } as React.CSSProperties} /></div><div><span>Light body</span><i style={{ "--story-score": "62%" } as React.CSSProperties} /></div><small>From Bean Profiles attached to liked brews—not from the Radar.</small></div></div></div>}
          {active === 3 && <div className="story-world-card"><span>Your coffee world · Example</span><svg className="story-world-map" viewBox="0 0 520 275" role="img" aria-label="Example world map with explored coffee origins"><g className="story-land"><path d="M35 79l32-25 48-10 34 14 20 27-15 23-31 2-13 20-28 5-17-21-24-7z" /><path d="M128 143l30 8 21 27-7 37-22 38-17-15-8-42-13-28z" /><path d="M218 64l34-18 46 9 21 22 48-7 55 20 38 40-18 22-45-3-28 16-34-4-16-34-31-5-17-28-42 3z" /><path d="M275 135l40 5 25 39-13 60-26 21-25-38-14-47z" /><path d="M423 197l35-17 34 18-9 32-42 6-22-19z" /></g><g className="story-map-pins"><circle cx="304" cy="165" r="10" /><circle cx="315" cy="177" r="6" /><circle cx="145" cy="183" r="8" /><circle cx="159" cy="211" r="6" /></g></svg><div className="story-map-summary"><b>8</b><span>origins in your story</span><p>From Ethiopia to Colombia, every saved coffee leaves a place on your map.</p></div></div>}
        </div>
      </div>
      <p className="story-disclaimer">Illustrative product data · Your own space stays private</p>
    </div>
  );
}
