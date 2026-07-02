"use client";

import type { CategoryId, DocumentTemplate, VaultCategory } from "@nolostdocs/types";
import { useMemo, useState } from "react";
import { prototypeSnapshot } from "@nolostdocs/config";
import { CategoryGrid } from "./CategoryGrid";
import { DocumentList } from "./DocumentList";

type DashboardShellProps = {
  initialDocumentMessage: string | null;
  initialDocuments: DocumentTemplate[];
};

type CategorySummary = VaultCategory & {
  uploadedCount: number;
  totalCount: number;
};

const categoryOrder: CategoryId[] = ["family", "medical", "travel", "business", "personal", "driving", "work", "custom"];

function buildCategoryIcon(categoryId: CategoryId) {
  switch (categoryId) {
    case "family":
      return (
        <svg fill="none" viewBox="0 0 24 24">
          <path d="M7 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="M15 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
          <path d="M3.5 19c.4-3 2.6-5 5.5-5s5.1 2 5.5 5" />
          <path d="M13.5 18.5c.3-2 1.8-3.5 3.7-3.5 1.7 0 3 1 3.8 2.8" />
        </svg>
      );
    case "medical":
      return (
        <svg fill="none" viewBox="0 0 24 24">
          <path d="M12 20.2 5.8 14C3.6 11.8 3.6 8.3 5.8 6.1c2-2 5.1-2.2 7.4-.7 2.3-1.5 5.4-1.3 7.4.7 2.2 2.2 2.2 5.7 0 7.9L12 20.2Z" />
          <path d="M12 8.3v7.4" />
          <path d="M8.3 12h7.4" />
        </svg>
      );
    case "travel":
      return (
        <svg fill="none" viewBox="0 0 24 24">
          <path d="m2.5 13 8.2-2.1 4.4-6.6 1.8.8-2.4 7 4.3 1.6 2.6-2 .6 1.3-2 3.1-7.5-.3-3.2 5.1-1.8-.7 1.6-5.1-5.1-2.2L2.5 13Z" />
        </svg>
      );
    case "business":
      return (
        <svg fill="none" viewBox="0 0 24 24">
          <path d="M4.5 8.5h15v9.2a1.8 1.8 0 0 1-1.8 1.8H6.3a1.8 1.8 0 0 1-1.8-1.8V8.5Z" />
          <path d="M9 8.5V7a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 7v1.5" />
          <path d="M4.5 12.5h15" />
        </svg>
      );
    case "personal":
      return (
        <svg fill="none" viewBox="0 0 24 24">
          <path d="M4.5 6.5h15v11h-15v-11Z" />
          <path d="M8.5 10.2h3.6" />
          <path d="M8.5 14.2h6.5" />
          <path d="M14.7 10.2h1.2" />
        </svg>
      );
    case "driving":
      return (
        <svg fill="none" viewBox="0 0 24 24">
          <path d="M6 14.5h12l1.2 3.5H4.8L6 14.5Z" />
          <path d="M7.6 14.5 9 9.2h6l1.4 5.3" />
          <path d="M7.3 18.8h.2" />
          <path d="M16.5 18.8h.2" />
        </svg>
      );
    case "work":
      return (
        <svg fill="none" viewBox="0 0 24 24">
          <path d="M6.5 8.5h11a1.8 1.8 0 0 1 1.8 1.8v6.2a1.8 1.8 0 0 1-1.8 1.8h-11a1.8 1.8 0 0 1-1.8-1.8v-6.2a1.8 1.8 0 0 1 1.8-1.8Z" />
          <path d="M9.5 8.5V7.2A1.7 1.7 0 0 1 11.2 5.5h1.6a1.7 1.7 0 0 1 1.7 1.7v1.3" />
          <path d="M4.7 13.2h14.6" />
        </svg>
      );
    default:
      return (
        <svg fill="none" viewBox="0 0 24 24">
          <path d="M5 5.5h14v13H5z" />
          <path d="M8 9h8" />
          <path d="M8 12h8" />
        </svg>
      );
  }
}

export function DashboardShell({ initialDocumentMessage, initialDocuments }: DashboardShellProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<CategoryId | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [documentMessage] = useState<string | null>(initialDocumentMessage);
  const [documents] = useState<DocumentTemplate[]>(initialDocuments);

  const categorySummaries = useMemo<CategorySummary[]>(
    () =>
      categoryOrder
        .map((categoryId) => prototypeSnapshot.categories.find((category) => category.id === categoryId))
        .filter((category): category is VaultCategory => Boolean(category))
        .map((category) => {
          const categoryDocuments = documents.filter((document) => document.category === category.id);

          return {
            ...category,
            totalCount: Math.max(categoryDocuments.length + 1, 5),
            uploadedCount: categoryDocuments.length
          };
        }),
    [documents]
  );

  const selectedCategory = useMemo(
    () => categorySummaries.find((category) => category.id === selectedCategoryId) ?? null,
    [categorySummaries, selectedCategoryId]
  );

  const selectedCategoryDocuments = useMemo(
    () => documents.filter((document) => document.category === selectedCategoryId),
    [documents, selectedCategoryId]
  );

  function handleSelectCategory(categoryId: CategoryId) {
    setSelectedCategoryId(categoryId);
    setSelectedDocumentId(null);
  }

  function handleBackToOverview() {
    setSelectedCategoryId(null);
    setSelectedDocumentId(null);
  }

  return (
    <section className="vault-shell">
      <div className="vault-frame">
        {!selectedCategory ? (
          <>
            <header className="vault-header">
              <p className="vault-kicker">Your records</p>
              <h1>Records</h1>
            </header>

            <CategoryGrid
              categories={categorySummaries}
              onSelect={handleSelectCategory}
              selectedCategoryId={selectedCategoryId}
              renderIcon={buildCategoryIcon}
            />
          </>
        ) : (
          <>
            <header className="vault-detail-header">
              <button className="vault-back-button" onClick={handleBackToOverview} type="button" aria-label="Back to categories">
                <svg fill="none" viewBox="0 0 24 24">
                  <path d="M15.5 5.5 9 12l6.5 6.5" />
                </svg>
              </button>

              <div className="vault-detail-copy">
                <p className="vault-kicker">{selectedCategory.uploadedCount} of {selectedCategory.totalCount} uploaded</p>
                <h1>{selectedCategory.title}</h1>
              </div>
            </header>

            <DocumentList
              category={selectedCategory}
              documents={selectedCategoryDocuments}
              onSelect={setSelectedDocumentId}
              selectedDocumentId={selectedDocumentId}
            />
          </>
        )}

        {documentMessage ? <p className="vault-message">{documentMessage}</p> : null}
      </div>
    </section>
  );
}
