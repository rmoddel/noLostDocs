import type { DocumentTemplate, VaultCategory } from "@nolostdocs/types";
import type { CSSProperties } from "react";

type DocumentListProps = {
  category: VaultCategory & {
    totalCount: number;
    uploadedCount: number;
  };
  documents: DocumentTemplate[];
  onSelect: (documentId: string) => void;
  selectedDocumentId: string | null;
};

const statusTone: Record<DocumentTemplate["status"], string> = {
  uploaded: "Stored",
  "expiring-soon": "Review soon",
  missing: "Add file",
  expired: "Expired"
};

const placeholderByCategory: Record<VaultCategory["id"], string> = {
  family: "Custody agreement",
  medical: "Care summary",
  travel: "Passport copy",
  business: "Contract copy",
  personal: "Identity record",
  driving: "Registration copy",
  work: "License copy",
  custom: "Upload record"
};

function DocumentIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24">
      <path d="M7 4.5h6.4L17.5 8v11.5a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19.5v-13A2 2 0 0 1 7 4.5Z" />
      <path d="M13.4 4.5V8H17.5" />
      <path d="M8.6 12.1h6.8" />
      <path d="M8.6 15.2h4.3" />
    </svg>
  );
}

export function DocumentList({ category, documents, onSelect, selectedDocumentId }: DocumentListProps) {
  const targetCount = Math.max(5, documents.length);
  const placeholderCount = Math.max(0, targetCount - documents.length);

  return (
    <div className="vault-document-section">
      <div className="vault-document-grid">
        {documents.map((document) => (
          <button
            className={`vault-document-card${selectedDocumentId === document.id ? " selected" : ""}`}
            key={document.id}
            onClick={() => onSelect(document.id)}
            style={{ "--vault-accent": category.accent } as CSSProperties}
            type="button"
          >
            <span className="vault-document-icon" aria-hidden="true">
              <DocumentIcon />
            </span>
            <strong>{document.title}</strong>
            <span className="vault-document-status">{statusTone[document.status]}</span>
          </button>
        ))}

        {Array.from({ length: placeholderCount }).map((_, index) => (
          <button
            className="vault-document-card vault-document-card-empty"
            key={`placeholder-${category.id}-${index}`}
            onClick={() => onSelect(`${category.id}-placeholder-${index}`)}
            type="button"
          >
            <span className="vault-document-icon vault-document-icon-empty" aria-hidden="true">
              <svg fill="none" viewBox="0 0 24 24">
                <path d="M12 6v12" />
                <path d="M6 12h12" />
              </svg>
            </span>
            <strong>{placeholderByCategory[category.id]}</strong>
            <span className="vault-document-status">Add file</span>
          </button>
        ))}
      </div>
    </div>
  );
}
