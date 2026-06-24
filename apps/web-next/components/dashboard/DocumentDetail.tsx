import type { DocumentTemplate } from "@doc-wallet/types";
import { Card } from "../ui/Card";

type DocumentAccessState = "available" | "reauth-required" | "restricted" | "session-expired";

const statusTone: Record<DocumentTemplate["status"], string> = {
  uploaded: "Saved",
  "expiring-soon": "Soon",
  missing: "Missing",
  expired: "Expired"
};

const accessStateTone: Record<DocumentAccessState, string> = {
  available: "Authorized now",
  "reauth-required": "Re-check required",
  restricted: "Restricted",
  "session-expired": "Session expired"
};

function getDocumentAccessState(template: DocumentTemplate): DocumentAccessState {
  if (template.status === "uploaded") return "available";
  if (template.status === "expiring-soon") return "reauth-required";
  if (template.status === "expired") return "session-expired";
  return "restricted";
}

function formatExpiration(template: DocumentTemplate) {
  if (!template.expiresAt) {
    return "No tracked expiration";
  }

  return new Date(`${template.expiresAt}T12:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

type DocumentDetailProps = {
  document: DocumentTemplate | null;
};

export function DocumentDetail({ document }: DocumentDetailProps) {
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
        <span className={`status-pill access-${accessState}`}>{accessStateTone[accessState]}</span>
      </div>

      <div className="detail-grid">
        <div className="detail-stat">
          <span>Status</span>
          <strong>{statusTone[document.status]}</strong>
        </div>
        <div className="detail-stat">
          <span>Expiration</span>
          <strong>{formatExpiration(document)}</strong>
        </div>
        <div className="detail-stat">
          <span>Completeness</span>
          <strong>{document.status === "uploaded" ? "Complete" : "Needs attention"}</strong>
        </div>
      </div>

      <p className="section-support">{document.note ?? document.helper}</p>
      <div className="access-explainer">
        <strong>Protected actions come next.</strong>
        <p>
          Phase 3 ports the signed-in shell and category-first structure. Protected preview and download behavior stays for the next phase.
        </p>
      </div>
    </Card>
  );
}
