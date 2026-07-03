import { Card } from "../ui/Card";
import { SectionHeader } from "../ui/SectionHeader";

const mockupRows = [
  { label: "Registration", state: "Filed", tone: "ok" },
  { label: "Insurance card", state: "Review due", tone: "warn" },
  { label: "RN license", state: "Outstanding", tone: "muted" }
] as const;

const mockupPreview = {
  name: "Passport",
  status: "Current selection",
  note: "Ready to capture"
} as const;

export function ProductMockup() {
  return (
    <section className="section-block">
      <SectionHeader
        description="Records stay easy to scan, capture stays deliberate, and account state remains visible."
        eyebrow="Records preview"
        title="A records view built for accountable use."
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
              <div className="mockup-controls">
                <div className="mockup-control">
                  <span className="mockup-label">Document type</span>
                  <strong>Passport</strong>
                </div>
                <div className="mockup-control">
                  <span className="mockup-label">Quick entry</span>
                  <strong>Passport</strong>
                </div>
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
              <div className="mockup-preview">
                <div>
                  <span className="mockup-label">Selected document</span>
                  <strong>{mockupPreview.name}</strong>
                  <p>{mockupPreview.status}</p>
                </div>
                <span className="mockup-pill mockup-pill-ok">{mockupPreview.note}</span>
              </div>
            </div>
          </div>
        </Card>
        <div className="mockup-copy">
          <p className="eyebrow">What the records view should communicate</p>
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
