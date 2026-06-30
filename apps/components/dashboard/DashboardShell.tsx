"use client";

import type { DocumentTemplate } from "@nolostdocs/types";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { dashboardGroups, type DashboardGroupId } from "@/constants/launcherGroups";
import { runProtectedDocumentAction } from "@/lib/documents/download";
import { allowedGroupIdsForPlan, resolveAccountPlan, type AccountPlan } from "@/lib/plans/resolvePlan";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { EmptyState } from "../ui/EmptyState";
import { CategoryGrid } from "./CategoryGrid";
import { DashboardHero } from "./DashboardHero";
import { DocumentDetail } from "./DocumentDetail";
import { DocumentList } from "./DocumentList";
import { NextActionsPanel } from "./NextActionsPanel";
import { PlanStatusCard } from "./PlanStatusCard";
import type { ScanProviderStatus } from "@/lib/scan/providerStatus";
import { ScanWorkspace } from "../scan/ScanWorkspace";

type ProtectedActionState = {
  loading: boolean;
  message: string | null;
};

type DashboardShellProps = {
  initialDocumentMessage: string | null;
  initialDocuments: DocumentTemplate[];
  scanProviderStatus: ScanProviderStatus;
};

export function DashboardShell({ initialDocumentMessage, initialDocuments, scanProviderStatus }: DashboardShellProps) {
  const { session } = useAuth();
  const { client, configured } = createBrowserSupabaseClient();
  const [selectedGroupId, setSelectedGroupId] = useState<DashboardGroupId>("basic");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [accountPlan, setAccountPlan] = useState<AccountPlan>("free");
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [documentMessage, setDocumentMessage] = useState<string | null>(initialDocumentMessage);
  const [documents] = useState<DocumentTemplate[]>(initialDocuments);
  const [protectedAction, setProtectedAction] = useState<ProtectedActionState>({ loading: false, message: null });

  useEffect(() => {
    if (!configured || !session) {
      setAccountPlan("free");
      return;
    }

    void loadAccountPlan();
  }, [configured, session]);

  async function loadAccountPlan() {
    if (!session) {
      return;
    }

    setAccountLoading(true);
    setAccountMessage(null);

    const { error: upsertError } = await client.from("profiles").upsert(
      {
        id: session.user.id,
        email: session.user.email ?? null,
        plan: "free",
        cloud_enabled: false
      },
      { onConflict: "id" }
    );

    if (upsertError) {
      setAccountPlan("free");
      setAccountLoading(false);
      setAccountMessage("Using Free Basic until profile synchronization is available.");
      return;
    }

    const [{ data: profile, error: profileError }, { data: subscriptions, error: subscriptionError }] = await Promise.all([
      client.from("profiles").select("plan, cloud_enabled").eq("id", session.user.id).maybeSingle(),
      client.from("subscriptions").select("plan, status").eq("user_id", session.user.id)
    ]);

    setAccountLoading(false);

    if (profileError || subscriptionError) {
      setAccountPlan("free");
      setAccountMessage("Using Free Basic until subscription state is available.");
      return;
    }

    setAccountPlan(resolveAccountPlan(profile, subscriptions ?? []));
  }

  async function handleProtectedAction(action: "preview" | "download", template: DocumentTemplate) {
    setProtectedAction({ loading: true, message: null });

    const result = await runProtectedDocumentAction({
      action,
      client,
      configured,
      session,
      template
    });

    setProtectedAction({ loading: false, message: result.message });
  }

  const allowedGroupIds = useMemo(() => allowedGroupIdsForPlan(accountPlan), [accountPlan]);
  const visibleGroups = useMemo(
    () => dashboardGroups.filter((group) => allowedGroupIds.includes(group.id)),
    [allowedGroupIds]
  );
  const selectedGroup = useMemo(
    () => dashboardGroups.find((group) => group.id === selectedGroupId) ?? dashboardGroups[0],
    [selectedGroupId]
  );
  const selectedGroupDocs = useMemo(
    () => documents.filter((template) => selectedGroup.categories.includes(template.category)),
    [documents, selectedGroup]
  );
  const selectedDocument = useMemo(
    () => selectedGroupDocs.find((template) => template.id === selectedDocumentId) ?? selectedGroupDocs[0] ?? null,
    [selectedDocumentId, selectedGroupDocs]
  );

  useEffect(() => {
    if (!visibleGroups.length) {
      return;
    }

    if (!allowedGroupIds.includes(selectedGroupId)) {
      setSelectedGroupId(visibleGroups[0].id);
    }
  }, [allowedGroupIds, selectedGroupId, visibleGroups]);

  useEffect(() => {
    if (!selectedGroupDocs.length) {
      setSelectedDocumentId(null);
      return;
    }

    if (!selectedDocumentId || !selectedGroupDocs.some((template) => template.id === selectedDocumentId)) {
      setSelectedDocumentId(selectedGroupDocs[0].id);
    }
  }, [selectedDocumentId, selectedGroupDocs]);

  const uploadedCount = documents.filter((template) => template.status === "uploaded").length;
  const missingCount = documents.filter((template) => template.status === "missing").length;
  const urgentCount = documents.filter(
    (template) => template.status === "expiring-soon" || template.status === "expired"
  ).length;
  const savedInSelectedGroup = selectedGroupDocs.filter((template) => template.status === "uploaded").length;
  const nextActionDocs = documents.filter((template) => template.status === "expiring-soon" || template.status === "missing");

  return (
    <>
      <DashboardHero
        accountLoading={accountLoading}
        accountMessage={accountMessage}
        accountPlan={accountPlan}
        email={session?.user.email ?? null}
        missingCount={missingCount}
        urgentCount={urgentCount}
        uploadedCount={uploadedCount}
      />

      <ScanWorkspace embedded providerStatus={scanProviderStatus} />

      <section className="dashboard-layout" id="records">
        <section className="dashboard-main">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Categories</p>
              <h2>Categories with clear scope.</h2>
            </div>
            <p className="section-support">Choose a category, then review the related records below.</p>
          </div>

          <CategoryGrid groups={visibleGroups} onSelect={setSelectedGroupId} selectedGroupId={selectedGroup.id} />

          <DocumentList
            documents={selectedGroupDocs}
            onSelect={setSelectedDocumentId}
            selectedDocumentId={selectedDocumentId}
            selectedGroup={selectedGroup}
            uploadedCount={savedInSelectedGroup}
          />

          {selectedDocument ? (
            <DocumentDetail
              actionLoading={protectedAction.loading}
              actionMessage={protectedAction.message}
              document={selectedDocument}
              onDownload={(document) => void handleProtectedAction("download", document)}
              onPreview={(document) => void handleProtectedAction("preview", document)}
            />
          ) : (
            <EmptyState
              body="Signed-in records will appear here after they are added through the protected scan workflow."
              title="No records are in this category yet."
            />
          )}
        </section>

        <aside className="dashboard-side">
          <PlanStatusCard
            accountPlan={accountPlan}
            uploadedCount={uploadedCount}
            visibleGroupCount={visibleGroups.length}
          />

          <NextActionsPanel documents={nextActionDocs} />

          {documentMessage ? <p className="inline-feedback">{documentMessage}</p> : null}
        </aside>
      </section>
    </>
  );
}
