import type { DocumentTemplate } from "@nolostdocs/types";
import {
  documentAccessTone,
  documentStatusTone,
  formatDocumentExpiration,
  getDocumentAccessState,
  getDocumentCompleteness
} from "@/lib/documents/access";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

type DocumentDetailProps = {
  actionLoading: boolean;
  actionMessage: string | null;
  document: DocumentTemplate | null;
  onDownload: (document: DocumentTemplate) => void;
  onPreview: (document: DocumentTemplate) => void;
};

export function DocumentDetail({
  actionLoading,
  actionMessage,
  document,
  onDownload,
  onPreview
}: DocumentDetailProps) {
  if (!document) {
    return null;
  }

  const accessState = getDocumentAccessState(document);

  return (
    <Card className="side-card detail-card">
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Document detail</p>
          <h3>{document.title}</h3>
        </div>
        <span className={`status-pill access-${accessState}`}>{documentAccessTone[accessState]}</span>
      </div>

      <div className="detail-grid">
        <div className="detail-stat">
          <span>Status</span>
          <strong>{documentStatusTone[document.status]}</strong>
        </div>
        <div className="detail-stat">
          <span>Expiration</span>
          <strong>{formatDocumentExpiration(document)}</strong>
        </div>
        <div className="detail-stat">
          <span>Completeness</span>
          <strong>{getDocumentCompleteness(document)}</strong>
        </div>
      </div>

      <p className="section-support">{document.note ?? document.helper}</p>

      <div className="button-row">
        <Button disabled={actionLoading} onClick={() => onPreview(document)} size="sm">
          Open authorized preview
        </Button>
        <Button disabled={actionLoading} onClick={() => onDownload(document)} size="sm" variant="secondary">
          Request authorized download
        </Button>
      </div>

      {actionMessage ? <p className="inline-feedback">{actionMessage}</p> : null}
    </Card>
  );
}
