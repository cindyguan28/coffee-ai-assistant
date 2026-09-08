import Link from "next/link";

export const metadata = { title: "Privacy — Mylot Coffee" };

export default function PrivacyPage() {
  return <main className="legal-page">
    <Link className="brand" href="/"><span className="coffee-mark" aria-hidden="true"><span /></span><span>Mylot</span></Link>
    <p className="kicker"><span /> Public preview</p>
    <h1>Your coffee data<br /><em>stays yours.</em></h1>
    <section>
      <h2>What we store</h2>
      <p>Your account email, the coffees you add, generated bean profiles, and brew logs. This is the information needed to provide your private Coffee Space, My Taste, and Coffee World.</p>
      <h2>How it is protected</h2>
      <p>Authentication and storage use Supabase. Every coffee record is linked to your account and protected by database Row Level Security, so signed-in users can access only their own records.</p>
      <h2>What we do not do</h2>
      <p>We do not publish your beans or tasting notes, sell your personal data, or send your private coffee notes to local AI services. Public signup creates a private account—not a public profile.</p>
      <h2>Preview expectations</h2>
      <p>Mylot is an early public preview. Avoid entering secrets or information unrelated to coffee. Features and the data model may change while testing continues.</p>
      <h2>Questions or deletion requests</h2>
      <p>Open a private request with the project owner or use the project’s <a href="https://github.com/cindyguan28/coffee-ai-assistant/issues/new" rel="noreferrer" target="_blank">feedback channel ↗</a>. Account self-deletion will be added before a wider launch.</p>
    </section>
    <Link className="button button-primary" href="/login?mode=signup">Create my private space ↗</Link>
  </main>;
}
