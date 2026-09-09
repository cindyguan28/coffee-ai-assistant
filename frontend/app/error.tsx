"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Beanmemo route error", { digest: error.digest, name: error.name });
  }, [error]);

  return <main className="error-page"><p className="kicker"><span /> Something went wrong</p><h1>Your coffee is safe.</h1><p>We could not load this page. Try again; if it keeps happening, send us the reference shown below.</p>{error.digest && <code>Reference: {error.digest}</code>}<button className="button button-primary" onClick={reset} type="button">Try again</button></main>;
}
