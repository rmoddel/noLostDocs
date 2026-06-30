import { Card } from "../ui/Card";

export function DisclaimerSection() {
  return (
    <section className="section-block">
      <Card className="disclaimer-card">
        <p className="eyebrow">Important</p>
        <p className="disclaimer-copy">
          NoLostDocs helps you keep secure copies organized. Acceptance of digital copies depends on the situation,
          provider, agency, or law.
        </p>
      </Card>
    </section>
  );
}
