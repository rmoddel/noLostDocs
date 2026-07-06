 "use client";

import type { DocumentTemplate, VaultCategory } from "@nolostdocs/types";
import type { CSSProperties } from "react";
import { useState } from "react";
import { documentTypeFeatured } from "@/constants/documentTypeTaxonomy";

type DocumentListProps = {
  category: VaultCategory & {
    totalCount: number;
    uploadedCount: number;
  };
  documents: DocumentTemplate[];
  onAddDraft: (title: string) => void;
  onDeleteDocument: (documentId: string) => void;
  onSelect: (documentId: string) => void;
  onRenameDocument: (documentId: string, title: string) => void;
  selectedDocumentId: string | null;
};

const statusTone: Record<DocumentTemplate["status"], string> = {
  active: "Stored",
  archived: "Archived",
  expired: "Expired",
  needs_review: "Review soon",
  uploaded: "Stored",
  "expiring-soon": "Review soon",
  missing: "Add record"
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

function getTypeSuggestion(categoryId: VaultCategory["id"]) {
  return documentTypeFeatured.find((item) => item.toLowerCase().includes(categoryId));
}

export function DocumentList({
  category,
  documents,
  onAddDraft,
  onDeleteDocument,
  onRenameDocument,
  onSelect,
  selectedDocumentId
}: DocumentListProps) {
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const existingTitles = new Set(
    documents.map((document) => document.title.trim().toLowerCase()).filter(Boolean)
  );
  const suggestedTitle =
    documentTypeFeatured.find(
      (item) => !existingTitles.has(item.trim().toLowerCase()) && item.toLowerCase().includes(category.id)
    ) ?? getTypeSuggestion(category.id) ?? `${category.title} record`;

  function beginRename(document: DocumentTemplate) {
    setEditingDocumentId(document.id);
    setDraftTitle(document.title);
  }

  function commitRename(documentId: string) {
    onRenameDocument(documentId, draftTitle);
    setEditingDocumentId(null);
    setDraftTitle("");
  }

  function cancelRename() {
    setEditingDocumentId(null);
    setDraftTitle("");
  }

  return (
    <div className="vault-document-section">
      <div className="vault-document-grid">
        {documents.map((document) => (
          <div className={`vault-document-card${selectedDocumentId === document.id ? " selected" : ""}`} key={document.id} style={{ "--vault-accent": category.accent } as CSSProperties}>
            <button className="vault-document-card-main" onClick={() => onSelect(document.id)} type="button">
              <span className="vault-document-icon" aria-hidden="true">
                <DocumentIcon />
              </span>
              <strong>{document.title}</strong>
              <span className="vault-document-status">{statusTone[document.status]}</span>
            </button>
            {editingDocumentId === document.id ? (
              <form
                className="vault-document-rename"
                onSubmit={(event) => {
                  event.preventDefault();
                  commitRename(document.id);
                }}
              >
                <input
                  autoFocus
                  className="vault-document-rename-input"
                  onChange={(event) => setDraftTitle(event.target.value)}
                  placeholder="Record title"
                  value={draftTitle}
                />
                <div className="vault-document-card-actions">
                  <button className="vault-document-action" type="submit">
                    Save
                  </button>
                  <button className="vault-document-action" onClick={cancelRename} type="button">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="vault-document-card-actions">
                <button className="vault-document-action" onClick={() => beginRename(document)} type="button">
                  Rename
                </button>
                <button className="vault-document-action danger" onClick={() => onDeleteDocument(document.id)} type="button">
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}

        <button className="vault-document-card vault-document-card-empty" onClick={() => onAddDraft(suggestedTitle)} type="button">
          <span className="vault-document-icon vault-document-icon-empty" aria-hidden="true">
            <svg fill="none" viewBox="0 0 24 24">
              <path d="M12 6v12" />
              <path d="M6 12h12" />
            </svg>
          </span>
          <strong>Add another record</strong>
          <span className="vault-document-status">Use a suggested type or enter your own title.</span>
        </button>
      </div>
    </div>
  );
}
