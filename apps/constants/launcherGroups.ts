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
    detail: "Identity records organized for applications, verifications, renewals, and the operational moments when timing matters."
  },
  {
    id: "driving",
    title: "Driving",
    summary: "Registration, insurance, inspection",
    detail: "Vehicle records kept current, visible, and easy to retrieve when roadside, compliance, or claims workflows move quickly."
  },
  {
    id: "medical",
    title: "Medical",
    summary: "Insurance cards, medications, records",
    detail: "Coverage details and care records prepared for front desks, caregivers, and follow-up conversations that cannot wait."
  },
  {
    id: "professional",
    title: "Professional",
    summary: "Licenses, certifications, compliance documents",
    detail: "Business-critical records tracked in one place so renewals, audits, and proof requests are handled with less friction."
  },
  {
    id: "family",
    title: "Family",
    summary: "School forms, child records, emergency docs",
    detail: "Household records arranged for enrollment, travel, and the recurring paperwork that rarely arrives on a convenient schedule."
  }
] as const;

export const securityPrinciples = [
  "Private storage boundaries",
  "Signed-in account access",
  "Protected downloads",
  "Device recovery controls",
  "Cloud backup clarity",
  "Reviewable access events"
] as const;

export const dashboardGroups: DashboardGroup[] = [
  {
    id: "basic",
    title: "Basic",
    description: "License, registration, insurance card, passport",
    helper: "The essential records most clients need available first.",
    categories: ["personal", "driving", "travel"]
  },
  {
    id: "medical",
    title: "Medical",
    description: "Insurance cards, medication lists, records",
    helper: "Fast access when a clinician, caregiver, or front desk is waiting.",
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
