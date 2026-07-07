import { prototypeSnapshot } from "@nolostdocs/config";

export function buildPreviewDashboardData() {
  const categories = [
    { id: "personal-family", name: "Personal & Family", slug: "personal-family", description: "ID docs, records, certificates, and family documents", sort_order: 1, is_system: true },
    { id: "health", name: "Health", slug: "health", description: "Medical records, insurance, prescriptions, and more", sort_order: 2, is_system: true },
    { id: "home-car", name: "Home & Car", slug: "home-car", description: "Property docs, insurance, leases, and vehicle records", sort_order: 3, is_system: true },
    { id: "money-legal", name: "Money & Legal", slug: "money-legal", description: "Banking, investments, taxes, wills, and legal docs", sort_order: 4, is_system: true },
    { id: "work-business", name: "Work & Business", slug: "work-business", description: "Employment docs, contracts, licenses, and payroll", sort_order: 5, is_system: true },
    { id: "travel-emergency", name: "Travel & Emergency", slug: "travel-emergency", description: "Passports, visas, travel docs, emergency contacts", sort_order: 6, is_system: true }
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

  const documents = prototypeSnapshot.templates.map((template, index) => {
    const category_id =
      template.category === "medical"
        ? "health"
        : template.category === "driving"
          ? "home-car"
          : template.category === "work" || template.category === "business"
            ? "work-business"
            : template.category === "travel"
              ? "travel-emergency"
              : "personal-family";
    const category = categories.find((item) => item.id === category_id) ?? categories[0];

    return {
      category_id,
      category_name: category.name,
      category_slug: category.slug,
      content_type: "application/pdf",
      created_at: new Date(Date.now() - index * 60000).toISOString(),
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
      owner_profile_id: index === 2 ? "child-1" : index === 3 ? "business" : "me",
      owner_profile_name: index === 2 ? "Child 1" : index === 3 ? "Business" : "Me",
      owner_profile_type: index === 2 ? "person" as const : index === 3 ? "business" as const : "person" as const,
      page_count: null,
      size_bytes: null,
      status: template.status === "missing" ? "needs_review" : template.status === "expiring-soon" ? "needs_review" : "active",
      storage_bucket: null,
      storage_path: null,
      tags: template.note ? [template.note] : [],
      title: template.title,
      updated_at: new Date(Date.now() - index * 60000).toISOString()
    };
  });

  return {
    categories,
    documentTypes,
    documents,
    profiles,
    account: {
      email: "reuben@example.com",
      name: "Reuben Modell",
      plan: "premium" as const,
      renewalDate: "2026-08-01",
      status: "active",
      workspaceName: "NoLostDocs Workspace"
    }
  };
}
