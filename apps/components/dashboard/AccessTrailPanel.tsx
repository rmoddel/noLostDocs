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
          <strong>Metadata stays browseable.</strong>
          <span>Category review and status visibility should not imply unrestricted file access on the web.</span>
        </li>
        <li>
          <strong>Protected actions stay time-bound.</strong>
          <span>Preview and download re-check access instead of behaving like permanent public links.</span>
        </li>
        <li>
          <strong>Sensitive events stay reviewable.</strong>
          <span>The audit path is the source of truth for higher-risk access activity.</span>
        </li>
      </ul>
    </Card>
  );
}
