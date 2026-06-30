import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function NotFound() {
  return (
    <section className="page-section">
      <Card className="content-card compact-card">
        <p className="eyebrow">Not found</p>
        <h1>That page is not part of the active surface.</h1>
        <p className="section-copy">
          The route surface is intentionally narrow. Return to the homepage or the workspace entry points to continue.
        </p>
        <div className="hero-actions">
          <Button href="/">Back home</Button>
          <Button href="/dashboard" variant="secondary">
            Open workspace
          </Button>
        </div>
      </Card>
    </section>
  );
}
