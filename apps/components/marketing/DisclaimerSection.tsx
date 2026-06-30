import { Card } from "../ui/Card";

export function DisclaimerSection() {
  return (
    <section className="section-block">
      <Card className="disclaimer-card">
        <p className="eyebrow">Important</p>
        <p className="disclaimer-copy">
          NoLostDocs is designed to organize and recover secure copies responsibly. Whether a digital copy is accepted
          still depends on the institution, the transaction, and the governing rules in that setting.
        </p>
      </Card>
    </section>
  );
}
