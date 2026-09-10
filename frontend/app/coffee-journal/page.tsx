import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How to Keep a Coffee Journal You’ll Actually Use",
  description: "Learn what to record in a personal coffee journal, how to keep it simple, and how your notes can reveal the beans and brews you genuinely enjoy.",
  alternates: { canonical: "/coffee-journal" },
  openGraph: {
    title: "A Coffee Journal You’ll Actually Keep",
    description: "A simple way to remember beans, improve brews, and discover the coffee you genuinely enjoy.",
    url: "/coffee-journal",
    type: "article",
    publishedTime: "2026-09-10",
  },
  twitter: {
    card: "summary_large_image",
    title: "A Coffee Journal You’ll Actually Keep",
    description: "A simple way to remember beans, improve brews, and discover the coffee you genuinely enjoy.",
  },
};

const sections = [
  ["what-is-a-coffee-journal", "What it is"],
  ["what-to-record", "What to record"],
  ["coffee-journal-examples", "Examples"],
  ["how-to-describe-taste", "Describe taste"],
  ["review-your-patterns", "Review patterns"],
  ["choose-a-format", "Choose a format"],
  ["coffee-journal-faq", "FAQ"],
];

function CoffeeMark() {
  return <span className="coffee-mark" aria-hidden="true"><span /></span>;
}

