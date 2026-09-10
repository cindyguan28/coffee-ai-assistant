const features = [
  {
    number: "01",
    eyebrow: "Your shelf",
    title: "My Beans",
    description: "Remember every coffee on your shelf, keep the details that matter, and return to its Bean Profile whenever you buy or brew it again.",
    accent: "bean",
  },
  {
    number: "02",
    eyebrow: "Know the coffee",
    title: "Bean Profile",
    description: "Turn the label into a simple profile: roast, intensity, acidity and the flavors that matter.",
    accent: "profile",
  },
  {
    number: "03",
    eyebrow: "Remember the cup",
    title: "Brew Journal",
    description: "Save what you brewed, what changed, and whether you would happily make it again.",
    accent: "journal",
  },
  {
    number: "04",
    eyebrow: "Understand yourself",
    title: "My Taste",
    description: "Your liking reveals patterns in the Beans you enjoy. Optional sensory reviews build a separate six-dimension radar from what you actually tasted.",
    accent: "taste",
  },
  {
    number: "05",
    eyebrow: "Trace your journey",
    title: "Coffee World",
    description: "Watch your personal coffee map grow with every origin you explore and every cup you remember.",
    accent: "world",
  },
];

function CoffeeMark() {
  return (
    <span className="coffee-mark" aria-hidden="true">
      <span />
    </span>
  );
}

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

function TasteFeatureVisual() {
  return (
    <div className="feature-visual taste-feature-visual">
      <svg viewBox="0 0 250 112" role="img" aria-label="Example six-dimensional sensory profile based on explicit ratings">
        <polygon className="landing-radar-grid" points="65,17 98,37 98,75 65,95 32,75 32,37" />
        <polygon className="landing-radar-grid inner" points="65,35 82,45 82,67 65,77 48,67 48,45" />
        <g className="landing-radar-axes">
          <line x1="65" y1="56" x2="65" y2="17" /><line x1="65" y1="56" x2="98" y2="37" />
          <line x1="65" y1="56" x2="98" y2="75" /><line x1="65" y1="56" x2="65" y2="95" />
          <line x1="65" y1="56" x2="32" y2="75" /><line x1="65" y1="56" x2="32" y2="37" />
        </g>
        <polygon className="landing-radar-data" points="65,25 89,42 80,65 65,79 37,72 40,42" />
        <g className="landing-radar-labels">
          <text x="65" y="10">Acidity</text><text x="106" y="34">Natural sweetness</text>
          <text x="106" y="82">Bitterness</text><text x="65" y="109">Body</text>
          <text x="24" y="82">Balance</text><text x="24" y="34">Aroma</text>
        </g>
        <text className="landing-radar-caption" x="166" y="51">EXAMPLE</text>
        <text className="landing-radar-copy" x="166" y="67">Your explicit sensory</text>
        <text className="landing-radar-copy" x="166" y="80">ratings shape this radar.</text>
      </svg>
    </div>
  );
}

