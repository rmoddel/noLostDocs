import { Card } from "../ui/Card";

export function AccessTrailPanel() {
  return (
    <Card className="side-card">
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Access trail</p>
          <h3>Access trail.</h3>
        </div>
      </div>
      <ul className="note-list">
        <li>
          <strong>Metadata is browseable.</strong>
          <span>Category and status review should never imply unrestricted file ownership on the web.</span>
        </li>
        <li>
          <strong>Protected actions are short-lived.</strong>
          <span>Preview and download should re-check access instead of behaving like permanent public links.</span>
        </li>
        <li>
          <strong>Suspicious patterns should be reviewable.</strong>
          <span>The audit-log function remains the code-owned place to centralize those sensitive events.</span>
        </li>
      </ul>
    </Card>
  );
}
