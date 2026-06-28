import type { VaultSnapshot } from "@nolostdocs/types";

export const DEFAULT_SUPABASE_URL = "https://your-project-ref.supabase.co";
export const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "your-supabase-publishable-key";

export function isPlaceholderValue(value: string | undefined) {
  if (!value) return true;

  // Keep legacy anon-key detection only as a compatibility guard while the repo
  // finishes converging on Supabase's publishable-key terminology.
  return (
    value.includes("your-project-ref") ||
    value.includes("your-supabase-publishable-key") ||
    value.includes("your-supabase-anon-key") ||
    value.includes("replace-me")
  );
}

export const FREE_PLAN_DOCUMENT_LIMIT = 3;
export const PREMIUM_PLAN_DOCUMENT_LIMIT = 50;
export const BASIC_GROUP_CATEGORIES = ["personal", "driving", "travel"] as const;

export const prototypeSnapshot: VaultSnapshot = {
  mode: "cloud",
  categories: [
    { id: "personal", title: "Personal", subtitle: "IDs and identity docs", accent: "#26547c" },
    { id: "driving", title: "Driving / Car", subtitle: "Insurance and registration", accent: "#ef476f" },
    { id: "medical", title: "Medical", subtitle: "Cards, forms, medications", accent: "#06a77d" },
    { id: "family", title: "Family", subtitle: "Children and emergency forms", accent: "#f4a261" },
    { id: "work", title: "Work / Pro", subtitle: "Licenses and certifications", accent: "#5c4d7d" },
    { id: "business", title: "Business", subtitle: "EIN, contracts, compliance", accent: "#1f7a8c" },
    { id: "travel", title: "Travel", subtitle: "Passport and itineraries", accent: "#bc6c25" },
    { id: "custom", title: "Custom", subtitle: "Your own categories", accent: "#6c757d" }
  ],
  documents: [
    { id: "doc-1", title: "Driver's License", category: "personal", status: "uploaded", note: "Front and back saved" },
    { id: "doc-2", title: "Auto Insurance Card", category: "driving", status: "expiring-soon", note: "Renews in 12 days" },
    { id: "doc-3", title: "Vaccination Record", category: "medical", status: "uploaded", note: "Cloud backup enabled" },
    { id: "doc-4", title: "RN License", category: "work", status: "missing", note: "Add renewal copy" }
  ],
  templates: [
    { id: "tmpl-1", category: "personal", title: "Driver's License", helper: "Front and back for forms and quick reference", status: "uploaded", note: "Verified and backed up", expiresAt: "2029-02-10" },
    { id: "tmpl-2", category: "personal", title: "Social Security Card", helper: "Use only when necessary", status: "missing", note: "Not scanned yet" },
    { id: "tmpl-3", category: "personal", title: "Passport", helper: "Travel identity and renewal reminders", status: "missing", note: "Keep original in safe place" },
    { id: "tmpl-4", category: "driving", title: "Auto Insurance Card", helper: "Doctor, accident, and roadside reference", status: "expiring-soon", note: "Renews in 12 days", expiresAt: "2026-06-30" },
    { id: "tmpl-5", category: "driving", title: "Registration", helper: "Current registration copy", status: "uploaded", note: "Vehicle updated this spring", expiresAt: "2027-03-15" },
    { id: "tmpl-6", category: "driving", title: "Vehicle Title", helper: "Proof of ownership", status: "missing", note: "Store when refinanced docs arrive" },
    { id: "tmpl-7", category: "medical", title: "Insurance Card", helper: "Primary medical coverage", status: "uploaded", note: "Family plan card saved" },
    { id: "tmpl-8", category: "medical", title: "Medication List", helper: "Keep updated for appointments and emergencies", status: "uploaded", note: "Updated after annual physical" },
    { id: "tmpl-9", category: "medical", title: "Immunization Record", helper: "School, camp, and work compliance", status: "uploaded", note: "Synced from patient portal" },
    { id: "tmpl-10", category: "family", title: "School Forms", helper: "Enrollment and emergency release papers", status: "missing", note: "Upload before August" },
    { id: "tmpl-11", category: "family", title: "Child Immunizations", helper: "Quick access for school and travel", status: "uploaded", note: "Newest PDF included" },
    { id: "tmpl-12", category: "work", title: "RN License", helper: "State license and renewal tracking", status: "missing", note: "Renewal packet not added yet", expiresAt: "2026-09-14" },
    { id: "tmpl-13", category: "work", title: "CPR Certification", helper: "Training and compliance", status: "uploaded", note: "Good through next year", expiresAt: "2027-01-20" },
    { id: "tmpl-14", category: "business", title: "EIN Letter", helper: "Business identity document", status: "missing", note: "Add IRS copy" },
    { id: "tmpl-15", category: "travel", title: "Travel Insurance", helper: "Policy details on the go", status: "missing", note: "Only created when booked" }
  ],
  devices: [
    { id: "dev-1", name: "iPhone 15", platform: "ios", trusted: true, locked: false, lastSeen: "2 min ago" },
    { id: "dev-2", name: "Pixel 9", platform: "android", trusted: true, locked: false, lastSeen: "12 min ago" },
    { id: "dev-3", name: "Chrome on MacBook", platform: "web", trusted: true, locked: false, lastSeen: "now" }
  ]
};
