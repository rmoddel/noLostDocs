import type { DocumentTemplate } from "@nolostdocs/types";
import {
  documentAccessTone,
  documentStatusTone,
  formatDocumentExpiration,
  getDocumentAccessState,
  getDocumentCompleteness
} from "@/lib/documents/access";

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
    <section className="dashboard-panel dashboard-selected-card">
      <div className="dashboard-section-header compact">
        <div>
          <div className="dashboard-section-kicker">Record details</div>
          <h2 className="dashboard-section-title">{document.title}</h2>
          <p className="dashboard-section-support">
            {document.ownerProfileName ?? "Me"}
            {document.categoryName ? ` · ${document.categoryName}` : ""}
            {document.documentTypeName ? ` · ${document.documentTypeName}` : ""}
          </p>
        </div>
        <span className={`dashboard-pill ${accessState}`}>{documentAccessTone[accessState]}</span>
      </div>

      <div className="dashboard-detail-preview">
        {previewUrl && document.mimeType?.startsWith("image/") ? (
          <img alt={`${document.title} preview`} src={previewUrl} />
        ) : (
          <div className="dashboard-detail-file-panel">
            <div className="dashboard-detail-file-icon" aria-hidden="true">
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

      <div className="dashboard-detail-grid">
        <div className="dashboard-detail-stat">
          <span>Status</span>
          <strong>{documentStatusTone[document.status]}</strong>
        </div>
        <div className="dashboard-detail-stat">
          <span>Expiration</span>
          <strong>{formatDocumentExpiration(document)}</strong>
        </div>
        <div className="dashboard-detail-stat">
          <span>Completeness</span>
          <strong>{getDocumentCompleteness(document)}</strong>
        </div>
      </div>

      <p className="dashboard-section-support">{document.note ?? document.helper}</p>

      <div className="dashboard-action-row">
        <button className="dashboard-action-button" disabled={actionLoading} onClick={() => onPreview(document)} type="button">
          Open preview
        </button>
        <button className="dashboard-action-button secondary" disabled={actionLoading} onClick={() => onDownload(document)} type="button">
          Get download
        </button>
      </div>

      {actionMessage ? <p className="dashboard-inline-feedback">{actionMessage}</p> : null}
    </section>
  );
}
