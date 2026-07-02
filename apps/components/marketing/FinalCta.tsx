import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

export function FinalCta() {
  return (
    <section className="section-block">
      <Card className="final-cta">
        <div>
          <p className="eyebrow">Start with the web app</p>
          <h2>Bring essential records into one accountable system.</h2>
          <p className="section-copy">
            The current release focuses on responsive web access, disciplined record organization, and a security posture suited to sensitive records.
          </p>
        </div>
        <div className="hero-actions">
          <Button href="/login">Sign in</Button>
          <Button href="/contact" variant="secondary">
            Contact support
          </Button>
        </div>
      </Card>
    </section>
  );
}
