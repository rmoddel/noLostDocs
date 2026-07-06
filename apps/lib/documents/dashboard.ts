import type { SupabaseClient } from "@supabase/supabase-js";

export type DashboardProfileRecord = {
  id: string;
  display_name: string;
  profile_type: "person" | "family" | "business" | "other";
  sort_order: number;
};

export type DashboardCategoryRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_system: boolean;
};

export type DashboardDocumentTypeRecord = {
  id: string;
  category_id: string | null;
  user_id: string | null;
  name: string;
  slug: string | null;
  is_system: boolean;
  is_custom: boolean;
};

export type DashboardDocumentRecord = {
  category_id: string | null;
  category_name: string | null;
  content_type: string | null;
  created_at: string;
  document_date: string | null;
  document_file_id: string | null;
  document_type_id: string | null;
  document_type_name: string | null;
  expiration_date: string | null;
  file_role: "original" | "preview" | "processed" | null;
  id: string;
  issue_date: string | null;
  notes: string | null;
  original_filename: string | null;
  owner_profile_id: string | null;
  owner_profile_name: string | null;
  owner_profile_type: "person" | "family" | "business" | "other" | null;
  page_count: number | null;
  size_bytes: number | null;
  status: string;
  storage_bucket: string | null;
  storage_path: string | null;
  tags: string[] | null;
  title: string;
  updated_at: string;
};

type DashboardDocumentsResult = {
  categories: DashboardCategoryRecord[];
  documentTypes: DashboardDocumentTypeRecord[];
  documents: DashboardDocumentRecord[];
  errorMessage: string | null;
  profiles: DashboardProfileRecord[];
};

type DocumentRow = {
  category_id: string | null;
  created_at: string;
  document_date: string | null;
  document_type_id: string | null;
  expiration_date: string | null;
  id: string;
  issue_date: string | null;
  notes: string | null;
  owner_profile_id: string | null;
  status: string | null;
  tags: string[] | null;
  title: string;
  updated_at: string;
};

type FileRow = {
  content_type: string | null;
  created_at: string;
  document_id: string;
  file_role: "original" | "preview" | "processed" | null;
  id: string;
  mime_type: string | null;
  original_filename: string | null;
  page_count: number | null;
  size_bytes: number | null;
  storage_bucket: string | null;
  storage_path: string | null;
};

function buildFileRole(row: FileRow | null) {
  return row?.file_role ?? "original";
}

function normalizeStatus(status: string | null, expirationDate: string | null) {
  if (status === "archived" || status === "expired" || status === "needs_review" || status === "active") {
    return status;
  }

  if (status === "expiring-soon") {
    return "needs_review";
  }

  if (status === "missing") {
    return "needs_review";
  }

  if (status === "uploaded") {
    if (expirationDate) {
      const expiration = new Date(`${expirationDate}T12:00:00Z`).getTime();
      if (Number.isFinite(expiration) && expiration < Date.now()) {
        return "expired";
      }
      if (Number.isFinite(expiration) && expiration - Date.now() <= 1000 * 60 * 60 * 24 * 30) {
        return "needs_review";
      }
    }

    return "active";
  }

  return "needs_review";
}

function mapDocument(row: DocumentRow, file: FileRow | null, profiles: Map<string, DashboardProfileRecord>, categories: Map<string, DashboardCategoryRecord>, types: Map<string, DashboardDocumentTypeRecord>): DashboardDocumentRecord {
  const profile = row.owner_profile_id ? profiles.get(row.owner_profile_id) ?? null : null;
  const category = row.category_id ? categories.get(row.category_id) ?? null : null;
  const type = row.document_type_id ? types.get(row.document_type_id) ?? null : null;

  return {
    category_id: row.category_id,
    category_name: category?.name ?? null,
    content_type: file?.content_type ?? file?.mime_type ?? null,
    created_at: row.created_at,
    document_date: row.document_date,
    document_file_id: file?.id ?? null,
    document_type_id: row.document_type_id,
    document_type_name: type?.name ?? null,
    expiration_date: row.expiration_date,
    file_role: buildFileRole(file),
    id: row.id,
    issue_date: row.issue_date,
    notes: row.notes,
    original_filename: file?.original_filename ?? null,
    owner_profile_id: row.owner_profile_id,
    owner_profile_name: profile?.display_name ?? null,
    owner_profile_type: profile?.profile_type ?? null,
    page_count: file?.page_count ?? null,
    size_bytes: file?.size_bytes ?? null,
    status: normalizeStatus(row.status, row.expiration_date),
    storage_bucket: file?.storage_bucket ?? null,
    storage_path: file?.storage_path ?? null,
    tags: row.tags,
    title: row.title,
    updated_at: row.updated_at
  };
}

export async function loadDashboardDocuments(client: SupabaseClient, userId: string): Promise<DashboardDocumentsResult> {
  const [
    { data: documents, error: documentsError },
    { data: files, error: filesError },
    { data: profiles, error: profilesError },
    { data: categories, error: categoriesError },
    { data: documentTypes, error: typesError }
  ] = await Promise.all([
    client
      .from("documents")
      .select("id, owner_profile_id, category_id, document_type_id, title, status, issue_date, expiration_date, document_date, notes, tags, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    client
      .from("document_files")
      .select("id, document_id, storage_bucket, storage_path, original_filename, content_type, mime_type, file_role, page_count, size_bytes, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    client
      .from("document_profiles")
      .select("id, display_name, profile_type, sort_order")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true }),
    client
      .from("document_categories")
      .select("id, name, slug, description, sort_order, is_system")
      .order("sort_order", { ascending: true }),
    client
      .from("document_types")
      .select("id, category_id, user_id, name, slug, is_system, is_custom")
      .order("name", { ascending: true })
  ]);

  if (documentsError || filesError || profilesError || categoriesError || typesError) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to load dashboard documents", documentsError ?? filesError ?? profilesError ?? categoriesError ?? typesError);
    }

    return {
      categories: [],
      documentTypes: [],
      documents: [],
      errorMessage: "Document records are not connected yet.",
      profiles: []
    };
  }

  const latestFiles = new Map<string, FileRow>();
  for (const row of (files ?? []) as FileRow[]) {
    if (!latestFiles.has(row.document_id)) {
      latestFiles.set(row.document_id, row);
    }
  }

  const profileMap = new Map<string, DashboardProfileRecord>();
  for (const row of (profiles ?? []) as DashboardProfileRecord[]) {
    profileMap.set(row.id, row);
  }

  const categoryMap = new Map<string, DashboardCategoryRecord>();
  for (const row of (categories ?? []) as DashboardCategoryRecord[]) {
    categoryMap.set(row.id, row);
  }

  const typeMap = new Map<string, DashboardDocumentTypeRecord>();
  for (const row of (documentTypes ?? []) as DashboardDocumentTypeRecord[]) {
    typeMap.set(row.id, row);
  }

  return {
    categories: (categories ?? []) as DashboardCategoryRecord[],
    documentTypes: (documentTypes ?? []) as DashboardDocumentTypeRecord[],
    documents: ((documents ?? []) as DocumentRow[]).map((row) => mapDocument(row, latestFiles.get(row.id) ?? null, profileMap, categoryMap, typeMap)),
    errorMessage: null,
    profiles: (profiles ?? []) as DashboardProfileRecord[]
  };
}
