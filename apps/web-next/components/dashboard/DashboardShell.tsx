"use client";

import { prototypeSnapshot } from "@doc-wallet/config";
import type { DocumentTemplate } from "@doc-wallet/types";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { dashboardGroups, type DashboardGroupId } from "@/constants/launcherGroups";
import { allowedGroupIdsForPlan, resolveAccountPlan, type AccountPlan } from "@/lib/plans/resolvePlan";
import { getPreferencePayload, readStoredHiddenGroups, writeStoredHiddenGroups } from "@/lib/preferences/dashboardPreferences";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { CategoryGrid } from "./CategoryGrid";
import { CategoryVisibilityPanel } from "./CategoryVisibilityPanel";
import { DashboardHero } from "./DashboardHero";
import { DocumentDetail } from "./DocumentDetail";
import { DocumentList } from "./DocumentList";
import { PlanStatusCard } from "./PlanStatusCard";

type DashboardPreferenceRow = {
  category_key: string;
  is_visible: boolean;
};

export function DashboardShell() {
  const { session } = useAuth();
  const { client, configured } = createBrowserSupabaseClient();
  const [selectedGroupId, setSelectedGroupId] = useState<DashboardGroupId>("basic");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [hiddenGroupIds, setHiddenGroupIds] = useState<DashboardGroupId[]>(() => readStoredHiddenGroups());
  const [accountPlan, setAccountPlan] = useState<AccountPlan>("free");
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferenceMessage, setPreferenceMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!configured || !session) {
      setAccountPlan("free");
      setHiddenGroupIds(readStoredHiddenGroups());
      return;
    }

    void loadAccountPlan();
    void loadVisibilityPreferences();
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
      setAccountMessage("Using Free Basic plan until profile sync is available.");
      return;
    }

    const [{ data: profile, error: profileError }, { data: subscriptions, error: subscriptionError }] = await Promise.all([
      client.from("profiles").select("plan, cloud_enabled").eq("id", session.user.id).maybeSingle(),
      client.from("subscriptions").select("plan, status").eq("user_id", session.user.id)
    ]);

    setAccountLoading(false);

    if (profileError || subscriptionError) {
      setAccountPlan("free");
      setAccountMessage("Using Free Basic plan until subscription state is available.");
      return;
    }

    setAccountPlan(resolveAccountPlan(profile, subscriptions ?? []));
  }

  async function loadVisibilityPreferences() {
    if (!session) {
      return;
    }

    setPreferencesLoading(true);
    setPreferenceMessage(null);

    const { data, error } = await client
      .from("dashboard_category_preferences")
      .select("category_key, is_visible, sort_order")
      .order("sort_order", { ascending: true });

    setPreferencesLoading(false);

    if (error) {
      setPreferenceMessage("Using local dashboard visibility until preferences are ready.");
      return;
    }

    const hidden = (data ?? [])
      .filter((row) => !((row as DashboardPreferenceRow).is_visible ?? true))
      .map((row) => String((row as DashboardPreferenceRow).category_key))
      .filter((value): value is DashboardGroupId => dashboardGroups.some((group) => group.id === value));

    setHiddenGroupIds(hidden);
    writeStoredHiddenGroups(hidden);
  }

  async function handleGroupVisibility(groupId: DashboardGroupId, nextVisible: boolean) {
    const nextHidden = nextVisible
      ? hiddenGroupIds.filter((id) => id !== groupId)
      : hiddenGroupIds.includes(groupId)
        ? hiddenGroupIds
        : [...hiddenGroupIds, groupId];

    if (!nextVisible && dashboardGroups.length - nextHidden.length === 0) {
      setPreferenceMessage("Keep at least one category visible on the dashboard.");
      return;
    }

    setHiddenGroupIds(nextHidden);
    writeStoredHiddenGroups(nextHidden);
    setPreferenceMessage(nextVisible ? "Category restored to the dashboard." : "Category hidden from the dashboard.");

    if (!configured || !session) {
      return;
    }

    setPreferencesLoading(true);

    const { error } = await client
      .from("dashboard_category_preferences")
      .upsert(getPreferencePayload(nextHidden, session.user.id), { onConflict: "user_id,category_key" });

    setPreferencesLoading(false);

    if (error) {
      setPreferenceMessage("Saved locally. Connect the dashboard preferences table to persist this account-wide.");
    }
  }

  const allowedGroupIds = useMemo(() => allowedGroupIdsForPlan(accountPlan), [accountPlan]);
  const visibleGroups = useMemo(
    () => dashboardGroups.filter((group) => allowedGroupIds.includes(group.id) && !hiddenGroupIds.includes(group.id)),
    [allowedGroupIds, hiddenGroupIds]
  );
  const hiddenGroups = useMemo(
    () => dashboardGroups.filter((group) => allowedGroupIds.includes(group.id) && hiddenGroupIds.includes(group.id)),
    [allowedGroupIds, hiddenGroupIds]
  );
  const lockedGroups = useMemo(
    () => dashboardGroups.filter((group) => !allowedGroupIds.includes(group.id)),
    [allowedGroupIds]
  );
  const selectedGroup = useMemo(
    () => dashboardGroups.find((group) => group.id === selectedGroupId) ?? dashboardGroups[0],
    [selectedGroupId]
  );
  const selectedGroupDocs = useMemo(
    () => prototypeSnapshot.templates.filter((template) => selectedGroup.categories.includes(template.category)),
    [selectedGroup]
  );
  const selectedDocument = useMemo(
    () => selectedGroupDocs.find((template) => template.id === selectedDocumentId) ?? selectedGroupDocs[0] ?? null,
    [selectedDocumentId, selectedGroupDocs]
  );

  useEffect(() => {
    if (!visibleGroups.length) {
      return;
    }

    if (hiddenGroupIds.includes(selectedGroupId) || !allowedGroupIds.includes(selectedGroupId)) {
      setSelectedGroupId(visibleGroups[0].id);
    }
  }, [allowedGroupIds, hiddenGroupIds, selectedGroupId, visibleGroups]);

  useEffect(() => {
    if (!selectedGroupDocs.length) {
      setSelectedDocumentId(null);
      return;
    }

    if (!selectedDocumentId || !selectedGroupDocs.some((template) => template.id === selectedDocumentId)) {
      setSelectedDocumentId(selectedGroupDocs[0].id);
    }
  }, [selectedDocumentId, selectedGroupDocs]);

  const uploadedCount = prototypeSnapshot.templates.filter((template) => template.status === "uploaded").length;
  const missingCount = prototypeSnapshot.templates.filter((template) => template.status === "missing").length;
  const urgentCount = prototypeSnapshot.templates.filter(
    (template) => template.status === "expiring-soon" || template.status === "expired"
  ).length;
  const savedInSelectedGroup = selectedGroupDocs.filter((template) => template.status === "uploaded").length;
  const nextActionDocs = prototypeSnapshot.templates.filter(
    (template) => template.status === "expiring-soon" || template.status === "missing"
  );

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

      <section className="dashboard-layout">
        <section className="dashboard-main">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Categories</p>
              <h2>Categories.</h2>
            </div>
            <p className="section-support">Categories lead. Documents stay secondary.</p>
          </div>

          <CategoryGrid groups={visibleGroups} onSelect={setSelectedGroupId} selectedGroupId={selectedGroup.id} />

          <CategoryVisibilityPanel
            hiddenGroups={hiddenGroups}
            message={preferenceMessage}
            onHide={(groupId) => void handleGroupVisibility(groupId, false)}
            onShow={(groupId) => void handleGroupVisibility(groupId, true)}
            saving={preferencesLoading}
            visibleGroups={visibleGroups}
          />

          <Card className="side-card">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Scan</p>
                <h3>Capture a new document.</h3>
              </div>
            </div>
            <p className="section-support">
              The route is protected now. Full capture, validation, and signed upload behavior land in the next phase.
            </p>
            <Button href="/scan">Open scan route</Button>
          </Card>

          {lockedGroups.length ? (
            <Card className="side-card upgrade-card">
              <div className="section-heading compact">
                <div>
                  <p className="eyebrow">Premium boundary</p>
                  <h3>{lockedGroups.length} groups stay reserved for premium.</h3>
                </div>
                <span className="mini-pill">Upgrade path</span>
              </div>
              <div className="visibility-pile muted">
                {lockedGroups.map((group) => (
                  <div className="visibility-chip muted locked" key={group.id}>
                    Unlock {group.title}
                  </div>
                ))}
              </div>
              <p className="section-support">
                Free Basic exposes the core group only. The broader document surface remains visible as a boundary.
              </p>
            </Card>
          ) : null}

          <DocumentList
            documents={selectedGroupDocs}
            onSelect={setSelectedDocumentId}
            selectedDocumentId={selectedDocumentId}
            selectedGroup={selectedGroup}
            uploadedCount={savedInSelectedGroup}
          />

          <DocumentDetail document={selectedDocument as DocumentTemplate | null} />
        </section>

        <aside className="dashboard-side">
          <PlanStatusCard
            accountPlan={accountPlan}
            hiddenGroups={hiddenGroups}
            lockedGroups={lockedGroups}
            visibleGroupCount={visibleGroups.length}
          />

          <Card className="side-card">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Next actions</p>
                <h3>Next up.</h3>
              </div>
            </div>
            <ul className="note-list">
              {nextActionDocs.slice(0, 4).map((template) => (
                <li key={template.id}>
                  <strong>{template.title}</strong>
                  <span>{template.note ?? template.helper}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="side-card">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Route protection</p>
                <h3>Protected pages now behave correctly when logged out.</h3>
              </div>
            </div>
            <ul className="note-list">
              <li>
                <strong>Dashboard is gated.</strong>
                <span>Signed-out visits are redirected through the login route.</span>
              </li>
              <li>
                <strong>Scan is gated.</strong>
                <span>The scan shell is no longer publicly reachable in the new app.</span>
              </li>
              <li>
                <strong>Server/client split is preserved.</strong>
                <span>Browser auth uses publishable credentials while the server helper stays isolated for later SSR work.</span>
              </li>
            </ul>
          </Card>

          <Card className="side-card">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Prototype fallback</p>
                <h3>Reference data stays visible while live flows are ported.</h3>
              </div>
            </div>
            <p className="section-support">
              This dashboard intentionally uses the prototype snapshot for category and document structure until protected actions, device controls, and live mutations are ported in later phases.
            </p>
          </Card>
        </aside>
      </section>
    </>
  );
}
