const features = [
  {
    number: "01",
    eyebrow: "Your shelf",
    title: "My Beans",
    description: "Keep the coffees you own in one calm, searchable place — without spreadsheet work.",
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
    description: "See the patterns behind the coffees you genuinely enjoy — not a generic tasting score.",
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

export default function Home() {
  return (
    <main>
      <nav className="nav shell" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="Mylot Coffee home">
          <CoffeeMark />
          <span>Mylot</span>
        </a>
        <div className="nav-links">
          <a href="#features">What it does</a>
          <a href="#journey">How it works</a>
        </div>
        <a className="nav-action" href="#space">
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
            <a className="button button-primary" href="#space">Create my coffee space <Arrow /></a>
            <a className="button button-quiet" href="#journey">See how it works</a>
          </div>
          <p className="privacy-note"><span>●</span> Private by default · Built around your own coffee journey</p>
        </div>

        <div className="space-preview" id="space" aria-label="Preview of a personal coffee space">
          <div className="preview-topline">
            <div>
              <p>Sunday, September 6</p>
              <h2>Good morning, Cindy.</h2>
            </div>
            <span className="avatar">CG</span>
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
                <div><p className="mini-label">Your taste lately</p><h3>Bright &amp; floral</h3></div>
                <span>Last 30 days</span>
              </div>
              <div className="taste-bars" aria-label="Taste preference illustration">
                <div><span>Sweetness</span><i style={{ "--score": "82%" } as React.CSSProperties} /></div>
                <div><span>Acidity</span><i style={{ "--score": "74%" } as React.CSSProperties} /></div>
                <div><span>Aroma</span><i style={{ "--score": "88%" } as React.CSSProperties} /></div>
                <div><span>Body</span><i style={{ "--score": "46%" } as React.CSSProperties} /></div>
              </div>
              <p className="taste-insight">You seem happiest with aromatic, lightly roasted coffees.</p>
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
              <div className="feature-visual" aria-hidden="true"><span /><i /></div>
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
        <a className="button button-primary" href="#top">Begin with one bean <Arrow /></a>
      </section>

      <footer className="footer shell">
        <a className="brand" href="#top"><CoffeeMark /><span>Mylot</span></a>
        <p>Your coffee memories, kept close.</p>
        <span>Private beta · 2026</span>
      </footer>
    </main>
  );
}
