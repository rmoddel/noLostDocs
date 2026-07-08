import { requireUser } from "@/lib/auth/requireUser";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ensureUserProfile } from "@/lib/auth/ensureUserProfile";
import { loadDashboardDocuments } from "@/lib/documents/dashboard";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resolveAccountPlan } from "@/lib/plans/resolvePlan";
import { getScanProviderStatus } from "@/lib/scan/providerStatus";

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const scanValue = resolvedSearchParams.scan;
  const categoryValue = resolvedSearchParams.category;
  const scanParam = Array.isArray(scanValue) ? scanValue[0] : scanValue;
  const categoryParam = Array.isArray(categoryValue) ? categoryValue[0] : categoryValue;
  const nextPath =
    scanParam === "open"
      ? `/dashboard?scan=open${categoryParam ? `&category=${encodeURIComponent(categoryParam)}` : ""}`
      : "/dashboard";
  const user = await requireUser(nextPath);
  const { client, configured } = await createServerSupabaseClient();

  if (configured && client) {
    try {
      await ensureUserProfile(client, user);
    } catch (profileError) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Failed to ensure user profile", profileError);
      }
    }
  }

  const [{ data: profileRow }, { data: subscriptionRows }] = configured && client
    ? await Promise.all([
        client.from("profiles").select("full_name, email, plan, cloud_enabled").eq("id", user.id).maybeSingle(),
        client
          .from("subscriptions")
          .select("plan, status, current_period_end")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
      ])
    : [{ data: null }, { data: [] }];
  const initialDashboardData =
    configured && client
      ? await loadDashboardDocuments(client, user.id)
      : { categories: [], documentTypes: [], documents: [], errorMessage: null, profiles: [] };
  const resolvedPlan = resolveAccountPlan(profileRow, subscriptionRows ?? []);
  const latestSubscription = (subscriptionRows ?? [])[0] ?? null;

  return (
    <DashboardShell
      initialData={{
        categories: initialDashboardData.categories,
        documentTypes: initialDashboardData.documentTypes,
        documents: initialDashboardData.documents,
        profiles: initialDashboardData.profiles
      }}
      initialAccount={{
        email: profileRow?.email ?? user.email ?? null,
        name: profileRow?.full_name ?? user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Signed-in account",
        plan: resolvedPlan,
        renewalDate: latestSubscription?.current_period_end ?? null,
        status: latestSubscription?.status ?? (resolvedPlan === "premium" ? "active" : "free"),
        workspaceName: profileRow?.full_name ? `${profileRow.full_name}'s workspace` : "NoLostDocs Workspace"
      }}
      initialDocumentMessage={initialDashboardData.errorMessage}
      scanProviderStatus={getScanProviderStatus()}
    />
  );
}
