import { Card } from "../ui/Card";

export function DisclaimerSection() {
  return (
    <section className="section-block">
      <Card className="disclaimer-card">
        <p className="eyebrow">Notice</p>
        <p className="disclaimer-copy">
          NoLostDocs helps organize and recover secure copies. Acceptance of a digital copy still depends on the institution, the transaction, and the governing rules.
        </p>
      </Card>
    </section>
  );
}