export default function Home() {
  return (
    <main>
      <nav className="nav shell" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="Beanmemo home">
          <CoffeeMark />
          <span>Beanmemo</span>
        </a>
        <div className="nav-links">
          <a href="#features">What it does</a>
          <a href="#journey">How it works</a>
          <a href="/coffee-journal">Coffee journal guide</a>
        </div>
        <a className="nav-action" href="/login">
          Enter my space <Arrow />
        </a>
      </nav>

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <p className="kicker"><span /> Your private coffee space</p>
          <h1>Your coffee,<br /><em>understood.</em></h1>
          <p className="hero-lede">
            Remember every bean. Learn from every brew. Slowly discover the taste that is unmistakably yours.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="/login?mode=signup">Create my coffee space <Arrow /></a>
            <a className="button button-quiet" href="#journey">See how it works</a>
          </div>
          <p className="privacy-note"><span>●</span> Private by default · Built around your own coffee journey</p>
        </div>

        <div className="space-preview" id="space" aria-label="Preview of a personal coffee space">
          <div className="preview-topline">
            <div>
              <p>Example coffee space</p>
              <h2>A private place that grows with every coffee.</h2>
            </div>
            <span className="preview-example">PRODUCT PREVIEW</span>
          </div>
          <div className="preview-grid">
            <article className="now-card">
              <p className="mini-label">On your shelf</p>
              <div className="bag">
                <span className="bag-seal">FIVE<br />ELEPHANT</span>
                <span className="bag-origin">ETHIOPIA</span>
              </div>
              <div>
                <span className="status">Ready to brew</span>
                <h3>Halo Beriti</h3>
                <p>Jasmine · Bergamot · Peach</p>
              </div>
            </article>

            <article className="taste-card">
              <div className="card-heading">
                <div><p className="mini-label">Automatic Bean Preference · Example</p><h3>What liked Beans have in common</h3></div>
                <span>Bean Profiles + liking</span>
              </div>
              <div className="taste-bars" aria-label="Example automatic Bean Preference derived from Bean Profiles and liking">
                <div><span>Acidity</span><i style={{ "--score": "78%" } as React.CSSProperties} /><b>3.9 / 5</b></div>
                <div><span>Natural sweetness</span><i style={{ "--score": "72%" } as React.CSSProperties} /><b>3.6 / 5</b></div>
                <div><span>Body</span><i style={{ "--score": "54%" } as React.CSSProperties} /><b>2.7 / 5</b></div>
              </div>
              <p className="taste-insight"><b>Flavor families in liked Beans</b><span>Floral · Citrus · Stone fruit</span></p>
              <small className="taste-source">Only available Bean Profile dimensions are shown. Sensory ratings remain a separate, optional radar.</small>
            </article>
          </div>
          <div className="preview-footer">
            <span><b>12</b> beans remembered</span>
            <span><b>28</b> brews logged</span>
            <span><b>7</b> origins explored</span>
          </div>
        </div>
      </section>

      <section className="features shell" id="features">
        <header className="section-heading">
          <p className="kicker"><span /> A place that becomes yours</p>
          <h2>Less coffee data.<br /><em>More personal meaning.</em></h2>
          <p>Start with one bean. Your space grows naturally as you taste, brew and learn.</p>
        </header>
        <div className="feature-grid">
          {features.map((feature) => (
            <article className={`feature-card ${feature.accent}`} key={feature.title}>
              <div className="feature-number">{feature.number}</div>
              {feature.accent === "taste" ? <TasteFeatureVisual /> : <div className="feature-visual" aria-hidden="true"><span /><i /></div>}
              <p>{feature.eyebrow}</p>
              <h3>{feature.title}</h3>
              <div>{feature.description}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="journey shell" id="journey">
        <div className="journey-intro">
          <p className="kicker"><span /> Your first five minutes</p>
          <h2>A gentle start,<br />not another setup form.</h2>
        </div>
        <ol className="journey-steps">
          <li><span>1</span><div><h3>Add one coffee</h3><p>Type its name and roaster. Add only what you know.</p></div></li>
          <li><span>2</span><div><h3>Meet its profile</h3><p>We turn scattered details into a clear, useful introduction.</p></div></li>
          <li><span>3</span><div><h3>Log your first cup</h3><p>Remember the recipe and answer one simple question: did you like it?</p></div></li>
          <li><span>4</span><div><h3>Watch your taste appear</h3><p>Your private radar and coffee world become richer with every brew.</p></div></li>
        </ol>
      </section>

      <section className="closing shell">
        <CoffeeMark />
        <p>There is no right way to love coffee.</p>
        <h2>There is only <em>your way.</em></h2>
        <a className="button button-primary" href="/login?mode=signup">Begin with one bean <Arrow /></a>
      </section>

      <footer className="footer shell">
        <a className="brand" href="#top"><CoffeeMark /><span>Beanmemo</span></a>
        <p>Your coffee memories, kept close.</p>
        <span><a href="/coffee-journal">Coffee journal guide</a> · <a href="/privacy">Privacy</a> · <a href="https://github.com/cindyguan28/coffee-ai-assistant/issues/new" rel="noreferrer" target="_blank">Feedback ↗</a> · Public preview 2026</span>
      </footer>
    </main>
  );
}
