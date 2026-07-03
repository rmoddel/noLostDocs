import type { DocumentTemplate } from "@nolostdocs/types";

export type ProtectedAction = "preview" | "download";
export type DocumentAccessState = "available" | "reauth-required" | "restricted" | "session-expired";

export const documentStatusTone: Record<DocumentTemplate["status"], string> = {
  uploaded: "Saved",
  "expiring-soon": "Soon",
  missing: "Missing",
  expired: "Expired"
};

export const documentAccessTone: Record<DocumentAccessState, string> = {
  available: "Authorized now",
  "reauth-required": "Re-check required",
  restricted: "Restricted",
  "session-expired": "Session expired"
};

export function getDocumentAccessState(template: DocumentTemplate): DocumentAccessState {
  if (template.status === "uploaded") return "available";
  if (template.status === "expiring-soon") return "reauth-required";
  if (template.status === "expired") return "session-expired";
  return "restricted";
}

export function getDocumentCompleteness(template: DocumentTemplate) {
  return template.status === "uploaded" ? "Complete" : "Needs attention";
}

export function formatDocumentExpiration(template: DocumentTemplate) {
  if (!template.expiresAt) {
    return "No tracked expiration";
  }

  return new Date(`${template.expiresAt}T12:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function buildAccessMessage(action: ProtectedAction, template: DocumentTemplate) {
  const noun = action === "preview" ? "preview" : "download";
  const accessState = getDocumentAccessState(template);

  if (accessState === "restricted") {
    return `${template.title} is missing. Complete the record before requesting ${noun} access.`;
  }

  if (accessState === "reauth-required") {
    return `${template.title} needs a fresh authorization check before ${noun} access.`;
  }

  if (accessState === "session-expired") {
    return `${template.title} needs a renewed session before ${noun} access.`;
  }

  return action === "preview"
    ? `${template.title} is ready for a protected preview.`
    : `${template.title} is ready for a protected download.`;
}
