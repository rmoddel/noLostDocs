"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <section className="page-section" role="alert">
    <h1>We couldn’t load this page.</h1>
    <p>Try again. If the problem continues, return to your records or contact support.</p>
    <div className="button-row">
      <button className="dashboard-action-button" onClick={reset} type="button">Try again</button>
      <Link href="/dashboard">Your records</Link>
      <Link href="/contact">Contact support</Link>
    </div>
  </section>;
}
