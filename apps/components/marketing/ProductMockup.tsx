import { Card } from "../ui/Card";
import { SectionHeader } from "../ui/SectionHeader";

const mockupRows = [
  { label: "Registration", state: "Filed", tone: "ok" },
  { label: "Insurance card", state: "Review due", tone: "warn" },
  { label: "RN license", state: "Outstanding", tone: "muted" }
] as const;

export function ProductMockup() {
  return (
    <section className="section-block">
      <SectionHeader
        description="The experience should feel clear before it feels dense. Categories lead, records remain protected, and account state stays visible."
        eyebrow="Records preview"
        title="A workspace designed for accountable records."
      />
      <div className="mockup-grid">
        <Card className="mockup-card">
          <div className="mockup-shell">
            <div className="mockup-sidebar">
              <span className="mockup-label">Records</span>
              <strong>Basic</strong>
              <span>Personal</span>
              <span>Driving</span>
              <span>Travel</span>
            </div>
            <div className="mockup-main">
              <div className="mockup-toolbar">
                <span className="mockup-label">Account status</span>
                <strong>Signed-in records</strong>
              </div>
              <div className="mockup-list">
                {mockupRows.map((row) => (
                  <div className="mockup-row" key={row.label}>
                    <div>
                      <strong>{row.label}</strong>
                      <p>Protected record summary</p>
                    </div>
                    <span className={`mockup-pill mockup-pill-${row.tone}`}>{row.state}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
        <div className="mockup-copy">
          <p className="eyebrow">What the workspace should communicate</p>
          <ul className="feature-list">
            <li>Which record sets are available to this account</li>
            <li>Which documents need action or review</li>
            <li>When file access becomes a protected event</li>
            <li>Where device recovery and account controls live</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
