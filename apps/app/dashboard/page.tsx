import { requireUser } from "@/lib/auth/requireUser";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { loadDashboardDocuments } from "@/lib/documents/dashboard";
import { prototypeSnapshot } from "@nolostdocs/config";
import { isLocalDashboardPreviewEnabled } from "@/lib/dev/localDashboardPreview";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  if (isLocalDashboardPreviewEnabled()) {
    return (
      <DashboardShell
        initialDocumentMessage="Local preview mode is on. Sign-in is bypassed on localhost."
        initialDocuments={prototypeSnapshot.templates}
      />
    );
  }

  const user = await requireUser("/dashboard");
  const { client, configured } = await createServerSupabaseClient();
  const initialDashboardData =
    configured && client ? await loadDashboardDocuments(client, user.id) : { documents: [], errorMessage: null };

  return (
    <DashboardShell
      initialDocumentMessage={initialDashboardData.errorMessage}
      initialDocuments={initialDashboardData.documents}
    />
  );
}
