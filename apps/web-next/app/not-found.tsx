import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function NotFound() {
  return (
    <section className="page-section">
      <Card className="content-card compact-card">
        <p className="eyebrow">Not found</p>
        <h1>That page is not here.</h1>
        <p className="section-copy">
          The Next foundation keeps the route surface intentional. Use the homepage or dashboard entry points to continue.
        </p>
        <div className="hero-actions">
          <Button href="/">Back home</Button>
          <Button href="/dashboard" variant="secondary">
            Open dashboard
          </Button>
        </div>
      </Card>
    </section>
  );
}
