"use client";

import type { CategoryId, DocumentTemplate, VaultCategory } from "@nolostdocs/types";
import { prototypeSnapshot } from "@nolostdocs/config";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { runProtectedDocumentAction } from "@/lib/documents/download";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { AccessTrailPanel } from "./AccessTrailPanel";
import { CategoryGrid } from "./CategoryGrid";
import { DocumentDetail } from "./DocumentDetail";
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

function normalizeTitle(title: string) {
  return title.trim().toLowerCase();
}

function dedupeDocumentsByTitle(documents: DocumentTemplate[]) {
  const seen = new Set<string>();

  return documents.filter((document) => {
    const normalizedTitle = normalizeTitle(document.title);

    if (!normalizedTitle || seen.has(normalizedTitle)) {
      return false;
    }

    seen.add(normalizedTitle);
    return true;
  });
}

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
  const { client, configured } = createBrowserSupabaseClient();
  const { session } = useAuth();
  const [selectedCategoryId, setSelectedCategoryId] = useState<CategoryId | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(initialDocuments[0]?.id ?? null);
  const [documentMessage, setDocumentMessage] = useState<string | null>(initialDocumentMessage);
  const [documents, setDocuments] = useState<DocumentTemplate[]>(initialDocuments);
  const [actionLoading, setActionLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const categorySummaries = useMemo<CategorySummary[]>(
    () =>
      categoryOrder
        .map((categoryId) => prototypeSnapshot.categories.find((category) => category.id === categoryId))
        .filter((category): category is VaultCategory => Boolean(category))
        .map((category) => {
          const categoryDocuments = dedupeDocumentsByTitle(documents.filter((document) => document.category === category.id));
          const uploadedCount = categoryDocuments.filter((document) => document.status === "uploaded").length;

          return {
            ...category,
            totalCount: categoryDocuments.length,
            uploadedCount
          };
        }),
    [documents]
  );

  const selectedCategory = useMemo(
    () => categorySummaries.find((category) => category.id === selectedCategoryId) ?? null,
    [categorySummaries, selectedCategoryId]
  );

  const selectedCategoryDocuments = useMemo(
    () => dedupeDocumentsByTitle(documents.filter((document) => document.category === selectedCategoryId)),
    [documents, selectedCategoryId]
  );

  const selectedDocument = useMemo(
    () => documents.find((document) => document.id === selectedDocumentId) ?? null,
    [documents, selectedDocumentId]
  );

  const uploadedCount = documents.filter((document) => document.status === "uploaded").length;
  const urgentCount = documents.filter((document) => document.status === "expiring-soon" || document.status === "expired").length;
  const missingCount = documents.filter((document) => document.status === "missing").length;

  useEffect(() => {
    setDocumentMessage(initialDocumentMessage);
  }, [initialDocumentMessage]);

  useEffect(() => {
    let active = true;
    const documentFileId = selectedDocument?.documentFileId;

    if (!configured || !session || !documentFileId || !selectedDocument?.mimeType?.startsWith("image/")) {
      setPreviewUrl(null);
      return () => {
        active = false;
      };
    }

    async function loadPreviewUrl() {
      const { data, error } = await client.functions.invoke("create-signed-download", {
        body: {
          documentFileId
        }
      });

      if (!active || error) {
        return;
      }

      const signedUrl = typeof data?.signedUrl === "string" ? data.signedUrl : null;
      setPreviewUrl(signedUrl);
    }

    void loadPreviewUrl();

    return () => {
      active = false;
    };
  }, [client, configured, selectedDocument, session]);

  function handleSelectCategory(categoryId: CategoryId) {
    setSelectedCategoryId(categoryId);

    const nextCategoryDocuments = dedupeDocumentsByTitle(documents.filter((document) => document.category === categoryId));
    setSelectedDocumentId(nextCategoryDocuments[0]?.id ?? null);
    setDocumentMessage(null);
  }

  function handleBackToOverview() {
    setSelectedCategoryId(null);
    setSelectedDocumentId(initialDocuments[0]?.id ?? null);
  }

  function handleAddDraft(title: string) {
    const category = selectedCategoryId ?? "custom";
    const trimmedTitle = title.trim();
    const nextTitle = trimmedTitle || "Untitled record";
    const id = crypto.randomUUID();

    const nextDocument: DocumentTemplate = {
      id,
      category,
      helper: "Add a file to complete this record.",
      status: "missing",
      title: nextTitle
    };

    setDocuments((current) => [nextDocument, ...current]);
    setSelectedCategoryId(category);
    setSelectedDocumentId(id);
    setDocumentMessage(null);
  }

  function handleDeleteDocument(documentId: string) {
    const nextDocuments = documents.filter((document) => document.id !== documentId);
    setDocuments(nextDocuments);

    if (selectedDocumentId === documentId) {
      setSelectedDocumentId(nextDocuments.find((document) => document.category === selectedCategoryId)?.id ?? nextDocuments[0]?.id ?? null);
    }
  }

  function handleRenameDocument(documentId: string, title: string) {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    setDocuments((current) =>
      current.map((document) =>
        document.id === documentId ? { ...document, title: trimmedTitle } : document
      )
    );
  }

  async function handlePreview(document: DocumentTemplate) {
    if (!session) {
      setDocumentMessage("Sign in to open protected previews.");
      return;
    }

    setActionLoading(true);

    try {
      const result = await runProtectedDocumentAction({
        action: "preview",
        client,
        configured,
        session,
        template: document
      });

      setDocumentMessage(result.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDownload(document: DocumentTemplate) {
    if (!session) {
      setDocumentMessage("Sign in to get protected downloads.");
      return;
    }

    setActionLoading(true);

    try {
      const result = await runProtectedDocumentAction({
        action: "download",
        client,
        configured,
        session,
        template: document
      });

      setDocumentMessage(result.message);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <section className="page-section dashboard-page">
      <div className="dashboard-hero">
        <div className="hero-copy dashboard-copy">
          <p className="eyebrow">Records</p>
          <h1>Records, access, and status in one place.</h1>
          <p className="hero-lede">The records view keeps categories, document status, and protected file access together.</p>
          <div className="hero-actions">
            <Button href="/scan">Add record</Button>
            <Button href="#records" variant="ghost">
              View records
            </Button>
          </div>
        </div>

        <Card className="dashboard-summary-card">
          <p className="eyebrow">Current records</p>
          <h2>{documents.length ? "Records are loaded." : "No records yet."}</h2>
          <div className="summary-metrics">
            <div className="summary-metric">
              <strong>{uploadedCount}</strong>
              <span>stored</span>
            </div>
            <div className="summary-metric">
              <strong>{missingCount}</strong>
              <span>missing</span>
            </div>
            <div className="summary-metric">
              <strong>{urgentCount}</strong>
              <span>needs review</span>
            </div>
          </div>
          <p className="section-support">Cloud-backed records stay visible, protected retrieval stays deliberate, and the selected category keeps the view focused.</p>
          {documentMessage ? <p className="inline-feedback">{documentMessage}</p> : null}
        </Card>
      </div>

      <div className="dashboard-layout" id="records">
        <div className="dashboard-main">
          <Card className="dashboard-section-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Record groups</p>
                <h3>{selectedCategory ? selectedCategory.title : "Choose a category"}</h3>
              </div>
              <div className="button-row">
                {selectedCategory ? (
                  <Button onClick={handleBackToOverview} size="sm" variant="secondary">
                    All groups
                  </Button>
                ) : null}
                <span className="mini-pill">{selectedCategory ? `${selectedCategory.totalCount} records` : `${categorySummaries.length} categories`}</span>
              </div>
            </div>

            <CategoryGrid
              categories={categorySummaries}
              onSelect={handleSelectCategory}
              selectedCategoryId={selectedCategoryId}
              renderIcon={buildCategoryIcon}
            />
          </Card>

          <Card className="dashboard-section-card">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Record list</p>
                <h3>{selectedCategory ? selectedCategory.title : "All records"}</h3>
              </div>
              <span className="mini-pill">{selectedCategory ? `${selectedCategoryDocuments.length} shown` : `${documents.length} total`}</span>
            </div>

            {selectedCategory ? (
              <DocumentList
                category={selectedCategory}
                documents={selectedCategoryDocuments}
                onAddDraft={handleAddDraft}
                onDeleteDocument={handleDeleteDocument}
                onRenameDocument={handleRenameDocument}
                onSelect={setSelectedDocumentId}
                selectedDocumentId={selectedDocumentId}
              />
            ) : (
              <p className="section-support">Choose a category to review the records inside it.</p>
            )}
          </Card>
        </div>

        <div className="dashboard-side">
          {selectedDocument ? (
            <DocumentDetail
              actionLoading={actionLoading}
              actionMessage={documentMessage}
              document={selectedDocument}
              onDownload={handleDownload}
              onPreview={handlePreview}
              previewUrl={previewUrl}
            />
          ) : (
            <Card className="side-card detail-card">
              <div className="section-heading compact">
                <div>
                  <p className="eyebrow">Record preview</p>
                  <h3>Select a record</h3>
                </div>
              </div>
              <p className="section-support">Choose a category and a record to preview the file, open a protected copy, or request a signed download.</p>
            </Card>
          )}

          <AccessTrailPanel />
        </div>
      </div>
    </section>
  );
}
