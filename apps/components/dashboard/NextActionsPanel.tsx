import type { DocumentTemplate } from "@nolostdocs/types";
import { Card } from "../ui/Card";

type NextActionsPanelProps = {
  documents: DocumentTemplate[];
};

export function NextActionsPanel({ documents }: NextActionsPanelProps) {
  return (
    <Card className="side-card">
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Next actions</p>
          <h3>Priority items.</h3>
        </div>
      </div>
      {documents.length ? (
        <ul className="note-list">
          {documents.slice(0, 4).map((template) => (
            <li key={template.id}>
              <strong>{template.title}</strong>
              <span>{template.note ?? template.helper}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="section-support">There are no urgent or outstanding record actions right now.</p>
      )}
    </Card>
  );
}
