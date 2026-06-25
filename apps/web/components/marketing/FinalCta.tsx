import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

export function FinalCta() {
  return (
    <section className="section-block">
      <Card className="final-cta">
        <div>
          <p className="eyebrow">Start with the live experience</p>
          <h2>Bring your essential records into one calmer system.</h2>
          <p className="section-copy">
            The first release focuses on a trustworthy web experience, clear document categories, and the security language a sensitive product should use.
          </p>
        </div>
        <div className="hero-actions">
          <Button href="/login">Get Started</Button>
          <Button href="/contact" variant="secondary">
            Contact support
          </Button>
        </div>
      </Card>
    </section>
  );
}
