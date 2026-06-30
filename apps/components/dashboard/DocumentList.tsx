import type { DocumentTemplate } from "@nolostdocs/types";
import type { DashboardGroup } from "@/constants/launcherGroups";
import { Card } from "../ui/Card";

const statusTone: Record<DocumentTemplate["status"], string> = {
  uploaded: "Filed",
  "expiring-soon": "Review due",
  missing: "Outstanding",
  expired: "Expired"
};

type DocumentListProps = {
  documents: DocumentTemplate[];
  onSelect: (documentId: string) => void;
  selectedDocumentId: string | null;
  selectedGroup: DashboardGroup;
  uploadedCount: number;
};

export function DocumentList({ documents, onSelect, selectedDocumentId, selectedGroup, uploadedCount }: DocumentListProps) {
  return (
    <Card className="side-card selected-group-card">
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Selected group</p>
          <h3>{selectedGroup.title}</h3>
        </div>
        <span className="panel-note">
          {uploadedCount}/{documents.length} filed
        </span>
      </div>

      {documents.length ? (
        <div className="document-action-list">
          {documents.map((template) => (
            <button
              className={`document-action status-${template.status}${selectedDocumentId === template.id ? " selected" : ""}`}
              key={template.id}
              onClick={() => onSelect(template.id)}
              type="button"
            >
              <div>
                <strong>{template.title}</strong>
                <p>{template.note ?? template.helper}</p>
              </div>
              <span className={`status-pill status-${template.status}`}>{statusTone[template.status]}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="section-support">No records have been added to this category yet.</p>
      )}
    </Card>
  );
}
