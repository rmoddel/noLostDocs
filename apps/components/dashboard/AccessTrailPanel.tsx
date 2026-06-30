import { Card } from "../ui/Card";

export function AccessTrailPanel() {
  return (
    <Card className="side-card">
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Access trail</p>
          <h3>Access controls in practice.</h3>
        </div>
      </div>
      <ul className="note-list">
        <li>
          <strong>Metadata remains browseable.</strong>
          <span>Category review and status visibility should never imply unrestricted file access on the web.</span>
        </li>
        <li>
          <strong>Protected actions stay time-bounded.</strong>
          <span>Preview and download should re-check access rather than behave like permanent public links.</span>
        </li>
        <li>
          <strong>Sensitive events should be reviewable.</strong>
          <span>The audit path remains the code-owned place to centralize higher-risk access activity.</span>
        </li>
      </ul>
    </Card>
  );
}