function ExampleRow({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><dt>{label}</dt><dd>{children}</dd></div>;
}

export default function CoffeeJournalPage() {
  const faqItems = [
    ["What should I write in a coffee journal?", "Start with the coffee name, roaster, brew method, whether you liked it, and one sentence about what you would remember or change. Add recipe variables only when they help you compare or repeat a brew."],
    ["Do I need to understand professional coffee tasting?", "No. Ordinary descriptions such as bright, sweet, bitter, light, creamy, or balanced are useful. Your journal is meant to describe your experience, not test your vocabulary."],
    ["Should I record every cup of coffee?", "Not necessarily. Record first attempts, meaningful changes, excellent cups, and disappointing cups you want to learn from. A smaller journal you maintain is more useful than a detailed one you abandon."],
    ["What is the difference between a coffee journal and a brew log?", "A brew log focuses on preparation variables and results. A coffee journal can also remember the bean, roaster, origin, tasting experience, and personal preferences across many brews."],
  ];
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "How to Keep a Coffee Journal You’ll Actually Use",
    description: metadata.description,
    datePublished: "2026-09-10",
    dateModified: "2026-09-10",
    author: { "@type": "Organization", name: "Beanmemo" },
    publisher: { "@type": "Organization", name: "Beanmemo" },
    mainEntityOfPage: "https://beanmemo.com/coffee-journal",
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map(([name, text]) => ({
      "@type": "Question",
      name,
      acceptedAnswer: { "@type": "Answer", text },
    })),
  };

  return (
    <main className="article-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }} />
      <nav className="nav shell" aria-label="Main navigation">
        <Link className="brand" href="/" aria-label="Beanmemo home"><CoffeeMark /><span>Beanmemo</span></Link>
        <span className="article-nav-label">Coffee journal guide</span>
        <Link className="nav-action" href="/login?mode=signup">Start free <span aria-hidden="true">↗</span></Link>
      </nav>

      <header className="article-hero shell">
        <p className="kicker"><span /> Beanmemo guide</p>
        <h1>How to Keep a Coffee Journal <em>You’ll Actually Use</em></h1>
        <p className="article-deck">A simple journal can help you remember good beans, repeat better brews, and discover the coffee you genuinely enjoy—without turning every cup into homework.</p>
        <div className="article-byline"><span>By Beanmemo</span><span aria-hidden="true">·</span><time dateTime="2026-09-10">September 10, 2026</time></div>
      </header>

      <div className="article-layout shell">
        <aside className="article-toc" aria-label="On this page">
          <p>On this page</p>
          <ol>{sections.map(([id, label]) => <li key={id}><a href={`#${id}`}>{label}</a></li>)}</ol>
        </aside>

        <article className="article-content">
          <p className="article-opening">You remember that a coffee was good. You may even remember the café or the color of the bag. But a few weeks later, the useful details are gone: Was it the washed Ethiopian coffee or the natural one? Did the finer grind make it sweeter, or was that the cup that turned bitter? Would you buy it again?</p>
          <p>A coffee journal gives those answers somewhere to live.</p>
          <p>It does not need to be a professional cupping form or a spreadsheet full of measurements. The best coffee journal is the one you can update quickly and understand when you return to it. Start with the coffee itself, record how much you enjoyed it, and add brewing detail only when that detail will help you next time.</p>

          <section className="article-answer" aria-label="The short answer"><span>The short answer</span><p>Record the coffee, how you brewed or ordered it, whether you liked it, and one thing to remember or change. Everything else is optional.</p></section>

          <section id="what-is-a-coffee-journal">
            <p className="article-section-number">01</p><h2>What is a coffee journal?</h2>
            <p>A coffee journal is a personal record of the coffees you drink and the experiences you have with them. It can help you:</p>
            <ul><li>remember beans and roasters you enjoyed;</li><li>repeat a brew that worked;</li><li>avoid buying a coffee you did not enjoy;</li><li>notice patterns in origins, roast levels, processes, and flavors;</li><li>describe your own taste with more confidence.</li></ul>
            <p>A tasting journal focuses mainly on what a coffee tasted and felt like. A brew log focuses on the recipe and variables used to prepare it. A useful personal coffee journal can connect both without forcing you to complete every field for every cup.</p>
          </section>

          <section id="what-to-record">
            <p className="article-section-number">02</p><h2>Start with the bean, not the form</h2>
            <p>When you open a new bag, begin with the details that identify it:</p>
            <ul><li>coffee name and roaster;</li><li>country or region;</li><li>roast date and roast level, if available;</li><li>process, such as washed or natural;</li><li>tasting notes printed on the bag.</li></ul>
            <p>You do not need to research missing information before saving the coffee. If all you know is the name and roaster, start there. A journal should reduce the effort of remembering, not create homework before you can drink the coffee.</p>
            <h3>Record the first brew that teaches you something</h3>
            <p>You do not have to log every cup. Record a brew when you are trying a coffee for the first time, changing a variable, or getting a result you want to repeat.</p>
            <p>For a useful brew log, keep the method, dose, water or beverage yield, grind setting, brew time, a sentence about the result, and what you would change next time. Add water temperature when it matters to your method.</p>
          </section>

          <section id="coffee-journal-examples">
            <p className="article-section-number">03</p><h2>Two coffee journal examples</h2>
            <p>If you use a V60—a cone-shaped pour-over brewer—an entry might look like this:</p>
            <dl className="journal-example">
              <ExampleRow label="Coffee">Washed coffee from Ethiopia, roasted for filter</ExampleRow><ExampleRow label="Method">V60 pour-over</ExampleRow><ExampleRow label="Recipe">15 g coffee · 250 g water · 2 minutes 45 seconds</ExampleRow><ExampleRow label="Taste">Bright and floral, but slightly thin</ExampleRow><ExampleRow label="Next time">Keep the grind setting and try a little less water</ExampleRow>
            </dl>
            <p>Once the format feels familiar, the same entry can become a quicker visual summary:</p>
            <dl className="journal-example journal-example-compact">
              <ExampleRow label="Coffee">Washed Ethiopia</ExampleRow><ExampleRow label="Brew">V60 · 15 g / 250 g · 2:45</ExampleRow><ExampleRow label="Result">Floral and bright, slightly thin</ExampleRow><ExampleRow label="Next">Use a little less water</ExampleRow>
            </dl>
            <p>The same pattern works for an espresso setup:</p>
            <dl className="journal-example journal-example-espresso">
              <ExampleRow label="Coffee">Bellissimo Italian Blend · espresso blend</ExampleRow><ExampleRow label="Machine">Isomac espresso machine</ExampleRow><ExampleRow label="Grind">Setting 8 on my grinder</ExampleRow><ExampleRow label="Brew">18 g in · 36 g out · 28 seconds</ExampleRow><ExampleRow label="Result">Smooth and chocolatey, but slightly bitter at the end</ExampleRow><ExampleRow label="Next">Keep the dose and yield; try one small step coarser</ExampleRow>
            </dl>
            <p className="article-note"><strong>Remember:</strong> this is an illustrative entry, not a universal recipe. A grind-setting number matters only when it is connected to the same grinder. Setting 8 on one grinder may be completely different from setting 8 on another.</p>
            <p>If you usually drink café coffee, the café, drink, bean, and your reaction may be enough. Your journal should match the way you actually drink coffee.</p>
          </section>

          <section id="how-to-describe-taste">
            <p className="article-section-number">04</p><h2>Use ordinary words for taste</h2>
            <p>You do not need to identify lychee, bergamot, or cacao nibs to keep a worthwhile tasting journal. Begin with questions you can answer honestly:</p>
            <ul><li>Did I enjoy it?</li><li>Did it feel bright or mellow?</li><li>Was the bitterness pleasant or distracting?</li><li>Did it feel light, creamy, or heavy?</li><li>Would I buy or brew this coffee again?</li></ul>
            <blockquote>“Sweet, clean, and easy to drink” is useful. So is “too bitter after it cooled.”</blockquote>
            <p>Personal notes are not an exam, and they do not need to agree with the words printed on the bag. When you want more structure, consistently rate a few dimensions such as acidity, sweetness, bitterness, body, balance, and aroma.</p>
            <h3>Separate liking from tasting</h3>
            <p>A strong coffee is not automatically a coffee you dislike. Sensory intensity and personal enjoyment answer different questions. Keep one simple liking score alongside any tasting dimensions. Over time, that separation makes your journal distinctly yours.</p>
          </section>

          <section id="review-your-patterns">
            <p className="article-section-number">05</p><h2>Review patterns, not isolated scores</h2>
            <p>The value of a coffee journal appears when you look back. After five or ten coffees, ask which origins, processes, flavor families, and brew methods show up in the cups you like most. Notice which small adjustment most often rescues a disappointing brew.</p>
            <p>One entry tells you what happened today. A collection of entries begins to describe your taste.</p>
            <h3>Keep the habit deliberately small</h3>
            <p>If journaling starts to feel like filling out a laboratory report, reduce it. Ask only:</p>
            <ol><li>Which coffee was it?</li><li>How did I brew or order it?</li><li>Did I like it?</li><li>What would I remember or change?</li></ol>
            <p>Add the bean when you open the bag. Add the brew while the coffee cools or immediately after drinking it. A short note captured now is more useful than a perfect note you never write.</p>
          </section>

          <section id="choose-a-format">
            <p className="article-section-number">06</p><h2>Paper, spreadsheet, or coffee journal app?</h2>
            <p>Paper is pleasant and distraction-free, but it becomes harder to search and compare as the journal grows. A spreadsheet is flexible, especially for detailed recipes, but may feel like maintenance rather than a coffee ritual.</p>
            <p>A dedicated coffee journal is most useful when it connects the same bean to multiple brews and gradually turns your history into something you can understand. Whichever format you choose, make sure you can quickly answer two questions:</p>
            <blockquote>Have I tried this coffee before?<br />What should I repeat or change next time?</blockquote>
          </section>

          <section className="article-cta"><CoffeeMark /><p>Begin with the coffee on your shelf</p><h2>Save one bean. Log one brew. Write one honest sentence.</h2><p>Beanmemo is a private personal coffee journal for your beans, brews, and evolving taste. It is free during public preview, with no credit card required.</p><Link className="button button-primary" href="/login?mode=signup">Start your free coffee journal <span aria-hidden="true">↗</span></Link></section>

          <section id="trusted-coffee-references">
            <p className="article-section-number">07</p><h2>Trusted coffee references</h2>
            <p>You do not need professional terminology to keep a personal journal. When you want a more consistent vocabulary, these independent industry resources are useful starting points:</p>
            <ul className="reference-list">
              <li><a href="https://worldcoffeeresearch.org/resources/sensory-lexicon" rel="noreferrer" target="_blank">World Coffee Research Sensory Lexicon ↗</a><span>A shared vocabulary of flavor, aroma, and texture attributes with sensory references.</span></li>
              <li><a href="https://sca.coffee/store" rel="noreferrer" target="_blank">SCA Coffee Taster’s Flavor Wheel ↗</a><span>A visual vocabulary for moving from broad impressions toward more specific descriptions.</span></li>
              <li><a href="https://sca.coffee/value-assessment/" rel="noreferrer" target="_blank">SCA Coffee Value Assessment ↗</a><span>A useful reminder that describing a coffee and deciding whether you like it are different tasks.</span></li>
            </ul>
            <p>These are professional reference systems, not rules that a home coffee journal must copy. Use them when they help you find a word; keep your own liking and next-brew decision at the center.</p>
          </section>

          <section id="coffee-journal-faq" className="article-faq">
            <p className="article-section-number">08</p><h2>Coffee journal FAQ</h2>
            <h3>What should I write in a coffee journal?</h3><p>Start with the coffee name, roaster, brew method, whether you liked it, and one sentence about what you would remember or change. Add recipe variables only when they help you compare or repeat a brew.</p>
            <h3>Do I need to understand professional coffee tasting?</h3><p>No. Ordinary descriptions such as bright, sweet, bitter, light, creamy, or balanced are useful. Your journal is meant to describe your experience, not test your vocabulary.</p>
            <h3>Should I record every cup of coffee?</h3><p>Not necessarily. Record first attempts, meaningful changes, excellent cups, and disappointing cups you want to learn from. A smaller journal you maintain is more useful than a detailed one you abandon.</p>
            <h3>What is the difference between a coffee journal and a brew log?</h3><p>A brew log focuses on preparation variables and results. A coffee journal can also remember the bean, roaster, origin, tasting experience, and personal preferences across many brews.</p>
          </section>
        </article>
      </div>

      <footer className="footer shell article-footer"><Link className="brand" href="/"><CoffeeMark /><span>Beanmemo</span></Link><p>Your coffee memories, kept close.</p><span><Link href="/privacy">Privacy</Link> · Public preview 2026</span></footer>
    </main>
  );
}
