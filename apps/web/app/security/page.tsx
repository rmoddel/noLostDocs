import { SecuritySection } from "@/components/marketing/SecuritySection";
import { Card } from "@/components/ui/Card";

export default function SecurityPage() {
  return (
    <section className="page-section">
      <Card className="content-card">
        <p className="eyebrow">Security</p>
        <h1>Built for records you do not want floating around.</h1>
        <p className="section-copy">
          NoLostDocs is shaping a web-first trust model around private storage, signed-in access, protected downloads, and explicit recovery controls.
        </p>
      </Card>
      <SecuritySection />
    </section>
  );
}
