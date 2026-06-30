import { brand } from "@/constants/brand";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

export function HeroSection() {
  return (
    <section className="hero-grid">
      <div className="hero-copy">
        <Badge tone="accent">NoLostDocs</Badge>
        <h1>{brand.shortHeadline}</h1>
        <p className="hero-lede">{brand.description}</p>
        <div className="hero-actions">
          <Button href="/login">Open your account</Button>
          <Button href="/security" variant="secondary">
            Review the trust model
          </Button>
        </div>
        <div className="hero-facts">
          <span>Cloud-backed recovery</span>
          <span>Account-based controls</span>
          <span>Operational document structure</span>
        </div>
      </div>
      <Card className="hero-panel">
        <div className="hero-panel-stack">
          <div className="hero-panel-item">
            <strong>Built for high-friction moments.</strong>
            <p>Find the right record quickly, then move into details and protected actions without reorienting yourself.</p>
          </div>
          <div className="hero-panel-item">
            <strong>Clear boundaries, not vague promises.</strong>
            <p>Cloud-backed files remain explicit in the web experience. Local-only behavior is not implied, and protected access remains scoped.</p>
          </div>
          <div className="hero-panel-item">
            <strong>Recovery is part of the product, not an afterthought.</strong>
            <p>Device controls, signed-in access, and document recovery operate inside the same trust model.</p>
          </div>
        </div>
      </Card>
    </section>
  );
}
