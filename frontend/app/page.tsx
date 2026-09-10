import { LandingStory } from "./components/landing-story";

function CoffeeMark() { return <span className="coffee-mark" aria-hidden="true"><span /></span>; }
function Arrow() { return <span aria-hidden="true">↗</span>; }

const values = [
  { number: "01", title: "Remember what you drink", copy: "Keep every bean, roaster, origin, and tasting note in one calm place.", tags: ["My Beans", "Bean Profile"] },
  { number: "02", title: "Learn from every brew", copy: "Save what you changed and remember which recipe made the better cup.", tags: ["Brew Journal", "Recipes"] },
  { number: "03", title: "Discover your taste", copy: "See the flavors, origins, and coffee styles you return to again and again.", tags: ["My Taste", "Coffee World"] },
];

export default function Home() {
  return (
    <main>
      <nav className="nav shell" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="Beanmemo home"><CoffeeMark /><span>Beanmemo</span></a>
        <div className="nav-links"><a href="#story">How it works</a><a href="#features">Why Beanmemo</a><a href="/coffee-journal">Coffee journal guide</a></div>
        <a className="nav-action" href="/login">Enter my space <Arrow /></a>
      </nav>

      <section className="hero hero-v2 shell" id="top">
        <div className="hero-copy">
          <p className="kicker"><span /> Your personal coffee journal</p>
          <h1>Remember every coffee.<br /><em>Discover what you love.</em></h1>
          <p className="hero-lede">Save your beans, learn from every brew, and watch your personal taste take shape over time.</p>
          <div className="hero-actions"><a className="button button-primary" href="/login?mode=signup">Start my free coffee journal <Arrow /></a><a className="button button-quiet" href="#story">See Beanmemo in action</a></div>
          <p className="hero-trust"><span>Free during public preview</span><span>Private by default</span><span>No credit card required</span></p>
        </div>
      </section>

      <section className="story-section shell" id="story">
        <header className="section-heading story-heading"><p className="kicker"><span /> From one cup to your taste</p><h2>One coffee becomes<br /><em>part of your story.</em></h2><p>Each small note makes your private coffee space more useful—and more unmistakably yours.</p></header>
        <LandingStory />
      </section>

      <section className="value-section shell" id="features">
        <header className="section-heading"><p className="kicker"><span /> A journal that gives something back</p><h2>More than a list<br /><em>of coffees.</em></h2><p>Beanmemo turns a simple habit into a clearer understanding of what works for you.</p></header>
        <div className="value-grid">{values.map((value) => <article key={value.title}><span>{value.number}</span><h3>{value.title}</h3><p>{value.copy}</p><div>{value.tags.map((tag) => <small key={tag}>{tag}</small>)}</div></article>)}</div>
      </section>

      <section className="start-section shell" id="journey">
        <div><p className="kicker"><span /> Start with only what you know</p><h2>A coffee name<br /><em>is enough.</em></h2><p>Add the roaster, origin, or tasting notes whenever you have them. Beanmemo grows without turning your morning coffee into data entry.</p></div>
        <ol><li><span>1</span><div><h3>Add one coffee</h3><p>Begin with the bag already on your shelf.</p></div></li><li><span>2</span><div><h3>Log one cup</h3><p>Remember the result and what to try next.</p></div></li><li><span>3</span><div><h3>Watch your taste take shape</h3><p>Patterns appear naturally as your journal grows.</p></div></li></ol>
      </section>

      <section className="privacy-section shell">
        <div><p className="kicker"><span /> Quiet by design</p><h2>Your coffee history<br /><em>belongs to you.</em></h2></div>
        <div className="privacy-points"><p><b>Your collection is private.</b><span>Your coffee records are tied to your account, with no public profile by default.</span></p><p><b>Free during public preview.</b><span>Optional paid features may be introduced later, with advance notice.</span></p><p><b>Start without commitment.</b><span>No credit card is required to create your coffee journal today.</span></p></div>
      </section>

      <section className="closing shell"><CoffeeMark /><p>Your next favorite coffee may already be on your shelf.</p><h2>Remember the cup.<br /><em>Find your taste.</em></h2><a className="button button-primary" href="/login?mode=signup">Start my free coffee journal <Arrow /></a></section>

      <footer className="footer shell"><a className="brand" href="#top"><CoffeeMark /><span>Beanmemo</span></a><p>Your coffee memories, kept close.</p><span><a href="/coffee-journal">Coffee journal guide</a> · <a href="/privacy">Privacy</a> · <a href="https://github.com/cindyguan28/coffee-ai-assistant/issues/new" rel="noreferrer" target="_blank">Feedback ↗</a> · Public preview 2026</span></footer>
    </main>
  );
}
