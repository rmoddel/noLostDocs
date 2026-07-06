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
  previewUrl: string | null;
  onDownload: (document: DocumentTemplate) => void;
  onPreview: (document: DocumentTemplate) => void;
};

export function DocumentDetail({
  actionLoading,
  actionMessage,
  document,
  previewUrl,
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
          <p className="eyebrow">Record details</p>
          <h3>{document.title}</h3>
          <p className="section-support">
            {document.ownerProfileName ?? "Me"}
            {document.categoryName ? ` · ${document.categoryName}` : ""}
            {document.documentTypeName ? ` · ${document.documentTypeName}` : ""}
          </p>
        </div>
        <span className={`status-pill access-${accessState}`}>{documentAccessTone[accessState]}</span>
      </div>

      <div className="detail-preview">
        {previewUrl && document.mimeType?.startsWith("image/") ? (
          <img alt={`${document.title} preview`} src={previewUrl} />
        ) : (
          <div className="detail-file-panel">
            <div className="scan-camera-file-icon" aria-hidden="true">
              <svg fill="none" viewBox="0 0 24 24">
                <path
                  d="M9 3h6l4 4v11a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <path d="M15 3v5h5" stroke="currentColor" strokeWidth="1.7" />
              </svg>
            </div>
            <strong>{document.title}</strong>
            <p>{document.mimeType === "application/pdf" ? "PDF available for protected retrieval." : "File available for protected retrieval."}</p>
          </div>
        )}
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
          Open preview
        </Button>
        <Button disabled={actionLoading} onClick={() => onDownload(document)} size="sm" variant="secondary">
          Get download
        </Button>
      </div>

      {actionMessage ? <p className="inline-feedback">{actionMessage}</p> : null}
    </Card>
  );
}
