"use client";

import type { DeviceRecord, DocumentTemplate } from "@nolostdocs/types";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { dashboardGroups, type DashboardGroupId } from "@/constants/launcherGroups";
import { runProtectedDocumentAction } from "@/lib/documents/download";
import { loadDevices, registerBrowser, setDeviceLocked, type DeviceActionState } from "@/lib/devices/actions";
import { allowedGroupIdsForPlan, resolveAccountPlan, type AccountPlan } from "@/lib/plans/resolvePlan";
import { getPreferencePayload, readStoredHiddenGroups, writeStoredHiddenGroups } from "@/lib/preferences/dashboardPreferences";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { AccessTrailPanel } from "./AccessTrailPanel";
import { CategoryGrid } from "./CategoryGrid";
import { CategoryVisibilityPanel } from "./CategoryVisibilityPanel";
import { DashboardHero } from "./DashboardHero";
import { DevicePanel } from "./DevicePanel";
import { DocumentDetail } from "./DocumentDetail";
import { DocumentList } from "./DocumentList";
import { NextActionsPanel } from "./NextActionsPanel";
import { PlanStatusCard } from "./PlanStatusCard";

type DashboardPreferenceRow = {
  category_key: string;
  is_visible: boolean;
};

type ProtectedActionState = {
  loading: boolean;
  message: string | null;
};

type DashboardShellProps = {
  initialDocumentMessage: string | null;
  initialDocuments: DocumentTemplate[];
};

const demoDevices: DeviceRecord[] = [
  { id: "dev-1", name: "iPhone 15", platform: "ios", trusted: true, locked: false, lastSeen: "2 min ago" },
  { id: "dev-2", name: "Pixel 9", platform: "android", trusted: true, locked: false, lastSeen: "12 min ago" },
  { id: "dev-3", name: "Chrome on MacBook", platform: "web", trusted: true, locked: false, lastSeen: "now" }
];

export function DashboardShell({ initialDocumentMessage, initialDocuments }: DashboardShellProps) {
  const { session } = useAuth();
  const { client, configured } = createBrowserSupabaseClient();
  const [selectedGroupId, setSelectedGroupId] = useState<DashboardGroupId>("basic");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [hiddenGroupIds, setHiddenGroupIds] = useState<DashboardGroupId[]>(() => readStoredHiddenGroups());
  const [accountPlan, setAccountPlan] = useState<AccountPlan>("free");
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [documentMessage, setDocumentMessage] = useState<string | null>(initialDocumentMessage);
  const [documents] = useState<DocumentTemplate[]>(initialDocuments);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferenceMessage, setPreferenceMessage] = useState<string | null>(null);
  const [devices, setDevices] = useState<DeviceRecord[]>(demoDevices);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [deviceAction, setDeviceAction] = useState<DeviceActionState>({ loading: false, message: null });
  const [protectedAction, setProtectedAction] = useState<ProtectedActionState>({ loading: false, message: null });
  const [showAccessExplainer, setShowAccessExplainer] = useState(false);

  useEffect(() => {
    if (!configured || !session) {
      setAccountPlan("free");
      setHiddenGroupIds(readStoredHiddenGroups());
      return;
    }

    void loadAccountPlan();
    void loadVisibilityPreferences();
  }, [configured, session]);

  useEffect(() => {
    if (!configured || !session) {
      setDevices(demoDevices);
      return;
    }

    void refreshDevices();
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

  async function refreshDevices() {
    setDevicesLoading(true);
    setDeviceAction((current) => ({ ...current, message: null }));

    const result = await loadDevices(client, configured, session);

    setDevicesLoading(false);
    setDevices(result.devices);

    if (result.message) {
      setDeviceAction({ loading: false, message: result.message });
    }
  }

  async function handleRegisterBrowser() {
    setDeviceAction({ loading: true, message: null });
    const result = await registerBrowser(client, configured, session);

    if (result.message !== "Browser registered or refreshed.") {
      setDeviceAction({ loading: false, message: result.message });
      return;
    }

    await refreshDevices();
    setDeviceAction({ loading: false, message: result.message });
  }

  async function handleDeviceLock(deviceId: string, shouldLock: boolean) {
    setDeviceAction({ loading: true, message: null });
    const result = await setDeviceLocked(client, configured, session, deviceId, shouldLock);

    if (!configured || !session) {
      setDevices((current) => current.map((device) => (device.id === deviceId ? { ...device, locked: shouldLock } : device)));
      setDeviceAction({ loading: false, message: result.message });
      return;
    }

    if (result.message !== (shouldLock ? "Device marked lost and locked." : "Device unlocked and re-authorized.")) {
      setDeviceAction({ loading: false, message: result.message });
      return;
    }

    await refreshDevices();
    setDeviceAction({ loading: false, message: result.message });
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

  const uploadedCount = documents.filter((template) => template.status === "uploaded").length;
  const missingCount = documents.filter((template) => template.status === "missing").length;
  const urgentCount = documents.filter(
    (template) => template.status === "expiring-soon" || template.status === "expired"
  ).length;
  const savedInSelectedGroup = selectedGroupDocs.filter((template) => template.status === "uploaded").length;
  const nextActionDocs = documents.filter(
    (template) => template.status === "expiring-soon" || template.status === "missing"
  );
  const activeDeviceCount = devices.filter((device) => !device.locked).length;

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
              Capture, rotation, validation, and signed upload are now wired into the protected scan route.
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

          {selectedDocument ? (
            <DocumentDetail
              actionLoading={protectedAction.loading}
              actionMessage={protectedAction.message}
              document={selectedDocument}
              onDownload={(document) => void handleProtectedAction("download", document)}
              onPreview={(document) => void handleProtectedAction("preview", document)}
              onToggleAccessExplainer={() => setShowAccessExplainer((current) => !current)}
              showAccessExplainer={showAccessExplainer}
            />
          ) : (
            <EmptyState
              body="Signed-in documents will appear here after you add them through the protected scan flow."
              title="No documents in this group yet."
            />
          )}
        </section>

        <aside className="dashboard-side">
          <PlanStatusCard
            accountPlan={accountPlan}
            hiddenGroups={hiddenGroups}
            lockedGroups={lockedGroups}
            uploadedCount={uploadedCount}
            visibleGroupCount={visibleGroups.length}
          />

          <NextActionsPanel documents={nextActionDocs} />

          <AccessTrailPanel />

          {documentMessage ? <p className="inline-feedback">{documentMessage}</p> : null}

          <DevicePanel
            actionLoading={deviceAction.loading}
            activeDeviceCount={activeDeviceCount}
            devices={devices}
            devicesLoading={devicesLoading}
            message={deviceAction.message}
            onRefreshDevices={() => void refreshDevices()}
            onRegisterBrowser={() => void handleRegisterBrowser()}
            onToggleDeviceLock={(deviceId, shouldLock) => void handleDeviceLock(deviceId, shouldLock)}
          />
        </aside>
      </section>
    </>
  );
}
