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
          <Button href="/login">Get Started</Button>
          <Button href="/security" variant="secondary">
            See how it works
          </Button>
        </div>
        <div className="hero-facts">
          <span>Cloud-backed recovery</span>
          <span>Signed-in access</span>
          <span>Document-first organization</span>
        </div>
      </div>
      <Card className="hero-panel">
        <div className="hero-panel-stack">
          <div className="hero-panel-item">
            <strong>Access what matters faster.</strong>
            <p>See the categories you expect first, then move into document details and protected actions.</p>
          </div>
          <div className="hero-panel-item">
            <strong>Keep the web promise honest.</strong>
            <p>Cloud-backed files stay explicit. Local-only behavior is not implied on the website.</p>
          </div>
          <div className="hero-panel-item">
            <strong>Recover without panic.</strong>
            <p>Lost device controls and web access are part of the same trust model.</p>
          </div>
        </div>
      </Card>
    </section>
  );
}
