import { requireUser } from "@/lib/auth/requireUser";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { loadDashboardDocuments } from "@/lib/documents/dashboard";
import { getScanProviderStatus } from "@/lib/scan/providerStatus";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const { client, configured } = await createServerSupabaseClient();
  const initialDashboardData =
    configured && client ? await loadDashboardDocuments(client, user.id) : { documents: [], errorMessage: null };

  return (
    <DashboardShell
      initialDocumentMessage={initialDashboardData.errorMessage}
      initialDocuments={initialDashboardData.documents}
      scanProviderStatus={getScanProviderStatus()}
    />
  );
}
