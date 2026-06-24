import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export type AccountPlan = "free" | "premium";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);
export const FREE_PLAN_DOCUMENT_LIMIT = 3;
export const PREMIUM_PLAN_DOCUMENT_LIMIT = 50;

type ProfileRow = {
  plan: string | null;
  cloud_enabled: boolean | null;
};

type SubscriptionRow = {
  plan: string | null;
  status: string | null;
};

export function resolveAccountPlan(profile: ProfileRow | null, subscriptions: SubscriptionRow[] = []): AccountPlan {
  const hasActivePremiumSubscription = subscriptions.some(
    (subscription) =>
      subscription.plan === "premium" && subscription.status && ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)
  );

  if (hasActivePremiumSubscription) {
    return "premium";
  }

  if (profile?.plan === "premium" || profile?.cloud_enabled) {
    return "premium";
  }

  return "free";
}

export function documentLimitForPlan(plan: AccountPlan) {
  return plan === "premium" ? PREMIUM_PLAN_DOCUMENT_LIMIT : FREE_PLAN_DOCUMENT_LIMIT;
}

export async function fetchAccountPlan(admin: SupabaseClient, userId: string): Promise<AccountPlan> {
  const [{ data: profile }, { data: subscriptions }] = await Promise.all([
    admin.from("profiles").select("plan, cloud_enabled").eq("id", userId).maybeSingle(),
    admin.from("subscriptions").select("plan, status").eq("user_id", userId)
  ]);

  return resolveAccountPlan(profile, subscriptions ?? []);
}
