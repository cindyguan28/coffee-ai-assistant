import Link from "next/link";

export type GuideSection = readonly [id: string, label: string];

const guides = [
  ["/coffee-journal", "Coffee journal"],
  ["/coffee-tasting-notes", "Tasting notes"],
  ["/brew-log", "Brew log"],
  ["/discover-your-coffee-taste", "Discover your taste"],
  ["/coffee-bean-tracker", "Bean tracker"],
] as const;

function CoffeeMark() {
  return <span className="coffee-mark" aria-hidden="true"><span /></span>;
}

export function GuideExample({ rows, className = "" }: { rows: Array<[string, React.ReactNode]>; className?: string }) {
  return <dl className={`journal-example ${className}`.trim()}>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

export function PublicGuide({
  title,
  titleAccent,
  description,
  route,
  sections,
  children,
}: {
  title: string;
  titleAccent: string;
  description: string;
  route: string;
  sections: GuideSection[];
  children: React.ReactNode;
}) {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${title} ${titleAccent}`,
    description,
    datePublished: "2026-09-12",
    dateModified: "2026-09-12",
    author: { "@type": "Organization", name: "Beanmemo" },
    publisher: { "@type": "Organization", name: "Beanmemo" },
    mainEntityOfPage: `https://beanmemo.com${route}`,
  };

  return <main className="article-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd).replace(/</g, "\\u003c") }} />
    <nav className="nav shell" aria-label="Main navigation">
      <Link className="brand" href="/" aria-label="Beanmemo home"><CoffeeMark /><span>Beanmemo</span></Link>
      <Link className="article-nav-label article-home-link" href="/">← Back to Beanmemo</Link>
      <Link className="nav-action" href="/login?mode=signup">Start free <span aria-hidden="true">↗</span></Link>
    </nav>

    <header className="article-hero shell">
      <p className="kicker"><span /> Beanmemo guide</p>
      <h1>{title} <em>{titleAccent}</em></h1>
      <p className="article-deck">{description}</p>
      <div className="article-byline"><span>By Beanmemo</span><span aria-hidden="true">·</span><time dateTime="2026-09-12">September 12, 2026</time></div>
    </header>

    <div className="article-layout shell">
      <aside className="article-toc" aria-label="On this page"><p>On this page</p><ol>{sections.map(([id, label]) => <li key={id}><a href={`#${id}`}>{label}</a></li>)}</ol></aside>
      <article className="article-content">
        {children}
        <section className="article-cta"><CoffeeMark /><p>Keep what matters</p><h2>Remember the coffee. Learn from the cup.</h2><p>Beanmemo keeps your coffees, brews, and personal taste together in one private space. It is free during public preview, with no credit card required.</p><Link className="button button-primary" href="/login?mode=signup">Start your free coffee journal <span aria-hidden="true">↗</span></Link></section>
        <section className="guide-links" aria-labelledby="related-guides"><p className="article-section-number">KEEP READING</p><h2 id="related-guides">Related coffee guides</h2><div>{guides.filter(([href]) => href !== route).map(([href, label]) => <Link key={href} href={href}><span>{label}</span><b aria-hidden="true">↗</b></Link>)}</div></section>
      </article>
    </div>

    <footer className="footer shell article-footer"><Link className="brand" href="/"><CoffeeMark /><span>Beanmemo</span></Link><p>Your coffee memories, kept close.</p><span><Link href="/privacy">Privacy</Link> · Public preview 2026</span></footer>
  </main>;
}
