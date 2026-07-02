import type { CategoryId } from "@nolostdocs/types";

export type LauncherGroup = {
  id: "personal" | "driving" | "medical" | "professional" | "family";
  title: string;
  summary: string;
  detail: string;
};

export type DashboardGroupId = "basic" | "medical" | "professional" | "family";

export type DashboardGroup = {
  id: DashboardGroupId;
  title: string;
  description: string;
  helper: string;
  categories: CategoryId[];
};

export const launcherGroups: LauncherGroup[] = [
  {
    id: "personal",
    title: "Personal",
    summary: "License, passport, Social Security card",
    detail: "Identity records organized for applications, verifications, renewals, and the moments when timing matters."
  },
  {
    id: "driving",
    title: "Driving",
    summary: "Registration, insurance, inspection",
    detail: "Vehicle records kept current and easy to retrieve when roadside stops, compliance checks, or claims requests arrive."
  },
  {
    id: "medical",
    title: "Medical",
    summary: "Insurance cards, medications, records",
    detail: "Coverage details and care records ready for front desks, caregivers, and follow-up care."
  },
  {
    id: "professional",
    title: "Professional",
    summary: "Licenses, certifications, compliance documents",
    detail: "Business-critical records tracked in one place so renewals, audits, and proof requests are easier to handle."
  },
  {
    id: "family",
    title: "Family",
    summary: "School forms, child records, emergency docs",
    detail: "Household records arranged for enrollment, travel, and the recurring paperwork that rarely arrives on schedule."
  }
] as const;

export const securityPrinciples = [
  {
    title: "Private storage boundaries",
    detail: "Records stay partitioned by account and category so sensitive files do not blur together."
  },
  {
    title: "Signed-in account access",
    detail: "Browsing, uploads, and protected actions stay behind authenticated web sessions."
  },
  {
    title: "Protected downloads",
    detail: "Downloads remain deliberate, visible events instead of an invisible file dump."
  },
  {
    title: "Device recovery controls",
    detail: "Lost devices can be suspended quickly, then re-authorized only when you decide."
  },
  {
    title: "Cloud backup clarity",
    detail: "The web experience stays explicit about cloud-backed records and what lives where."
  },
  {
    title: "Reviewable access events",
    detail: "Users can inspect meaningful actions so access history is understandable, not hidden."
  }
] as const;

export const dashboardGroups: DashboardGroup[] = [
  {
    id: "basic",
    title: "Basic",
    description: "License, registration, insurance card, passport",
    helper: "The records most people need available first.",
    categories: ["personal", "driving", "travel"]
  },
  {
    id: "medical",
    title: "Medical",
    description: "Insurance cards, medication lists, records",
    helper: "Fast access when a clinician, caregiver, or front desk needs it.",
    categories: ["medical"]
  },
  {
    id: "professional",
    title: "Professional",
    description: "ABA, DR, PT, RN, certifications, business docs",
    helper: "Licenses, compliance materials, and work-critical records.",
    categories: ["work", "business"]
  },
  {
    id: "family",
    title: "Family",
    description: "School forms, child records, emergency documents",
    helper: "Shared household records without the last-minute search.",
    categories: ["family"]
  }
] as const;
