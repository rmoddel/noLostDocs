import { Card } from "../ui/Card";
import { SectionHeader } from "../ui/SectionHeader";

const mockupRows = [
  { label: "Registration", state: "Saved", tone: "ok" },
  { label: "Insurance card", state: "Review soon", tone: "warn" },
  { label: "RN license", state: "Missing", tone: "muted" }
] as const;

export function ProductMockup() {
  return (
    <section className="section-block">
      <SectionHeader
        description="The experience should feel clear before it feels complex. Categories lead, files stay protected, and account state stays visible."
        eyebrow="Vault preview"
        title="A calmer document workspace."
      />
      <div className="mockup-grid">
        <Card className="mockup-card">
          <div className="mockup-shell">
            <div className="mockup-sidebar">
              <span className="mockup-label">Groups</span>
              <strong>Basic</strong>
              <span>Personal</span>
              <span>Driving</span>
              <span>Travel</span>
            </div>
            <div className="mockup-main">
              <div className="mockup-toolbar">
                <span className="mockup-label">Plan status</span>
                <strong>Free Basic</strong>
              </div>
              <div className="mockup-list">
                {mockupRows.map((row) => (
                  <div className="mockup-row" key={row.label}>
                    <div>
                      <strong>{row.label}</strong>
                      <p>Protected metadata view</p>
                    </div>
                    <span className={`mockup-pill mockup-pill-${row.tone}`}>{row.state}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
        <div className="mockup-copy">
          <p className="eyebrow">What the workspace needs to communicate</p>
          <ul className="feature-list">
            <li>Which categories are available now</li>
            <li>Which records need attention</li>
            <li>When file access becomes a protected step</li>
            <li>Where recovery and device controls live</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
