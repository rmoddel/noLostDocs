import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function ContactPage() {
  return (
    <section className="page-section">
      <Card className="content-card">
        <p className="eyebrow">Contact</p>
        <h1>Reach the NoLostDocs team.</h1>
        <p className="section-copy">
          The contact route is live in Phase 1 so support and trust paths are visible from the first production foundation build. Form submission wiring is deferred.
        </p>
        <div className="hero-actions">
          <Button disabled>Form wiring later</Button>
          <Button href="mailto:support@nolostdocs.com" variant="secondary">
            support@nolostdocs.com
          </Button>
        </div>
      </Card>
    </section>
  );
}
