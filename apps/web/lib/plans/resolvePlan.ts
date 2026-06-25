import { dashboardGroups, type DashboardGroupId } from "@/constants/launcherGroups";

export type AccountPlan = "free" | "premium";

type ProfileRow = {
  plan: string | null;
  cloud_enabled: boolean | null;
};

type SubscriptionRow = {
  plan: string | null;
  status: string | null;
};

export function resolveAccountPlan(profile: ProfileRow | null, subscriptions: SubscriptionRow[] = []): AccountPlan {
  const activePremium = subscriptions.some(
    (subscription) => subscription.plan === "premium" && ["active", "trialing"].includes(subscription.status ?? "")
  );

  if (activePremium || profile?.plan === "premium" || profile?.cloud_enabled) {
    return "premium";
  }

  return "free";
}

export function allowedGroupIdsForPlan(plan: AccountPlan): DashboardGroupId[] {
  return plan === "premium" ? dashboardGroups.map((group) => group.id) : ["basic"];
}
