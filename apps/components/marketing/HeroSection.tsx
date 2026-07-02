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
          <Button href="/login">Sign in</Button>
          <Button href="/security" variant="secondary">
            Review security
          </Button>
        </div>
        <div className="hero-facts">
          <span>Cloud-backed records</span>
          <span>Account controls</span>
          <span>Recovery controls</span>
        </div>
      </div>
      <Card className="hero-panel">
        <div className="hero-panel-stack">
          <div className="hero-panel-item">
            <strong>Built for urgent moments.</strong>
            <p>Find the right record quickly, then move into details and protected actions without losing context.</p>
          </div>
          <div className="hero-panel-item">
            <strong>Clear boundaries, not vague promises.</strong>
            <p>Cloud-backed records stay explicit in the web experience. Local-only behavior is not implied, and protected access stays scoped.</p>
          </div>
          <div className="hero-panel-item">
            <strong>Recovery is part of the workflow.</strong>
            <p>Device controls, signed-in access, and record recovery operate inside the same trust model.</p>
          </div>
        </div>
      </Card>
    </section>
  );
}
