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
        <div className="story-copy"><p>One coffee, remembered over time</p><h3>{["Add a bean", "Log the cup", "Notice what you love", "See your coffee world grow"][active]}</h3><span>{["Start with a name. Add only the details you know.", "Save the recipe, result, and one useful next step.", "Your liked coffees begin to reveal personal patterns.", "Every origin becomes part of your private coffee story."][active]}</span></div>
        <div className={`story-panel story-panel-${active}`} id={`story-panel-${active}`} role="tabpanel" aria-labelledby={`story-tab-${active}`}>
          {active === 0 && <div className="story-bean-card"><span>On your shelf</span><div className="story-bag">FIVE<br />ELEPHANT<small>ETHIOPIA</small></div><div><b>Halo Beriti</b><p>Jasmine · Bergamot · Peach</p><small>Washed · Filter roast</small></div></div>}
          {active === 1 && <div className="story-brew-card"><span>Today’s brew</span><b>V60</b><dl><div><dt>Dose</dt><dd>15 g</dd></div><div><dt>Water</dt><dd>250 g</dd></div><div><dt>Time</dt><dd>2:45</dd></div></dl><p><strong>Liked · 8.5 / 10</strong> Floral and bright, slightly thin.</p></div>}
          {active === 2 && <div className="story-taste-card"><span>Your emerging taste · Example</span><b>You seem happiest with</b><div><i style={{ "--story-score": "82%" } as React.CSSProperties} /><p>Bright acidity</p></div><div><i style={{ "--story-score": "75%" } as React.CSSProperties} /><p>Floral aromas</p></div><div><i style={{ "--story-score": "63%" } as React.CSSProperties} /><p>Light body</p></div><small>Based on Bean Profiles and coffees you liked.</small></div>}
          {active === 3 && <div className="story-world-card"><span>Your coffee world</span><div className="story-orbit"><i>ETH</i><i>KEN</i><i>COL</i><i>BRA</i><b>8<small>origins explored</small></b></div><p>Ethiopia is your most explored origin.</p></div>}
        </div>
      </div>
      <p className="story-disclaimer">Illustrative product data · Your own space stays private</p>
    </div>
  );
}
