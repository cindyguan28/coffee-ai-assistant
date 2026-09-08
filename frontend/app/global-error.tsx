"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="en"><body style={{ margin: 0, background: "#f5f0e7", color: "#25211d", fontFamily: "sans-serif" }}><main style={{ maxWidth: 680, margin: "0 auto", padding: "15vh 24px" }}><h1>Mylot needs another moment.</h1><p>The application could not load safely. Your saved coffee data has not been changed.</p><button onClick={reset} style={{ padding: "14px 18px", background: "#6f3d25", color: "white", border: 0, cursor: "pointer" }}>Try again</button></main></body></html>;
}
