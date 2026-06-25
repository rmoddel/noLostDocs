import type { DocumentTemplate } from "@doc-wallet/types";
import {
  buildAccessMessage,
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
  onToggleAccessExplainer: () => void;
  showAccessExplainer: boolean;
};

export function DocumentDetail({
  actionLoading,
  actionMessage,
  document,
  onDownload,
  onPreview,
  onToggleAccessExplainer,
  showAccessExplainer
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
          Authorized preview
        </Button>
        <Button disabled={actionLoading} onClick={() => onDownload(document)} size="sm" variant="secondary">
          Authorized download
        </Button>
        <Button onClick={onToggleAccessExplainer} size="sm" variant="secondary">
          Why protected?
        </Button>
      </div>

      {showAccessExplainer ? (
        <div className="access-explainer">
          <strong>Web access stays scoped.</strong>
          <p>
            Metadata browsing is always lighter than file access. Protected actions stay short-lived, can require a fresh
            check, and are intended to be auditable.
          </p>
        </div>
      ) : null}

      {actionMessage ? <p className="inline-feedback">{actionMessage}</p> : null}
      {!actionMessage ? <p className="section-support">{buildAccessMessage("preview", document)}</p> : null}
    </Card>
  );
}
