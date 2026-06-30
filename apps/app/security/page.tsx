import { SecuritySection } from "@/components/marketing/SecuritySection";
import { Card } from "@/components/ui/Card";

export default function SecurityPage() {
  return (
    <section className="page-section">
      <Card className="content-card">
        <p className="eyebrow">Security</p>
        <h1>Built for records that require a more disciplined standard.</h1>
        <p className="section-copy">
          NoLostDocs is built around a web-first trust model with private storage boundaries, signed-in account access, protected downloads, and explicit recovery controls.
        </p>
      </Card>
      <SecuritySection />
    </section>
  );
}
