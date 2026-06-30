import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

export function FinalCta() {
  return (
    <section className="section-block">
      <Card className="final-cta">
        <div>
          <p className="eyebrow">Start with the live platform</p>
          <h2>Bring essential records into a more disciplined operating system.</h2>
          <p className="section-copy">
            The current release focuses on a responsive web experience, disciplined document organization, and the security language a sensitive platform should be able to defend.
          </p>
        </div>
        <div className="hero-actions">
          <Button href="/login">Open your account</Button>
          <Button href="/contact" variant="secondary">
            Speak with support
          </Button>
        </div>
      </Card>
    </section>
  );
}
