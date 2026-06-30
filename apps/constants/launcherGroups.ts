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
    detail: "Identity documents organized for the moments when agencies, forms, or appointments move faster than your filing cabinet."
  },
  {
    id: "driving",
    title: "Driving",
    summary: "Registration, insurance, inspection",
    detail: "Vehicle paperwork kept visible, current, and easy to recover when the glove box is not enough."
  },
  {
    id: "medical",
    title: "Medical",
    summary: "Insurance cards, medications, records",
    detail: "Coverage details and care records lined up for front desks, caregivers, and urgent follow-up."
  },
  {
    id: "professional",
    title: "Professional",
    summary: "Licenses, certifications, compliance documents",
    detail: "Work-critical records tracked in one place so renewals and proof requests do not become a scramble."
  },
  {
    id: "family",
    title: "Family",
    summary: "School forms, child records, emergency docs",
    detail: "Household records arranged for travel, enrollment, and the paperwork that always seems to arrive at the worst time."
  }
] as const;

export const securityPrinciples = [
  "Private storage",
  "Signed-in access",
  "Protected downloads",
  "Device lock",
  "Cloud backup controls",
  "Audit trail where applicable"
] as const;

export const dashboardGroups: DashboardGroup[] = [
  {
    id: "basic",
    title: "Basic",
    description: "License, registration, insurance card, passport",
    helper: "The universal essentials most people reach for first.",
    categories: ["personal", "driving", "travel"]
  },
  {
    id: "medical",
    title: "Medical",
    description: "Insurance cards, medication lists, records",
    helper: "Fast access when the front desk or caregiver is waiting.",
    categories: ["medical"]
  },
  {
    id: "professional",
    title: "Professional",
    description: "ABA, DR, PT, RN, certifications, business docs",
    helper: "Licenses, compliance papers, and work-critical records.",
    categories: ["work", "business"]
  },
  {
    id: "family",
    title: "Family",
    description: "School forms, child records, emergency documents",
    helper: "Shared household paperwork without the scavenger hunt.",
    categories: ["family"]
  }
] as const;
