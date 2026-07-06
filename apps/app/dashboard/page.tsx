import { requireUser } from "@/lib/auth/requireUser";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { loadDashboardDocuments } from "@/lib/documents/dashboard";
import { prototypeSnapshot } from "@nolostdocs/config";
import { isLocalDashboardPreviewEnabled } from "@/lib/dev/localDashboardPreview";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function buildPreviewData() {
  const categories = [
    { id: "personal-family", name: "Personal & Family", slug: "personal-family", description: "Identity and household records", sort_order: 1, is_system: true },
    { id: "health", name: "Health", slug: "health", description: "Medical and insurance records", sort_order: 2, is_system: true },
    { id: "home-car", name: "Home & Car", slug: "home-car", description: "Property, vehicle, and maintenance records", sort_order: 3, is_system: true },
    { id: "money-legal", name: "Money & Legal", slug: "money-legal", description: "Finance, tax, and legal documents", sort_order: 4, is_system: true },
    { id: "work-business", name: "Work & Business", slug: "work-business", description: "Employment and business records", sort_order: 5, is_system: true },
    { id: "travel-emergency", name: "Travel & Emergency", slug: "travel-emergency", description: "Travel and urgent backup records", sort_order: 6, is_system: true }
  ];

  const profiles = [
    { id: "me", display_name: "Me", profile_type: "person" as const, sort_order: 0 },
    { id: "spouse", display_name: "Spouse", profile_type: "person" as const, sort_order: 1 },
    { id: "child-1", display_name: "Child 1", profile_type: "person" as const, sort_order: 2 },
    { id: "family", display_name: "Family", profile_type: "family" as const, sort_order: 3 },
    { id: "business", display_name: "Business", profile_type: "business" as const, sort_order: 4 }
  ];

  const typeMap = new Map([
    ["Driver's License", "drivers-license-id"],
    ["Passport", "passport-personal"],
    ["Birth Certificate", "birth-certificate"],
    ["Social Security Card", "social-security-card"],
    ["Insurance card", "health-insurance-card"],
    ["Contract", "contract"],
    ["RN License", "professional-license"],
    ["Travel Insurance", "travel-insurance"]
  ]);

  const documentTypes = prototypeSnapshot.templates.map((template) => ({
    id: `${template.id}-type`,
    category_id:
      template.category === "medical"
        ? "health"
        : template.category === "driving"
          ? "home-car"
          : template.category === "work" || template.category === "business"
            ? "work-business"
            : template.category === "travel"
              ? "travel-emergency"
              : "personal-family",
    user_id: null,
    is_custom: false,
    is_system: true,
    name: template.title,
    slug: typeMap.get(template.title) ?? `${template.id}-type`
  }));

  const documents = prototypeSnapshot.templates.map((template, index) => ({
    category_id:
      template.category === "medical"
        ? "health"
        : template.category === "driving"
          ? "home-car"
          : template.category === "work" || template.category === "business"
            ? "work-business"
            : template.category === "travel"
              ? "travel-emergency"
              : "personal-family",
    category_name:
      template.category === "medical"
        ? "Health"
        : template.category === "driving"
          ? "Home & Car"
          : template.category === "work" || template.category === "business"
            ? "Work & Business"
            : template.category === "travel"
              ? "Travel & Emergency"
              : "Personal & Family",
    content_type: "application/pdf",
    created_at: new Date(Date.now() - index * 60000).toISOString(),
    category_slug:
      template.category === "medical"
        ? "health"
        : template.category === "driving"
          ? "home-car"
          : template.category === "work" || template.category === "business"
            ? "work-business"
            : template.category === "travel"
              ? "travel-emergency"
              : "personal-family",
    document_date: null,
    document_file_id: null,
    document_type_id: documentTypes[index]?.id ?? null,
    document_type_name: template.title,
    expiration_date: template.expiresAt ?? null,
    file_role: null,
    id: template.id,
    issue_date: null,
    notes: template.note ?? null,
    original_filename: null,
    owner_profile_id: "me",
    owner_profile_name: "Me",
    owner_profile_type: "person" as const,
    page_count: null,
    size_bytes: null,
    status: template.status === "missing" ? "needs_review" : template.status === "expiring-soon" ? "needs_review" : "active",
    storage_bucket: null,
    storage_path: null,
    tags: template.note ? [template.note] : [],
    title: template.title,
    updated_at: new Date(Date.now() - index * 60000).toISOString()
  }));

  return {
    categories,
    documentTypes,
    documents,
    profiles
  };
}

export default async function DashboardPage() {
  if (isLocalDashboardPreviewEnabled()) {
    return (
      <DashboardShell
        initialDocumentMessage="Local preview is enabled. Sign-in is bypassed on localhost."
        initialData={buildPreviewData()}
      />
    );
  }

  const user = await requireUser("/dashboard");
  const { client, configured } = await createServerSupabaseClient();
  const initialDashboardData =
    configured && client
      ? await loadDashboardDocuments(client, user.id)
      : { categories: [], documentTypes: [], documents: [], errorMessage: null, profiles: [] };

  return (
    <DashboardShell
      initialData={{
        categories: initialDashboardData.categories,
        documentTypes: initialDashboardData.documentTypes,
        documents: initialDashboardData.documents,
        profiles: initialDashboardData.profiles
      }}
      initialDocumentMessage={initialDashboardData.errorMessage}
    />
  );
}
