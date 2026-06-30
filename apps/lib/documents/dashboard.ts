import type { CategoryId, DocumentStatus, DocumentTemplate } from "@nolostdocs/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type DocumentRow = {
  description: string | null;
  expiration_date: string | null;
  id: string;
  metadata: Record<string, unknown> | null;
  status: string | null;
  title: string;
  updated_at: string;
};

type DocumentFileRow = {
  created_at: string;
  document_id: string;
  id: string;
  mime_type: string | null;
  storage_bucket: string | null;
  storage_path: string | null;
};

type DashboardDocumentsResult = {
  documents: DocumentTemplate[];
  errorMessage: string | null;
};

const dashboardGroupCategoryMap: Record<string, CategoryId> = {
  basic: "personal",
  family: "family",
  medical: "medical",
  professional: "work"
};

const knownCategories = new Set<CategoryId>([
  "personal",
  "driving",
  "medical",
  "family",
  "work",
  "business",
  "travel",
  "custom"
]);

function inferCategory(metadata: Record<string, unknown> | null): CategoryId {
  const rawCategory = typeof metadata?.category === "string" ? metadata.category : null;

  if (rawCategory && rawCategory in dashboardGroupCategoryMap) {
    return dashboardGroupCategoryMap[rawCategory];
  }

  if (rawCategory && knownCategories.has(rawCategory as CategoryId)) {
    return rawCategory as CategoryId;
  }

  return "custom";
}

function inferStatus(row: DocumentRow, latestFile: DocumentFileRow | null): DocumentStatus {
  const now = Date.now();
  const expiration = row.expiration_date ? new Date(`${row.expiration_date}T12:00:00Z`).getTime() : null;

  if (expiration && expiration < now) {
    return "expired";
  }

  if (expiration && expiration - now <= 1000 * 60 * 60 * 24 * 30) {
    return "expiring-soon";
  }

  if (row.status === "missing" || !latestFile?.storage_path) {
    return "missing";
  }

  return "uploaded";
}

function buildHelper(row: DocumentRow, latestFile: DocumentFileRow | null) {
  if (row.description?.trim()) {
    return row.description.trim();
  }

  return latestFile?.storage_path ? "Protected file is available in your account." : "This record exists, but no file is attached yet.";
}

function buildNote(row: DocumentRow, latestFile: DocumentFileRow | null) {
  const metadataNote = typeof row.metadata?.note === "string" ? row.metadata.note : null;

  if (metadataNote?.trim()) {
    return metadataNote.trim();
  }

  if (typeof row.metadata?.source === "string" && row.metadata.source === "web-scan") {
    return "Captured from the protected web scan flow.";
  }

  if (!latestFile?.storage_path) {
    return "Add a protected file to complete this record.";
  }

  return undefined;
}

function mapDocumentTemplate(row: DocumentRow, latestFile: DocumentFileRow | null): DocumentTemplate {
  return {
    category: inferCategory(row.metadata),
    documentFileId: latestFile?.id,
    documentId: row.id,
    expiresAt: row.expiration_date ?? undefined,
    hasFile: Boolean(latestFile?.storage_path),
    helper: buildHelper(row, latestFile),
    id: row.id,
    mimeType: latestFile?.mime_type ?? undefined,
    note: buildNote(row, latestFile),
    status: inferStatus(row, latestFile),
    storageBucket: latestFile?.storage_bucket ?? undefined,
    storagePath: latestFile?.storage_path ?? undefined,
    title: row.title
  };
}

export async function loadDashboardDocuments(client: SupabaseClient, userId: string): Promise<DashboardDocumentsResult> {
  const [{ data: documents, error: documentsError }, { data: files, error: filesError }] = await Promise.all([
    client
      .from("documents")
      .select("id, title, description, status, expiration_date, metadata, updated_at")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false }),
    client
      .from("document_files")
      .select("id, document_id, storage_bucket, storage_path, mime_type, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
  ]);

  if (documentsError || filesError) {
    return {
      documents: [],
      errorMessage: documentsError?.message ?? filesError?.message ?? "Unable to load dashboard documents."
    };
  }

  const latestFiles = new Map<string, DocumentFileRow>();

  for (const row of (files ?? []) as DocumentFileRow[]) {
    if (!latestFiles.has(row.document_id)) {
      latestFiles.set(row.document_id, row);
    }
  }

  return {
    documents: ((documents ?? []) as DocumentRow[]).map((row) => mapDocumentTemplate(row, latestFiles.get(row.id) ?? null)),
    errorMessage: null
  };
}
