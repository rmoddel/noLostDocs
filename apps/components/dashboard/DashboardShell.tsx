"use client";

import Link from "next/link";
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

const preferredProfileOrder = ["Me", "Spouse", "Child 1", "Child 2", "Family", "Business"];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function statusLabel(status: string) {
  switch (status) {
    case "active":
    case "uploaded":
      return "Active";
    case "expired":
      return "Expired";
    case "archived":
      return "Archived";
    case "needs_review":
    case "missing":
      return "Needs Review";
    case "expiring-soon":
      return "Expiring Soon";
    default:
      return "Active";
  }
}

function statusTone(status: string) {
  switch (status) {
    case "active":
    case "uploaded":
      return "active";
    case "expired":
      return "expired";
    case "archived":
      return "archived";
    case "needs_review":
    case "missing":
      return "review";
    case "expiring-soon":
      return "warning";
    default:
      return "active";
  }
}

function relativeDate(value: string) {
  const date = new Date(value);
  const now = new Date();
  const diffDays = Math.round((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  if (diffDays <= 0) {
    return "Today";
  }

  if (diffDays === 1) {
    return "Yesterday";
  }

  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function buildActivityItems(documents: DashboardDocumentRecord[]) {
  const latest = documents[0];
  const needsReview = documents.find((document) => statusTone(document.status) === "review");
  const expiring =
    documents.find((document) => statusTone(document.status) === "warning") ??
    documents.find((document) => Boolean(document.expiration_date));

  return [
    latest
      ? {
          icon: "✓",
          title: `${latest.title} stored`,
          meta: `${latest.category_name ?? "Category"} · ${latest.owner_profile_name ?? "Me"}`
        }
      : {
          icon: "✓",
          title: "Document stored",
          meta: "Saved under the active owner profile"
        },
    needsReview
      ? {
          icon: "!",
          title: `${needsReview.title} needs review`,
          meta: `${needsReview.document_type_name ?? "Document type"} · ${needsReview.owner_profile_name ?? "Me"}`
        }
      : {
          icon: "!",
          title: "Review queue clear",
          meta: "No urgent document metadata issues detected"
        },
    expiring
      ? {
          icon: "↗",
          title: `${expiring.title} expiring soon`,
          meta: `${expiring.category_name ?? "Category"} · ${expiring.owner_profile_name ?? "Me"}`
        }
      : {
          icon: "↗",
          title: "Protected documents ready",
          meta: "Use scan, upload, or signed downloads when needed"
        }
  ];
}

function categoryIcon(slug: string) {
  switch (slug) {
    case "personal-family":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="1.6" />
          <path d="M3.5 20a4.5 4.5 0 0 1 9 0M11.5 20a4.5 4.5 0 0 1 9 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "health":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 21s7-3.2 7-9V5l-7-3-7 3v7c0 5.8 7 9 7 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M12 8v7M8.5 11.5h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "home-car":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 12 12 5l8 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6.5 11.5V20h11v-8.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M8 18h8M6 15h2l1.2-3h5.6L16 15h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="9" cy="18" r="1" fill="currentColor" />
          <circle cx="15" cy="18" r="1" fill="currentColor" />
        </svg>
      );
    case "money-legal":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 4v16M5 8h14M7 8l-3 6h6L7 8ZM17 8l-3 6h6l-3-6Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "work-business":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" stroke="currentColor" strokeWidth="1.6" />
          <path d="M4 7h16v13H4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M4 12h16" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case "travel-emergency":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
          <path d="M4 11h14M11 4c2 2.2 3 4.5 3 7s-1 4.8-3 7M11 4c-2 2.2-3 4.5-3 7s1 4.8 3 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M17 14.5 20 16v2.7c0 1.8-1.1 3.4-3 4.3-1.9-.9-3-2.5-3-4.3V16l3-1.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 5.5h14v13H5z" stroke="currentColor" strokeWidth="1.6" />
          <path d="M8 9h8M8 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
  }
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

function sortProfiles(profiles: DashboardProfileRecord[]) {
  return [...profiles].sort((a, b) => {
    const aScore = preferredProfileOrder.indexOf(a.display_name);
    const bScore = preferredProfileOrder.indexOf(b.display_name);

    if (aScore === -1 && bScore === -1) {
      return a.sort_order - b.sort_order || a.display_name.localeCompare(b.display_name);
    }

    if (aScore === -1) {
      return 1;
    }

    if (bScore === -1) {
      return -1;
    }

    return aScore - bScore;
  });
}

function formatStorageSummary(documents: DashboardDocumentRecord[]) {
  const total = documents.length;
  const active = documents.filter((document) => statusTone(document.status) === "active").length;
  return `${active} active of ${total} total`;
}

export function DashboardShell({ initialData, initialDocumentMessage }: DashboardShellProps) {
  const { client, configured } = createBrowserSupabaseClient();
  const { session } = useAuth();
  const [data, setData] = useState(initialData);
  const [documentMessage, setDocumentMessage] = useState<string | null>(initialDocumentMessage);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(initialData.profiles.find((profile) => profile.display_name === "Me")?.id ?? initialData.profiles[0]?.id ?? null);
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

  const orderedProfiles = useMemo(() => sortProfiles(data.profiles), [data.profiles]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const document of data.documents) {
      if (!document.category_id) continue;
      counts.set(document.category_id, (counts.get(document.category_id) ?? 0) + 1);
    }
    return counts;
  }, [data.documents]);

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

  const activeCount = data.documents.filter((document) => statusTone(document.status) === "active").length;
  const needsReviewCount = data.documents.filter((document) => statusTone(document.status) === "review").length;
  const archivedCount = data.documents.filter((document) => statusTone(document.status) === "archived").length;
  const expiringCount = data.documents.filter((document) => statusTone(document.status) === "warning").length;
  const overview = [
    { label: "Documents", value: String(data.documents.length) },
    { label: "Categories", value: String(data.categories.length) },
    { label: "Profiles", value: String(data.profiles.length) },
    { label: "Expiring", value: String(expiringCount) }
  ];
  const activityItems = buildActivityItems(data.documents);
  const selectedTemplate = selectedDocument ? toTemplate(selectedDocument) : null;

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

  return (
    <section className="page-section dashboard-page" id="top">
      <div className="dashboard-shell">
        <aside className="dashboard-sidebar" aria-label="Main navigation">
          <div className="dashboard-brand">
            <span className="dashboard-brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M7 10V8a5 5 0 0 1 10 0v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M6 10h12v9H6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M12 14v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <span>NoLostDocs</span>
          </div>

          <Link className="dashboard-scan-button" href="/scan">
            <span className="dashboard-scan-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            Scan Document
          </Link>

          <nav className="dashboard-nav-section">
            <div className="dashboard-nav-label">App</div>
            <a className="dashboard-nav-item active" href="#top">
              <span className="dashboard-nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M4 11 12 4l8 7v9h-5v-6H9v6H4v-9Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                </svg>
              </span>
              Dashboard
            </a>
            <a className="dashboard-nav-item" href="#documents">
              <span className="dashboard-nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M7 3h7l4 4v14H7V3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                  <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                </svg>
              </span>
              All Documents
            </a>
            <a className="dashboard-nav-item" href="#search">
              <span className="dashboard-nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="m21 21-4.3-4.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  <circle cx="10.7" cy="10.7" r="6.7" stroke="currentColor" strokeWidth="1.7" />
                </svg>
              </span>
              Search
            </a>
            <a className="dashboard-nav-item" href="#profiles">
              <span className="dashboard-nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M5 20a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </span>
              Profile
            </a>
          </nav>

          <nav className="dashboard-nav-section">
            <div className="dashboard-nav-label">Manage</div>
            <a className="dashboard-nav-item" href="#profiles">
              <span className="dashboard-nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M5 20a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </span>
              Profiles
            </a>
            <a className="dashboard-nav-item" href="#document-types">
              <span className="dashboard-nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M4 7h16v13H4z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                </svg>
              </span>
              Types
            </a>
          </nav>

          <div className="dashboard-sidebar-card">
            <div className="dashboard-sidebar-card-title">Private storage</div>
            <p className="dashboard-sidebar-card-text">Your files are stored privately and opened only through signed downloads.</p>
            <div className="dashboard-storage-bar">
              <span className="dashboard-storage-fill" />
            </div>
            <div className="dashboard-sidebar-card-meta">{formatStorageSummary(data.documents)}</div>
          </div>
        </aside>

        <main className="dashboard-main" id="search">
          <header className="dashboard-mobile-topbar">
            <div className="dashboard-mobile-brand">
              <span className="dashboard-brand-mark" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M7 10V8a5 5 0 0 1 10 0v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M6 10h12v9H6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M12 14v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              <span>NoLostDocs</span>
            </div>

            <div className="dashboard-top-actions">
              <button className="dashboard-icon-button" type="button" aria-label="Notifications">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                  <path d="M10 21h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
                <span className="dashboard-badge">2</span>
              </button>
              <button className="dashboard-avatar" type="button" aria-label="Account menu">
                RM
              </button>
            </div>
          </header>

          <div className="dashboard-desktop-topbar">
            <label className="dashboard-search">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m21 21-4.3-4.3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                <circle cx="10.7" cy="10.7" r="6.7" stroke="currentColor" strokeWidth="1.9" />
              </svg>
              <input
                aria-label="Search documents"
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search documents, categories, owners..."
                value={searchTerm}
              />
              <span className="dashboard-kbd">⌘ K</span>
            </label>

            <div className="dashboard-top-actions desktop">
              <button className="dashboard-icon-button" type="button" aria-label="Notifications">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                  <path d="M10 21h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
                <span className="dashboard-badge">2</span>
              </button>
              <button className="dashboard-avatar" type="button" aria-label="Account menu">
                RM
              </button>
            </div>
          </div>

          <section className="dashboard-page-header">
            <div>
              <div className="dashboard-eyebrow">Document Wallet</div>
              <h1 className="dashboard-title">Everything important, ready when you need it.</h1>
              <p className="dashboard-subtitle">
                Organize secure copies by owner, category, and document type so passports, insurance cards, licenses, records, and business docs are easy to find.
              </p>
            </div>

            <div className="dashboard-header-actions">
              <Link className="dashboard-secondary-button" href="/scan">
                Upload
              </Link>
              <Link className="dashboard-primary-button" href="/scan">
                <span className="dashboard-scan-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
                Scan Document
              </Link>
            </div>
          </section>

          <section className="dashboard-section dashboard-mobile-search">
            <label className="dashboard-search mobile">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m21 21-4.3-4.3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                <circle cx="10.7" cy="10.7" r="6.7" stroke="currentColor" strokeWidth="1.9" />
              </svg>
              <input
                aria-label="Search documents"
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search documents, categories, or owners..."
                value={searchTerm}
              />
              <span className="dashboard-kbd">⌘ K</span>
            </label>
          </section>

          <section className="dashboard-section" id="profiles">
            <div className="dashboard-section-header">
              <div>
                <div className="dashboard-section-kicker">Owner / profile</div>
                <h2 className="dashboard-section-title">Filter by owner or entity</h2>
              </div>
            </div>

            <div className="dashboard-chip-row">
              <button className={`dashboard-chip${selectedProfileId === null ? " active" : ""}`} type="button" onClick={() => setSelectedProfileId(null)}>
                All
              </button>
              {orderedProfiles.map((profile) => (
                <button
                  className={`dashboard-chip${selectedProfileId === profile.id ? " active" : ""}`}
                  key={profile.id}
                  type="button"
                  onClick={() => setSelectedProfileId(profile.id)}
                >
                  {profile.display_name}
                </button>
              ))}
            </div>
          </section>

          <section className="dashboard-section" id="categories">
            <div className="dashboard-section-header">
              <div>
                <div className="dashboard-section-kicker">Categories</div>
                <h2 className="dashboard-section-title">Six high-level categories</h2>
              </div>
              <span className="dashboard-section-link">Manage</span>
            </div>

            <div className="dashboard-category-grid">
              {data.categories.map((category) => (
                <button
                  className={`dashboard-category-card${selectedCategoryId === category.id ? " active" : ""}`}
                  key={category.id}
                  onClick={() => setSelectedCategoryId(selectedCategoryId === category.id ? null : category.id)}
                  type="button"
                >
                  <span className="dashboard-category-top">
                    <span className="dashboard-category-icon" aria-hidden="true">
                      {categoryIcon(category.slug)}
                    </span>
                    <span className="dashboard-category-count">{categoryCounts.get(category.id) ?? 0} docs</span>
                  </span>
                  <strong className="dashboard-category-title">{category.name}</strong>
                  <span className="dashboard-category-description">{category.description ?? "Category"}</span>
                  <span className="dashboard-category-footer" aria-hidden="true">
                    Open category
                    <span>›</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="dashboard-section" id="document-types">
            <div className="dashboard-section-header">
              <div>
                <div className="dashboard-section-kicker">Document types</div>
                <h2 className="dashboard-section-title">Filter by type</h2>
              </div>
            </div>

            <div className="dashboard-chip-row wrap">
              <button className={`dashboard-chip${selectedTypeId === null ? " active" : ""}`} type="button" onClick={() => setSelectedTypeId(null)}>
                All types
              </button>
              {data.documentTypes
                .filter((type) => !selectedCategoryId || type.category_id === selectedCategoryId)
                .slice(0, 16)
                .map((type) => (
                  <button
                    className={`dashboard-chip${selectedTypeId === type.id ? " active" : ""}`}
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedTypeId(type.id)}
                  >
                    {type.name}
                  </button>
                ))}
            </div>
          </section>

          <section className="dashboard-section" id="documents">
            <div className="dashboard-section-header">
              <div>
                <div className="dashboard-section-kicker">Recent documents</div>
                <h2 className="dashboard-section-title">{filteredDocuments.length ? `${filteredDocuments.length} matching records` : "No records match"}</h2>
              </div>
              <span className="dashboard-section-link">View all</span>
            </div>

            <div className="dashboard-doc-table-wrap">
              <table className="dashboard-doc-table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Owner</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Updated</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((document) => (
                    <tr className="dashboard-doc-table-row" key={document.id} onClick={() => setSelectedDocumentId(document.id)}>
                      <td>
                        <div className="dashboard-doc-cell">
                          <span className={`dashboard-doc-icon ${document.category_slug ?? "default"}`} aria-hidden="true">
                            {categoryIcon(document.category_slug ?? "default")}
                          </span>
                          <div>
                            <div className="dashboard-doc-title">{document.title}</div>
                            <div className="dashboard-doc-sub">{document.document_type_name ?? "Document type"} · PDF</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="dashboard-pill">{document.owner_profile_name ?? "Me"}</span>
                      </td>
                      <td>
                        <span className="dashboard-pill">{document.category_name ?? "Category"}</span>
                      </td>
                      <td>
                        <span className={`dashboard-pill ${statusTone(document.status)}`}>{statusLabel(document.status)}</span>
                      </td>
                      <td className="dashboard-muted">{relativeDate(document.updated_at)}</td>
                      <td className="dashboard-actions-cell">⋮</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="dashboard-doc-list-mobile">
              {filteredDocuments.map((document) => (
                <button className="dashboard-doc-card" key={document.id} onClick={() => setSelectedDocumentId(document.id)} type="button">
                  <span className={`dashboard-doc-icon ${document.category_slug ?? "default"}`} aria-hidden="true">
                    {categoryIcon(document.category_slug ?? "default")}
                  </span>
                  <span className="dashboard-doc-copy">
                    <strong>{document.title}</strong>
                    <span>{document.document_type_name ?? "Document type"} · {document.category_name ?? "Category"}</span>
                  </span>
                  <span className="dashboard-doc-side">
                    <span className={`dashboard-pill ${statusTone(document.status)}`}>{statusLabel(document.status)}</span>
                    <span className="dashboard-actions-cell">⋮</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        </main>

        <aside className="dashboard-right-stack">
          <section className="dashboard-panel">
            <div className="dashboard-panel-heading">
              <div>
                <div className="dashboard-section-kicker">Quick actions</div>
                <h2 className="dashboard-section-title">Add a document, create a type, or manage owners.</h2>
              </div>
            </div>

            <div className="dashboard-quick-actions">
              <Link className="dashboard-quick-action" href="/scan">
                Scan document <span>›</span>
              </Link>
              <Link className="dashboard-quick-action" href="/scan">
                Upload file <span>›</span>
              </Link>
              <a className="dashboard-quick-action" href="#document-types">
                Add custom type <span>›</span>
              </a>
              <a className="dashboard-quick-action" href="#profiles">
                Manage profiles <span>›</span>
              </a>
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="dashboard-section-header compact">
              <div>
                <div className="dashboard-section-kicker">Overview</div>
                <h2 className="dashboard-section-title">At a glance</h2>
              </div>
            </div>

            <div className="dashboard-stat-grid">
              <div className="dashboard-stat">
                <strong>{data.documents.length}</strong>
                <span>Documents</span>
              </div>
              <div className="dashboard-stat">
                <strong>{data.categories.length}</strong>
                <span>Categories</span>
              </div>
              <div className="dashboard-stat">
                <strong>{data.profiles.length}</strong>
                <span>Profiles</span>
              </div>
              <div className="dashboard-stat">
                <strong>{expiringCount || needsReviewCount || archivedCount}</strong>
                <span>Attention</span>
              </div>
            </div>

            <div className="dashboard-mini-summary">
              <span>{activeCount} active</span>
              <span>{needsReviewCount} needs review</span>
              <span>{archivedCount} archived</span>
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="dashboard-section-header compact">
              <div>
                <div className="dashboard-section-kicker">Recent activity</div>
                <h2 className="dashboard-section-title">Recent changes</h2>
              </div>
            </div>

            <div className="dashboard-activity-list">
              {activityItems.map((item) => (
                <div className="dashboard-activity-row" key={item.title}>
                  <span className="dashboard-activity-dot">{item.icon}</span>
                  <div>
                    <div className="dashboard-activity-title">{item.title}</div>
                    <div className="dashboard-activity-meta">{item.meta}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

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
            <section className="dashboard-panel dashboard-selected-card">
              <div className="dashboard-section-header compact">
                <div>
                  <div className="dashboard-section-kicker">Record preview</div>
                  <h2 className="dashboard-section-title">Select a document</h2>
                </div>
              </div>
              <p className="dashboard-section-support">Choose a record to inspect its status, file access, and protected download options.</p>
            </section>
          )}
        </aside>
      </div>

      <nav className="dashboard-bottom-nav" aria-label="Primary navigation">
        <a className="dashboard-bottom-nav-item active" href="#top">
          <span aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M4 11 12 4l8 7v9h-5v-6H9v6H4v-9Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
            </svg>
          </span>
          Home
        </a>

        <a className="dashboard-bottom-nav-item" href="#documents">
          <span aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M7 3h7l4 4v14H7V3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
            </svg>
          </span>
          Docs
        </a>

        <Link className="dashboard-bottom-nav-item dashboard-scan-nav" href="/scan">
          <span className="dashboard-scan-circle" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          Scan
        </Link>

        <a className="dashboard-bottom-nav-item" href="#search">
          <span aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="m21 21-4.3-4.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              <circle cx="10.7" cy="10.7" r="6.7" stroke="currentColor" strokeWidth="1.7" />
            </svg>
          </span>
          Search
        </a>

        <a className="dashboard-bottom-nav-item" href="#profiles">
          <span aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.7" />
              <path d="M5 20a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </span>
          Profile
        </a>
      </nav>

      <div className="dashboard-home-indicator" aria-hidden="true" />
    </section>
  );
}
