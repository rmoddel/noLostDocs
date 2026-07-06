"use client";

import type { DocumentTemplate } from "@nolostdocs/types";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { runProtectedDocumentAction } from "@/lib/documents/download";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type {
  DashboardCategoryRecord,
  DashboardDocumentRecord,
  DashboardDocumentTypeRecord,
  DashboardProfileRecord
} from "@/lib/documents/dashboard";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { DocumentDetail } from "./DocumentDetail";

type DashboardData = {
  categories: DashboardCategoryRecord[];
  documentTypes: DashboardDocumentTypeRecord[];
  documents: DashboardDocumentRecord[];
  profiles: DashboardProfileRecord[];
};

type DashboardShellProps = {
  initialData: DashboardData;
  initialDocumentMessage: string | null;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function toTemplate(document: DashboardDocumentRecord): DocumentTemplate {
  return {
    category: "custom",
    categoryId: document.category_id ?? undefined,
    categoryName: document.category_name ?? undefined,
    contentType: document.content_type ?? undefined,
    documentDate: document.document_date ?? undefined,
    documentFileId: document.document_file_id ?? undefined,
    documentId: document.id,
    documentTypeId: document.document_type_id ?? undefined,
    documentTypeName: document.document_type_name ?? undefined,
    expirationDate: document.expiration_date ?? undefined,
    expiresAt: document.expiration_date ?? undefined,
    fileRole: document.file_role ?? undefined,
    hasFile: Boolean(document.storage_path),
    helper: document.notes ?? "Protected file available in your account.",
    id: document.id,
    issueDate: document.issue_date ?? undefined,
    mimeType: document.content_type ?? undefined,
    note: document.notes ?? undefined,
    notes: document.notes ?? undefined,
    originalFilename: document.original_filename ?? undefined,
    ownerProfileId: document.owner_profile_id ?? undefined,
    ownerProfileName: document.owner_profile_name ?? undefined,
    ownerProfileType: document.owner_profile_type ?? undefined,
    pageCount: document.page_count ?? undefined,
    status: document.status as DocumentTemplate["status"],
    storageBucket: document.storage_bucket ?? undefined,
    storagePath: document.storage_path ?? undefined,
    tags: document.tags ?? undefined,
    title: document.title,
    updatedAt: document.updated_at
  };
}

function buildIcon(slug: string) {
  switch (slug) {
    case "personal-family":
      return (
        <svg fill="none" viewBox="0 0 24 24">
          <path d="M7 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="M15 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
          <path d="M3.5 19c.4-3 2.6-5 5.5-5s5.1 2 5.5 5" />
          <path d="M13.5 18.5c.3-2 1.8-3.5 3.7-3.5 1.7 0 3 1 3.8 2.8" />
        </svg>
      );
    case "health":
      return (
        <svg fill="none" viewBox="0 0 24 24">
          <path d="M12 20.2 5.8 14C3.6 11.8 3.6 8.3 5.8 6.1c2-2 5.1-2.2 7.4-.7 2.3-1.5 5.4-1.3 7.4.7 2.2 2.2 2.2 5.7 0 7.9L12 20.2Z" />
          <path d="M12 8.3v7.4" />
          <path d="M8.3 12h7.4" />
        </svg>
      );
    case "home-car":
      return (
        <svg fill="none" viewBox="0 0 24 24">
          <path d="M4.5 13.8 12 7l7.5 6.8" />
          <path d="M6.5 12.8V19h11v-6.2" />
          <path d="M9.5 19v-4h5v4" />
        </svg>
      );
    case "money-legal":
      return (
        <svg fill="none" viewBox="0 0 24 24">
          <path d="M7 5.5h10v13H7z" />
          <path d="M9.2 9h5.6" />
          <path d="M9.2 12h5.6" />
          <path d="M9.2 15h3.2" />
        </svg>
      );
    case "work-business":
      return (
        <svg fill="none" viewBox="0 0 24 24">
          <path d="M6.5 8.5h11a1.8 1.8 0 0 1 1.8 1.8v6.2a1.8 1.8 0 0 1-1.8 1.8h-11a1.8 1.8 0 0 1-1.8-1.8v-6.2a1.8 1.8 0 0 1 1.8-1.8Z" />
          <path d="M9.5 8.5V7.2A1.7 1.7 0 0 1 11.2 5.5h1.6a1.7 1.7 0 0 1 1.7 1.7v1.3" />
          <path d="M4.7 13.2h14.6" />
        </svg>
      );
    case "travel-emergency":
      return (
        <svg fill="none" viewBox="0 0 24 24">
          <path d="M12 3.5 5.5 7v10L12 20.5l6.5-3.5V7L12 3.5Z" />
          <path d="M12 8v8" />
          <path d="M8.8 12h6.4" />
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

export function DashboardShell({ initialData, initialDocumentMessage }: DashboardShellProps) {
  const { client, configured } = createBrowserSupabaseClient();
  const { session } = useAuth();
  const [data, setData] = useState(initialData);
  const [documentMessage, setDocumentMessage] = useState<string | null>(initialDocumentMessage);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(initialData.profiles[0]?.id ?? null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(initialData.documents[0]?.id ?? null);
  const [actionLoading, setActionLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    setDocumentMessage(initialDocumentMessage);
  }, [initialDocumentMessage]);

  useEffect(() => {
    setSelectedTypeId(null);
  }, [selectedCategoryId]);

  const filteredDocuments = useMemo(() => {
    const query = normalize(searchTerm);

    return data.documents.filter((document) => {
      const matchesProfile = !selectedProfileId || document.owner_profile_id === selectedProfileId;
      const matchesCategory = !selectedCategoryId || document.category_id === selectedCategoryId;
      const matchesType = !selectedTypeId || document.document_type_id === selectedTypeId;
      const haystack = [
        document.title,
        document.document_type_name ?? "",
        document.category_name ?? "",
        document.owner_profile_name ?? "",
        document.notes ?? "",
        ...(document.tags ?? [])
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || haystack.includes(query);

      return matchesProfile && matchesCategory && matchesType && matchesSearch;
    });
  }, [data.documents, searchTerm, selectedCategoryId, selectedProfileId, selectedTypeId]);

  const selectedDocument = useMemo(
    () => filteredDocuments.find((document) => document.id === selectedDocumentId) ?? filteredDocuments[0] ?? null,
    [filteredDocuments, selectedDocumentId]
  );

  useEffect(() => {
    setSelectedDocumentId(selectedDocument?.id ?? null);
  }, [selectedDocument?.id]);

  useEffect(() => {
    let active = true;
    const documentFileId = selectedDocument?.document_file_id;

    if (!configured || !session || !documentFileId || !selectedDocument?.content_type?.startsWith("image/")) {
      setPreviewUrl(null);
      return () => {
        active = false;
      };
    }

    async function loadPreviewUrl() {
      const { data: downloadData, error } = await client.functions.invoke("create-signed-download", {
        body: {
          documentFileId
        }
      });

      if (!active || error) {
        return;
      }

      const signedUrl = typeof downloadData?.signedUrl === "string" ? downloadData.signedUrl : null;
      setPreviewUrl(signedUrl);
    }

    void loadPreviewUrl();

    return () => {
      active = false;
    };
  }, [client, configured, selectedDocument, session]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const document of data.documents) {
      if (!document.category_id) continue;
      counts.set(document.category_id, (counts.get(document.category_id) ?? 0) + 1);
    }
    return counts;
  }, [data.documents]);

  const activeCount = data.documents.filter((document) => document.status === "active" || document.status === "uploaded").length;
  const needsReviewCount = data.documents.filter((document) => document.status === "needs_review" || document.status === "expiring-soon" || document.status === "missing").length;
  const archivedCount = data.documents.filter((document) => document.status === "archived").length;

  async function handlePreview(document: DashboardDocumentRecord) {
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
        template: toTemplate(document)
      });

      setDocumentMessage(result.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDownload(document: DashboardDocumentRecord) {
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
        template: toTemplate(document)
      });

      setDocumentMessage(result.message);
    } finally {
      setActionLoading(false);
    }
  }

  const selectedTemplate = selectedDocument ? toTemplate(selectedDocument) : null;

  return (
    <section className="page-section dashboard-page">
      <div className="dashboard-layout">
        <div className="dashboard-main">
          <Card className="dashboard-section-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">NoLostDocs</p>
                <h1>Document home</h1>
                <p className="hero-lede">Find records by owner, category, document type, and metadata.</p>
              </div>
              <Button href="/scan">Scan docs</Button>
            </div>

            <div className="summary-metrics">
              <div className="summary-metric">
                <strong>{activeCount}</strong>
                <span>active</span>
              </div>
              <div className="summary-metric">
                <strong>{needsReviewCount}</strong>
                <span>needs review</span>
              </div>
              <div className="summary-metric">
                <strong>{archivedCount}</strong>
                <span>archived</span>
              </div>
            </div>
          </Card>

          <Card className="dashboard-section-card">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Search</p>
                <h3>Search documents, categories, owners, notes, and tags</h3>
              </div>
            </div>

            <input
              aria-label="Search documents"
              className="vault-search-input"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search documents, categories, owners..."
              value={searchTerm}
            />
          </Card>

          <Card className="dashboard-section-card">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Owner / profile</p>
                <h3>Filter by owner or entity</h3>
              </div>
            </div>

            <div className="button-row">
              <button className={`filter-chip${selectedProfileId === null ? " active" : ""}`} type="button" onClick={() => setSelectedProfileId(null)}>
                All
              </button>
              {data.profiles.map((profile) => (
                <button
                  className={`filter-chip${selectedProfileId === profile.id ? " active" : ""}`}
                  key={profile.id}
                  type="button"
                  onClick={() => setSelectedProfileId(profile.id)}
                >
                  {profile.display_name}
                </button>
              ))}
            </div>
          </Card>

          <Card className="dashboard-section-card">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Categories</p>
                <h3>Six high-level categories</h3>
              </div>
            </div>

            <div className="dashboard-category-grid">
              {data.categories.map((category) => (
                <button
                  className={`vault-category-card${selectedCategoryId === category.id ? " active" : ""}`}
                  key={category.id}
                  onClick={() => setSelectedCategoryId(selectedCategoryId === category.id ? null : category.id)}
                  type="button"
                >
                  <span className="vault-card-icon" aria-hidden="true">
                    {buildIcon(category.slug)}
                  </span>
                  <span className="vault-card-copy">
                    <strong>{category.name}</strong>
                    <span>{category.description ?? "Category"}</span>
                  </span>
                  <span className="vault-card-count">{categoryCounts.get(category.id) ?? 0} records</span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="dashboard-section-card">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Document types</p>
                <h3>Filter by type</h3>
              </div>
            </div>

            <div className="button-row wrap">
              <button className={`filter-chip${selectedTypeId === null ? " active" : ""}`} type="button" onClick={() => setSelectedTypeId(null)}>
                All types
              </button>
              {data.documentTypes
                .filter((type) => !selectedCategoryId || type.category_id === selectedCategoryId)
                .slice(0, 16)
                .map((type) => (
                  <button
                    className={`filter-chip${selectedTypeId === type.id ? " active" : ""}`}
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedTypeId(type.id)}
                  >
                    {type.name}
                  </button>
                ))}
            </div>
          </Card>

          <Card className="dashboard-section-card">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Recent documents</p>
                <h3>{filteredDocuments.length ? `${filteredDocuments.length} matching records` : "No records match"}</h3>
              </div>
            </div>

            <div className="document-row-list">
              {filteredDocuments.map((document) => (
                <button
                  className={`document-row${selectedDocument?.id === document.id ? " active" : ""}`}
                  key={document.id}
                  onClick={() => setSelectedDocumentId(document.id)}
                  type="button"
                >
                  <span className="document-row-title">
                    <strong>{document.title}</strong>
                    <span>{document.document_type_name ?? "Document type"}</span>
                  </span>
                  <span className="document-row-meta">{document.owner_profile_name ?? "Me"}</span>
                  <span className="document-row-meta">{document.category_name ?? "Category"}</span>
                  <span className="document-row-meta">{document.updated_at.slice(0, 10)}</span>
                  <span className={`status-pill status-${document.status}`}>{document.status.replace("_", " ")}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="dashboard-side">
          {selectedTemplate ? (
            <DocumentDetail
              actionLoading={actionLoading}
              actionMessage={documentMessage}
              document={selectedTemplate}
              onDownload={() => void handleDownload(selectedDocument!)}
              onPreview={() => void handlePreview(selectedDocument!)}
              previewUrl={previewUrl}
            />
          ) : (
            <Card className="side-card detail-card">
              <div className="section-heading compact">
                <div>
                  <p className="eyebrow">Record preview</p>
                  <h3>Select a document</h3>
                </div>
              </div>
              <p className="section-support">Choose a record to inspect its status, file access, and protected download options.</p>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
