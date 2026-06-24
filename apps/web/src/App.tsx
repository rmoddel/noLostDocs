import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { FREE_PLAN_DOCUMENT_LIMIT, prototypeSnapshot } from "@doc-wallet/config";
import { createDocWalletSupabaseClient } from "@doc-wallet/supabase";
import type { CategoryId, DeviceRecord, DocumentStatus, DocumentTemplate } from "@doc-wallet/types";

const { configured, client } = createDocWalletSupabaseClient({
  url: import.meta.env.VITE_SUPABASE_URL,
  publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
});

const statusTone: Record<DocumentStatus, string> = {
  uploaded: "Saved",
  "expiring-soon": "Soon",
  missing: "Missing",
  expired: "Expired"
};

type AppRoute = "/" | "/about" | "/contact";
type LauncherGroupId = "basic" | "medical" | "professional" | "family";

type LauncherGroup = {
  id: LauncherGroupId;
  title: string;
  description: string;
  helper: string;
  categories: CategoryId[];
};

type DeviceActionState = {
  loading: boolean;
  message: string | null;
};

type ProtectedAction = "preview" | "download";
type DocumentAccessState = "available" | "reauth-required" | "restricted" | "session-expired";

type ProtectedActionState = {
  loading: boolean;
  message: string | null;
};

type AccountPlan = "free" | "premium";

type DashboardPreferenceRow = {
  category_key: string;
  is_visible: boolean;
  sort_order: number | null;
};

const DASHBOARD_PREFS_STORAGE_KEY = "nolostdocs.dashboard.hidden-groups";

const launcherGroups: LauncherGroup[] = [
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
];

const trustStatements = [
  "NoLostDocs is a secure document vault, not a legal replacement for original documents.",
  "Web access is an explicit cloud-backed feature. Local-only behavior is not implied here.",
  "Large category cards lead the experience. Document buttons stay secondary and status-aware."
];

const accessStateTone: Record<DocumentAccessState, string> = {
  available: "Authorized now",
  "reauth-required": "Re-check required",
  restricted: "Restricted",
  "session-expired": "Session expired"
};

function resolvePlan(profilePlan: string | null | undefined, cloudEnabled: boolean | null | undefined) {
  return profilePlan === "premium" || cloudEnabled ? "premium" : "free";
}

function allowedGroupIdsForPlan(plan: AccountPlan): LauncherGroupId[] {
  return plan === "premium" ? launcherGroups.map((group) => group.id) : ["basic"];
}

function getPlanLabel(plan: AccountPlan) {
  return plan === "premium" ? "Premium" : "Free Basic";
}

function isLauncherGroupId(value: string): value is LauncherGroupId {
  return launcherGroups.some((group) => group.id === value);
}

function readStoredHiddenGroups() {
  if (typeof window === "undefined") {
    return [] as LauncherGroupId[];
  }

  const raw = window.localStorage.getItem(DASHBOARD_PREFS_STORAGE_KEY);

  if (!raw) {
    return [] as LauncherGroupId[];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value): value is LauncherGroupId => typeof value === "string" && isLauncherGroupId(value)) : [];
  } catch {
    return [] as LauncherGroupId[];
  }
}

function writeStoredHiddenGroups(hiddenGroupIds: LauncherGroupId[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(DASHBOARD_PREFS_STORAGE_KEY, JSON.stringify(hiddenGroupIds));
}

function getDocumentAccessState(template: DocumentTemplate): DocumentAccessState {
  if (template.status === "uploaded") return "available";
  if (template.status === "expiring-soon") return "reauth-required";
  if (template.status === "expired") return "session-expired";
  return "restricted";
}

function getDocumentCompleteness(template: DocumentTemplate) {
  return template.status === "uploaded" ? "Complete" : "Needs attention";
}

function formatExpiration(template: DocumentTemplate) {
  if (!template.expiresAt) {
    return "No tracked expiration";
  }

  return new Date(`${template.expiresAt}T12:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function buildAccessMessage(action: ProtectedAction, template: DocumentTemplate) {
  const noun = action === "preview" ? "preview" : "download";
  const accessState = getDocumentAccessState(template);

  if (accessState === "restricted") {
    return `${template.title} is missing, so ${noun} access is restricted until the record is completed.`;
  }

  if (accessState === "reauth-required") {
    return `${template.title} needs a fresh authorization check before ${noun} access because it is close to expiring.`;
  }

  if (accessState === "session-expired") {
    return `${template.title} requires a renewed session or updated file before ${noun} access can continue.`;
  }

  return action === "preview"
    ? `${template.title} passed the authorization check. A short-lived preview would open here.`
    : `${template.title} passed the authorization check. A short-lived download would be issued here.`;
}

function getPreferencePayload(hiddenGroupIds: LauncherGroupId[], userId: string) {
  return launcherGroups.map((group, index) => ({
    user_id: userId,
    category_key: group.id,
    is_visible: !hiddenGroupIds.includes(group.id),
    sort_order: index
  }));
}

function normalizeDeviceRow(row: Record<string, unknown>): DeviceRecord {
  return {
    id: String(row.id),
    name: String(row.device_name ?? "Unknown device"),
    platform: String(row.platform ?? "web") as DeviceRecord["platform"],
    trusted: Boolean(row.is_trusted),
    locked: Boolean(row.is_locked),
    lastSeen: row.last_seen_at ? new Date(String(row.last_seen_at)).toLocaleString() : "never"
  };
}

function getBrowserFingerprint() {
  if (typeof navigator === "undefined") {
    return "web-server-render";
  }

  return `${navigator.platform}:${navigator.userAgent}`.slice(0, 180);
}

function normalizeRoute(pathname: string): AppRoute {
  if (pathname === "/about") return "/about";
  if (pathname === "/contact") return "/contact";
  return "/";
}

function findLauncherGroup(id: LauncherGroupId) {
  return launcherGroups.find((group) => group.id === id) ?? launcherGroups[0];
}

function getGroupTemplates(group: LauncherGroup, templates: DocumentTemplate[]) {
  return templates.filter((template) => group.categories.includes(template.category));
}

export function App() {
  const [route, setRoute] = useState<AppRoute>(() => normalizeRoute(window.location.pathname));
  const [selectedGroupId, setSelectedGroupId] = useState<LauncherGroupId>("basic");
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(configured);
  const [email, setEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactSubject, setContactSubject] = useState("Support request");
  const [contactMessage, setContactMessage] = useState("");
  const [contactLoading, setContactLoading] = useState(false);
  const [contactStatus, setContactStatus] = useState<string | null>(null);
  const [devices, setDevices] = useState<DeviceRecord[]>(prototypeSnapshot.devices);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [deviceAction, setDeviceAction] = useState<DeviceActionState>({ loading: false, message: null });
  const [accountPlan, setAccountPlan] = useState<AccountPlan>("free");
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [hiddenGroupIds, setHiddenGroupIds] = useState<LauncherGroupId[]>(() => readStoredHiddenGroups());
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferenceMessage, setPreferenceMessage] = useState<string | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [protectedAction, setProtectedAction] = useState<ProtectedActionState>({ loading: false, message: null });
  const [showAccessExplainer, setShowAccessExplainer] = useState(false);

  useEffect(() => {
    const onPopState = () => setRoute(normalizeRoute(window.location.pathname));
    window.addEventListener("popstate", onPopState);

    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (!configured) {
      setSessionLoading(false);
      return;
    }

    let active = true;

    client.auth.getSession().then(({ data, error }) => {
      if (!active) return;

      if (error) {
        setAuthMessage(error.message);
      }

      setSession(data.session ?? null);
      setSessionLoading(false);
    });

    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setSessionLoading(false);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!configured || !session) {
      setDevices(prototypeSnapshot.devices);
      return;
    }

    void loadDevices();
  }, [session]);

  useEffect(() => {
    if (!session?.user.email) {
      return;
    }

    const fullName =
      typeof session.user.user_metadata?.full_name === "string" ? session.user.user_metadata.full_name : "";

    setContactEmail((current) => (current ? current : session.user.email ?? ""));
    setContactName((current) => (current ? current : fullName));
  }, [session]);

  useEffect(() => {
    if (!configured || !session) {
      const storedHiddenGroups = readStoredHiddenGroups();
      setHiddenGroupIds(storedHiddenGroups);
      setAccountPlan("free");
      return;
    }

    void loadAccountPlan();
    void loadVisibilityPreferences();
  }, [session]);

  const allowedGroupIds = useMemo(() => allowedGroupIdsForPlan(accountPlan), [accountPlan]);
  const visibleGroups = useMemo(
    () => launcherGroups.filter((group) => allowedGroupIds.includes(group.id) && !hiddenGroupIds.includes(group.id)),
    [allowedGroupIds, hiddenGroupIds]
  );
  const hiddenGroups = useMemo(
    () => launcherGroups.filter((group) => allowedGroupIds.includes(group.id) && hiddenGroupIds.includes(group.id)),
    [allowedGroupIds, hiddenGroupIds]
  );
  const lockedGroups = useMemo(
    () => launcherGroups.filter((group) => !allowedGroupIds.includes(group.id)),
    [allowedGroupIds]
  );

  function navigate(nextRoute: AppRoute) {
    if (window.location.pathname !== nextRoute) {
      window.history.pushState({}, "", nextRoute);
    }
    setRoute(nextRoute);
  }

  async function loadDevices() {
    if (!configured || !session) return;

    setDevicesLoading(true);
    setDeviceAction((current) => ({ ...current, message: null }));

    const { data, error } = await client
      .from("devices")
      .select("id, device_name, platform, is_trusted, is_locked, last_seen_at")
      .order("last_seen_at", { ascending: false });

    setDevicesLoading(false);

    if (error) {
      setDeviceAction({ loading: false, message: error.message });
      return;
    }

    setDevices((data ?? []).map((row) => normalizeDeviceRow(row as Record<string, unknown>)));
  }

  async function loadAccountPlan() {
    if (!configured || !session) return;

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
      setAccountMessage("Using Free Basic plan locally until profile sync is available.");
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

    const activePremium = (subscriptions ?? []).some(
      (subscription) => subscription.plan === "premium" && ["active", "trialing"].includes(subscription.status ?? "")
    );
    const plan = activePremium ? "premium" : resolvePlan(profile?.plan, profile?.cloud_enabled);
    setAccountPlan(plan);
  }

  async function loadVisibilityPreferences() {
    if (!configured || !session) return;

    setPreferencesLoading(true);
    setPreferenceMessage(null);

    const { data, error } = await client
      .from("dashboard_category_preferences")
      .select("category_key, is_visible, sort_order")
      .order("sort_order", { ascending: true });

    setPreferencesLoading(false);

    if (error) {
      setPreferenceMessage("Using local dashboard visibility until Supabase preferences are available.");
      return;
    }

    const hidden = (data ?? [])
      .filter((row) => !((row as DashboardPreferenceRow).is_visible ?? true))
      .map((row) => String((row as DashboardPreferenceRow).category_key))
      .filter(isLauncherGroupId);

    setHiddenGroupIds(hidden);
    writeStoredHiddenGroups(hidden);
  }

  async function handleGroupVisibility(groupId: LauncherGroupId, nextVisible: boolean) {
    const nextHidden = nextVisible
      ? hiddenGroupIds.filter((id) => id !== groupId)
      : hiddenGroupIds.includes(groupId)
        ? hiddenGroupIds
        : [...hiddenGroupIds, groupId];

    if (!nextVisible && launcherGroups.length - nextHidden.length === 0) {
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

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!configured) {
      setAuthMessage("Connect Supabase in apps/web/.env.local to enable live sign-in.");
      return;
    }

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setAuthMessage("Enter the email address you want to use.");
      return;
    }

    setAuthLoading(true);
    setAuthMessage(null);

    const { error } = await client.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/`
      }
    });

    setAuthLoading(false);

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setAuthMessage("Check your email for the sign-in link. It verifies your address and opens the dashboard.");
  }

  async function handleContactSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = contactName.trim();
    const trimmedEmail = contactEmail.trim();
    const trimmedSubject = contactSubject.trim();
    const trimmedMessage = contactMessage.trim();

    if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMessage) {
      setContactStatus("Fill in your name, email, subject, and message.");
      return;
    }

    if (!configured) {
      setContactStatus("Connect Supabase to enable contact submissions.");
      return;
    }

    setContactLoading(true);
    setContactStatus(null);

    const { error } = await client.functions.invoke("contact-submit", {
      body: {
        name: trimmedName,
        email: trimmedEmail,
        subject: trimmedSubject,
        message: trimmedMessage,
        page: route,
        userId: session?.user.id ?? null
      }
    });

    setContactLoading(false);

    if (error) {
      setContactStatus(error.message);
      return;
    }

    setContactStatus("Message sent. We'll review it and reply by email.");
    setContactSubject("Support request");
    setContactMessage("");
  }

  async function handleSignOut() {
    if (!configured) {
      setSession(null);
      setAuthMessage("Demo session cleared.");
      return;
    }

    const { error } = await client.auth.signOut();
    setSession(null);
    setDevices(prototypeSnapshot.devices);
    setAuthMessage(error ? error.message : "Signed out.");
    navigate("/");
  }

  async function logProtectedAction(action: ProtectedAction, template: DocumentTemplate) {
    if (!configured || !session) {
      return;
    }

    await client.functions.invoke("audit-log", {
      body: {
        action: `${action}-document`,
        resourceType: "document-template",
        resourceId: template.id,
        metadata: {
          title: template.title,
          category: template.category,
          accessState: getDocumentAccessState(template)
        }
      }
    });
  }

  async function handleRegisterBrowser() {
    if (!configured || !session) {
      setDeviceAction({
        loading: false,
        message: "Connect Supabase to enable live device registration."
      });
      return;
    }

    setDeviceAction({ loading: true, message: null });

    const { error } = await client.functions.invoke("register-device", {
      body: {
        deviceName: "Current Browser",
        platform: "web",
        deviceFingerprint: getBrowserFingerprint()
      }
    });

    if (error) {
      setDeviceAction({ loading: false, message: error.message });
      return;
    }

    await loadDevices();
    setDeviceAction({ loading: false, message: "Browser registered or refreshed." });
  }

  async function handleDeviceLock(deviceId: string, shouldLock: boolean) {
    if (!configured || !session) {
      setDevices((current) =>
        current.map((device) => (device.id === deviceId ? { ...device, locked: shouldLock } : device))
      );
      setDeviceAction({
        loading: false,
        message: shouldLock ? "Demo device locked." : "Demo device unlocked."
      });
      return;
    }

    setDeviceAction({ loading: true, message: null });

    const fn = shouldLock ? "lock-device" : "unlock-device";
    const { error } = await client.functions.invoke(fn, {
      body: { deviceId }
    });

    if (error) {
      setDeviceAction({ loading: false, message: error.message });
      return;
    }

    await loadDevices();
    setDeviceAction({
      loading: false,
      message: shouldLock ? "Device marked lost and locked." : "Device unlocked and re-authorized."
    });
  }

  async function handleProtectedAction(action: ProtectedAction, template: DocumentTemplate) {
    const accessState = getDocumentAccessState(template);
    const baseMessage = buildAccessMessage(action, template);

    if (accessState !== "available") {
      setProtectedAction({ loading: false, message: baseMessage });
      await logProtectedAction(action, template);
      return;
    }

    if (action === "preview") {
      setProtectedAction({ loading: false, message: baseMessage });
      await logProtectedAction(action, template);
      return;
    }

    if (!configured || !session) {
      setProtectedAction({
        loading: false,
        message: `${baseMessage} Connect Supabase to enable a live signed download.`
      });
      return;
    }

    setProtectedAction({ loading: true, message: null });

    const { data, error } = await client.functions.invoke("create-signed-download", {
      body: {
        documentId: template.id,
        documentTitle: template.title
      }
    });

    if (error) {
      setProtectedAction({ loading: false, message: error.message });
      return;
    }

    await logProtectedAction(action, template);
    const responseMessage =
      typeof data?.message === "string"
        ? data.message
        : "Authorized download flow completed. Replace this with a real signed URL flow when connected.";
    setProtectedAction({ loading: false, message: responseMessage });
  }

  const selectedGroup = findLauncherGroup(selectedGroupId);
  const selectedGroupDocs = useMemo(
    () => getGroupTemplates(selectedGroup, prototypeSnapshot.templates),
    [selectedGroup]
  );
  const selectedDocument = useMemo(
    () => selectedGroupDocs.find((template) => template.id === selectedDocumentId) ?? selectedGroupDocs[0] ?? null,
    [selectedDocumentId, selectedGroupDocs]
  );

  const uploadedCount = prototypeSnapshot.templates.filter((template) => template.status === "uploaded").length;
  const missingCount = prototypeSnapshot.templates.filter((template) => template.status === "missing").length;
  const urgentCount = prototypeSnapshot.templates.filter(
    (template) => template.status === "expiring-soon" || template.status === "expired"
  ).length;
  const savedInSelectedGroup = selectedGroupDocs.filter((template) => template.status === "uploaded").length;
  const nextActionDocs = prototypeSnapshot.templates.filter(
    (template) => template.status === "expiring-soon" || template.status === "missing"
  );
  const activeDeviceCount = devices.filter((device) => !device.locked).length;

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

  return (
    <main className="app-shell">
      <header className="site-topbar">
        <button className="brand-lockup" onClick={() => navigate("/")} type="button">
          <img alt="" aria-hidden="true" className="brand-mark" src="/nolostdocs-mark.svg" />
          <span>NoLostDocs</span>
        </button>

        <nav className="site-nav">
          <button className={`nav-link${route === "/" ? " active" : ""}`} onClick={() => navigate("/")} type="button">
            Home
          </button>
          <button
            className={`nav-link${route === "/about" ? " active" : ""}`}
            onClick={() => navigate("/about")}
            type="button"
          >
            About
          </button>
          <button
            className={`nav-link${route === "/contact" ? " active" : ""}`}
            onClick={() => navigate("/contact")}
            type="button"
          >
            Contact Us
          </button>
          {session ? (
            <button className="button secondary small" onClick={() => void handleSignOut()} type="button">
              Sign out
            </button>
          ) : (
            <button className="button primary small" onClick={() => navigate("/")} type="button">
              Sign in
            </button>
          )}
        </nav>
      </header>

      {route === "/about" ? (
        <InfoPage
          eyebrow="About"
          title="A document vault built for real pressure moments."
          body="NoLostDocs is designed to reduce panic around personal and professional records. The product keeps categories, document status, and cloud-backed recovery flows clear without pretending saved copies replace original documents."
          secondary="The web surface exists so cloud-backed users can reach their organized records, understand what is missing, and manage secure access with less guesswork."
          onPrimary={() => navigate("/")}
          primaryLabel={session ? "Back to dashboard" : "Open the launcher preview"}
        />
      ) : null}

      {route === "/contact" ? (
        <ContactPage
          contactEmail={contactEmail}
          contactLoading={contactLoading}
          contactMessage={contactMessage}
          contactName={contactName}
          contactStatus={contactStatus}
          contactSubject={contactSubject}
          onContactEmailChange={setContactEmail}
          onContactMessageChange={setContactMessage}
          onContactNameChange={setContactName}
          onContactSubmit={handleContactSubmit}
          onContactSubjectChange={setContactSubject}
          onPrimary={() => navigate("/")}
          primaryLabel={session ? "Back to dashboard" : "Back to home"}
          sessionEmail={session?.user.email ?? null}
        />
      ) : null}

      {route === "/" && !session ? (
        <PublicHome
          authLoading={authLoading}
          authMessage={authMessage}
          configured={configured}
          email={email}
          onEmailChange={setEmail}
          onGroupSelect={setSelectedGroupId}
          onSignIn={handleSignIn}
          selectedGroup={selectedGroup}
          selectedGroupDocs={selectedGroupDocs}
          uploadedCount={uploadedCount}
        />
      ) : null}

      {route === "/" && session ? (
        <DashboardHome
          activeDeviceCount={activeDeviceCount}
          accountLoading={accountLoading}
          accountMessage={accountMessage}
          accountPlan={accountPlan}
          deviceAction={deviceAction}
          devices={devices}
          devicesLoading={devicesLoading}
          hiddenGroups={hiddenGroups}
          lockedGroups={lockedGroups}
          missingCount={missingCount}
          nextActionDocs={nextActionDocs}
          onDeviceLock={handleDeviceLock}
          onDocumentSelect={setSelectedDocumentId}
          onGroupSelect={setSelectedGroupId}
          onGroupVisibilityChange={handleGroupVisibility}
          onProtectedAction={handleProtectedAction}
          onRefreshDevices={loadDevices}
          onRegisterBrowser={handleRegisterBrowser}
          preferenceMessage={preferenceMessage}
          preferencesLoading={preferencesLoading}
          protectedAction={protectedAction}
          selectedDocument={selectedDocument}
          selectedGroup={selectedGroup}
          selectedGroupDocs={selectedGroupDocs}
          session={session}
          sessionLoading={sessionLoading}
          showAccessExplainer={showAccessExplainer}
          signedIn={Boolean(session)}
          savedInSelectedGroup={savedInSelectedGroup}
          setShowAccessExplainer={setShowAccessExplainer}
          uploadedCount={uploadedCount}
          urgentCount={urgentCount}
          visibleGroups={visibleGroups}
        />
      ) : null}
    </main>
  );
}

type PublicHomeProps = {
  authLoading: boolean;
  authMessage: string | null;
  configured: boolean;
  email: string;
  onEmailChange: (value: string) => void;
  onGroupSelect: (id: LauncherGroupId) => void;
  onSignIn: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  selectedGroup: LauncherGroup;
  selectedGroupDocs: DocumentTemplate[];
  uploadedCount: number;
};

function PublicHome({
  authLoading,
  authMessage,
  configured,
  email,
  onEmailChange,
  onGroupSelect,
  onSignIn,
  selectedGroup,
  selectedGroupDocs,
  uploadedCount
}: PublicHomeProps) {
  return (
    <>
      <section className="launcher-hero">
        <div className="hero-copy-card">
          <p className="eyebrow">Secure preview</p>
          <h1>No more lost docs. Everything you need in one app.</h1>
          <p className="lede">
            The homepage now behaves like a locked version of the real app: category-first, cloud-backed, and honest
            about what web access is for.
          </p>
          <div className="hero-chip-row">
            <span className="trust-chip">Secure document vault</span>
            <span className="trust-chip">Cloud-backed access</span>
            <span className="trust-chip">Not a replacement for originals</span>
          </div>
        </div>

        <div className="hero-summary-card">
          <p className="eyebrow">Why the app leads</p>
          <h2>Users should understand the category model before they ever sign in.</h2>
          <p>
            Large category tiles introduce the structure. Smaller document buttons preview the next layer. Login
            unlocks saved state and the real dashboard.
          </p>
          <div className="summary-metrics">
            <div className="summary-metric">
              <strong>{launcherGroups.length}</strong>
              <span>top-level groups</span>
            </div>
            <div className="summary-metric">
              <strong>{uploadedCount}</strong>
              <span>saved preview docs</span>
            </div>
          </div>
        </div>
      </section>

      <section className="launcher-layout">
        <section className="launcher-main">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Step 1</p>
              <h2>Pick a high-level category.</h2>
            </div>
            <p className="section-support">Category cards stay visually larger than document actions at every breakpoint.</p>
          </div>

          <div className="launcher-grid">
            {launcherGroups.map((group) => (
              <button
                className={`launcher-card${selectedGroup.id === group.id ? " active" : ""}`}
                key={group.id}
                onClick={() => onGroupSelect(group.id)}
                type="button"
              >
                <span className="launcher-card-badge">Login required</span>
                <strong>{group.title}</strong>
                <p>{group.description}</p>
                <small>{group.helper}</small>
              </button>
            ))}
          </div>
        </section>

        <aside className="launcher-side">
          <div className="side-card">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Step 2</p>
                <h3>{selectedGroup.title} documents</h3>
              </div>
            </div>

            <div className="document-action-list">
              {selectedGroupDocs.slice(0, 4).map((template) => (
                <button className={`document-action preview status-${template.status}`} key={template.id} type="button">
                  <div>
                    <strong>{template.title}</strong>
                    <p>{template.note ?? template.helper}</p>
                  </div>
                  <span className={`status-pill status-${template.status}`}>{statusTone[template.status]}</span>
                </button>
              ))}
            </div>
          </div>

            <div className="side-card auth-card">
              <div className="section-heading compact">
                <div>
                  <p className="eyebrow">Unlock</p>
                  <h3>Sign in with email to open your dashboard.</h3>
                </div>
                <span className="mini-pill">{configured ? "Email verification" : "Not connected"}</span>
              </div>

              <form className="auth-form" onSubmit={(event) => void onSignIn(event)}>
                <label className="field">
                  <span>Email</span>
                  <input
                    autoComplete="email"
                    onChange={(event) => onEmailChange(event.target.value)}
                  placeholder="you@example.com"
                    type="email"
                    value={email}
                  />
                </label>

                <button className="button primary block" disabled={authLoading} type="submit">
                  {authLoading ? "Working..." : "Send sign-in link"}
                </button>
              </form>

              <p className="support-copy">
                Real saved state, device controls, and cloud-backed document status all live behind this login gate.
              </p>
              {authMessage ? <p className="inline-feedback">{authMessage}</p> : null}
            </div>
        </aside>
      </section>

      <section className="trust-strip">
        {trustStatements.map((statement) => (
          <article className="trust-card" key={statement}>
            <p>{statement}</p>
          </article>
        ))}
      </section>
    </>
  );
}

type DashboardHomeProps = {
  activeDeviceCount: number;
  accountLoading: boolean;
  accountMessage: string | null;
  accountPlan: AccountPlan;
  deviceAction: DeviceActionState;
  devices: DeviceRecord[];
  devicesLoading: boolean;
  hiddenGroups: LauncherGroup[];
  lockedGroups: LauncherGroup[];
  missingCount: number;
  nextActionDocs: DocumentTemplate[];
  onDeviceLock: (deviceId: string, shouldLock: boolean) => Promise<void>;
  onDocumentSelect: (id: string) => void;
  onGroupSelect: (id: LauncherGroupId) => void;
  onGroupVisibilityChange: (groupId: LauncherGroupId, nextVisible: boolean) => Promise<void>;
  onProtectedAction: (action: ProtectedAction, template: DocumentTemplate) => Promise<void>;
  onRefreshDevices: () => Promise<void>;
  onRegisterBrowser: () => Promise<void>;
  preferenceMessage: string | null;
  preferencesLoading: boolean;
  protectedAction: ProtectedActionState;
  selectedDocument: DocumentTemplate | null;
  savedInSelectedGroup: number;
  selectedGroup: LauncherGroup;
  selectedGroupDocs: DocumentTemplate[];
  session: Session;
  sessionLoading: boolean;
  showAccessExplainer: boolean;
  signedIn: boolean;
  setShowAccessExplainer: (show: boolean) => void;
  uploadedCount: number;
  urgentCount: number;
  visibleGroups: LauncherGroup[];
};

function DashboardHome({
  activeDeviceCount,
  accountLoading,
  accountMessage,
  accountPlan,
  deviceAction,
  devices,
  devicesLoading,
  hiddenGroups,
  lockedGroups,
  missingCount,
  nextActionDocs,
  onDeviceLock,
  onDocumentSelect,
  onGroupSelect,
  onGroupVisibilityChange,
  onProtectedAction,
  onRefreshDevices,
  onRegisterBrowser,
  preferenceMessage,
  preferencesLoading,
  protectedAction,
  selectedDocument,
  savedInSelectedGroup,
  selectedGroup,
  selectedGroupDocs,
  session,
  sessionLoading,
  showAccessExplainer,
  signedIn,
  setShowAccessExplainer,
  uploadedCount,
  urgentCount,
  visibleGroups
}: DashboardHomeProps) {
  const accessState = selectedDocument ? getDocumentAccessState(selectedDocument) : null;
  const freePlanRemainingSlots = Math.max(FREE_PLAN_DOCUMENT_LIMIT - uploadedCount, 0);

  return (
    <>
      <section className="dashboard-hero">
        <div className="hero-copy-card">
          <p className="eyebrow">Dashboard</p>
          <h1>Your document launcher is now the home screen.</h1>
          <p className="lede">
            {accountPlan === "premium"
              ? "Premium keeps the full cloud-backed workspace open: all groups, protected access, and recovery-oriented account controls."
              : "Free Basic keeps login and core identity records available while reserving broader cloud-backed groups and capacity for premium."}
          </p>
        </div>

        <div className="hero-summary-card">
          <p className="eyebrow">{accountLoading ? "Checking account" : getPlanLabel(accountPlan)}</p>
          <h2>{session.user.email}</h2>
          <div className="summary-metrics">
            <div className="summary-metric">
              <strong>{uploadedCount}</strong>
              <span>saved</span>
            </div>
            <div className="summary-metric">
              <strong>{missingCount}</strong>
              <span>missing</span>
            </div>
            <div className="summary-metric">
              <strong>{urgentCount}</strong>
              <span>urgent</span>
            </div>
          </div>
          <p className="section-support">
            {accountPlan === "premium"
              ? "Email recovery stays enabled for the account, and premium keeps the non-basic groups unlocked."
              : `Free Basic currently targets the core group and ${FREE_PLAN_DOCUMENT_LIMIT} saved cloud documents before upgrade is required.`}
          </p>
          {accountMessage ? <p className="inline-feedback">{accountMessage}</p> : null}
        </div>
      </section>

      <section className="dashboard-layout">
        <section className="dashboard-main">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Categories</p>
              <h2>Larger tiles lead the interaction.</h2>
            </div>
            <p className="section-support">
              Mobile uses a 2-up grid, then expands to a cleaner desktop grid without stretching the cards into soup.
            </p>
          </div>

          <div className="launcher-grid">
            {visibleGroups.map((group) => (
              <button
                className={`launcher-card app-card${selectedGroup.id === group.id ? " active" : ""}`}
                key={group.id}
                onClick={() => onGroupSelect(group.id)}
                type="button"
              >
                <strong>{group.title}</strong>
                <p>{group.description}</p>
                <small>{group.helper}</small>
              </button>
            ))}
          </div>

          <div className="side-card visibility-card">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Category visibility</p>
                <h3>{visibleGroups.length} visible groups</h3>
              </div>
              <span className="mini-pill">{preferencesLoading ? "Saving..." : "Dashboard scope"}</span>
            </div>
            <div className="visibility-pile">
              {visibleGroups.map((group) => (
                <button
                  className="visibility-chip"
                  key={group.id}
                  onClick={() => void onGroupVisibilityChange(group.id, false)}
                  type="button"
                >
                  Hide {group.title}
                </button>
              ))}
            </div>
            {hiddenGroups.length ? (
              <>
                <p className="section-support">Hidden groups stay recoverable from this dashboard.</p>
                <div className="visibility-pile muted">
                  {hiddenGroups.map((group) => (
                    <button
                      className="visibility-chip muted"
                      key={group.id}
                      onClick={() => void onGroupVisibilityChange(group.id, true)}
                      type="button"
                    >
                      Show {group.title}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
            {preferenceMessage ? <p className="inline-feedback">{preferenceMessage}</p> : null}
          </div>

          {lockedGroups.length ? (
            <div className="side-card upgrade-card">
              <div className="section-heading compact">
                <div>
                  <p className="eyebrow">Premium boundary</p>
                  <h3>{lockedGroups.length} groups are reserved for premium.</h3>
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
                Premium expands the dashboard beyond the Basic group and increases cloud-backed document capacity.
              </p>
            </div>
          ) : null}

          <div className="side-card selected-group-card">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Selected group</p>
                <h3>{selectedGroup.title}</h3>
              </div>
              <span className="panel-note">
                {savedInSelectedGroup}/{selectedGroupDocs.length} saved
              </span>
            </div>

            <div className="document-action-list">
              {selectedGroupDocs.map((template) => (
                <button
                  className={`document-action status-${template.status}${
                    selectedDocument?.id === template.id ? " selected" : ""
                  }`}
                  key={template.id}
                  onClick={() => onDocumentSelect(template.id)}
                  type="button"
                >
                  <div>
                    <strong>{template.title}</strong>
                    <p>{template.note ?? template.helper}</p>
                  </div>
                  <span className={`status-pill status-${template.status}`}>{statusTone[template.status]}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedDocument ? (
            <div className="side-card detail-card">
              <div className="section-heading compact">
                <div>
                  <p className="eyebrow">Document detail</p>
                  <h3>{selectedDocument.title}</h3>
                </div>
                <span className={`status-pill access-${accessState}`}>{accessStateTone[accessState ?? "restricted"]}</span>
              </div>

              <div className="detail-grid">
                <div className="detail-stat">
                  <span>Status</span>
                  <strong>{statusTone[selectedDocument.status]}</strong>
                </div>
                <div className="detail-stat">
                  <span>Expiration</span>
                  <strong>{formatExpiration(selectedDocument)}</strong>
                </div>
                <div className="detail-stat">
                  <span>Completeness</span>
                  <strong>{getDocumentCompleteness(selectedDocument)}</strong>
                </div>
              </div>

              <p className="section-support">{selectedDocument.note ?? selectedDocument.helper}</p>

              <div className="button-row">
                <button
                  className="button primary small"
                  disabled={protectedAction.loading}
                  onClick={() => void onProtectedAction("preview", selectedDocument)}
                  type="button"
                >
                  Authorized preview
                </button>
                <button
                  className="button secondary small"
                  disabled={protectedAction.loading}
                  onClick={() => void onProtectedAction("download", selectedDocument)}
                  type="button"
                >
                  Authorized download
                </button>
                <button
                  className="button secondary small"
                  onClick={() => setShowAccessExplainer(!showAccessExplainer)}
                  type="button"
                >
                  Why protected?
                </button>
              </div>

              {showAccessExplainer ? (
                <div className="access-explainer">
                  <strong>Web access stays scoped.</strong>
                  <p>
                    Metadata browsing is always lighter than file access. Protected actions stay short-lived, can require
                    a fresh check, and are intended to be auditable.
                  </p>
                </div>
              ) : null}

              {protectedAction.message ? <p className="inline-feedback">{protectedAction.message}</p> : null}
            </div>
          ) : null}
        </section>

        <aside className="dashboard-side">
          <div className="side-card">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Plan status</p>
                <h3>{accountPlan === "premium" ? "Premium access is active." : "Free Basic is active."}</h3>
              </div>
            </div>
            <ul className="note-list">
              <li>
                <strong>Login stays required for every account.</strong>
                <span>Email verification and magic-link recovery are part of the standard entry path.</span>
              </li>
              <li>
                <strong>{accountPlan === "premium" ? "All groups unlocked." : "Only the Basic group is unlocked."}</strong>
                <span>
                  {accountPlan === "premium"
                    ? "Medical, professional, and family records remain available in the same signed-in dashboard."
                    : "Upgrade to premium to unlock medical, professional, and family document groups."}
                </span>
              </li>
              <li>
                <strong>
                  {accountPlan === "premium"
                    ? "Premium quota policy is higher."
                    : `${freePlanRemainingSlots} of ${FREE_PLAN_DOCUMENT_LIMIT} free cloud slots remain.`}
                </strong>
                <span>Upload enforcement now belongs to the backend edge function rather than just UI wording.</span>
              </li>
            </ul>
          </div>

          <div className="side-card">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Next actions</p>
                <h3>Keep the pressure visible.</h3>
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
          </div>

          <div className="side-card">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Access trail</p>
                <h3>Protected actions stay auditable.</h3>
              </div>
            </div>
            <ul className="note-list">
              <li>
                <strong>Metadata is browseable.</strong>
                <span>Category and status review should never imply unrestricted file ownership on the web.</span>
              </li>
              <li>
                <strong>Protected actions are short-lived.</strong>
                <span>Preview and download should re-check access instead of behaving like permanent public links.</span>
              </li>
              <li>
                <strong>Suspicious patterns should be reviewable.</strong>
                <span>The audit-log function remains the code-owned place to centralize those sensitive events.</span>
              </li>
            </ul>
          </div>

          <div className="side-card">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Devices</p>
                <h3>{activeDeviceCount} active devices</h3>
              </div>
              <span className="mini-pill">{sessionLoading ? "Checking session" : signedIn ? "Live auth" : "Signed out"}</span>
            </div>
            <div className="button-row">
              <button className="button secondary small" onClick={() => void onRegisterBrowser()} type="button">
                Register browser
              </button>
              <button className="button secondary small" onClick={() => void onRefreshDevices()} type="button">
                Refresh
              </button>
            </div>
            {devicesLoading ? <p className="inline-feedback">Loading device state...</p> : null}
            <div className="device-list">
              {devices.map((device) => (
                <div className="device-card" key={device.id}>
                  <div>
                    <strong>{device.name}</strong>
                    <p>
                      {device.platform} • last seen {device.lastSeen}
                    </p>
                  </div>
                  <div className="device-actions">
                    <span className="status-pill neutral">{device.locked ? "Locked" : "Active"}</span>
                    <button
                      className="button secondary small"
                      onClick={() => void onDeviceLock(device.id, !device.locked)}
                      type="button"
                    >
                      {device.locked ? "Unlock" : "Lock"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {deviceAction.message ? <p className="inline-feedback">{deviceAction.message}</p> : null}
          </div>
        </aside>
      </section>
    </>
  );
}

type InfoPageProps = {
  body: string;
  eyebrow: string;
  onPrimary: () => void;
  primaryLabel: string;
  secondary: string;
  title: string;
};

function InfoPage({ body, eyebrow, onPrimary, primaryLabel, secondary, title }: InfoPageProps) {
  return (
    <section className="info-page">
      <div className="info-page-card">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="lede">{body}</p>
        <p className="section-text">{secondary}</p>
        <div className="button-row">
          <button className="button primary" onClick={onPrimary} type="button">
            {primaryLabel}
          </button>
        </div>
      </div>
    </section>
  );
}

type ContactPageProps = {
  contactEmail: string;
  contactLoading: boolean;
  contactMessage: string;
  contactName: string;
  contactStatus: string | null;
  contactSubject: string;
  onContactEmailChange: (value: string) => void;
  onContactMessageChange: (value: string) => void;
  onContactNameChange: (value: string) => void;
  onContactSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onContactSubjectChange: (value: string) => void;
  onPrimary: () => void;
  primaryLabel: string;
  sessionEmail: string | null;
};

function ContactPage({
  contactEmail,
  contactLoading,
  contactMessage,
  contactName,
  contactStatus,
  contactSubject,
  onContactEmailChange,
  onContactMessageChange,
  onContactNameChange,
  onContactSubmit,
  onContactSubjectChange,
  onPrimary,
  primaryLabel,
  sessionEmail
}: ContactPageProps) {
  return (
    <section className="info-page contact-page">
      <div className="contact-page-grid">
        <div className="info-page-card contact-intro-card">
          <p className="eyebrow">Contact</p>
          <h1>Reach the team without digging.</h1>
          <p className="lede">
            Use this form for support, product questions, access problems, and early feedback. Messages land in Supabase
            so the app can stay cloud-backed without pretending email is a fake button.
          </p>
          <p className="section-text">
            {sessionEmail
              ? `You are signed in as ${sessionEmail}. That address can be reused below, or you can send from a different one.`
              : "Signed-out users can still contact the team. Authenticated users can send from their logged-in address or a different one."}
          </p>
          <ul className="note-list">
            <li>
              <strong>Use it for real product issues.</strong>
              <span>Support, billing, access, and trust questions all belong here.</span>
            </li>
            <li>
              <strong>Keep the message specific.</strong>
              <span>Include the feature, device, or account state that needs attention.</span>
            </li>
            <li>
              <strong>Responses stay human.</strong>
              <span>The form creates a queueable record instead of a dead-end mailto link.</span>
            </li>
          </ul>
          <div className="button-row">
            <button className="button secondary" onClick={onPrimary} type="button">
              {primaryLabel}
            </button>
          </div>
        </div>

        <div className="side-card contact-form-card">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Send a message</p>
              <h3>We'll route it from the portal.</h3>
            </div>
            <span className="mini-pill">Supabase-backed</span>
          </div>

          <form className="auth-form contact-form" onSubmit={(event) => void onContactSubmit(event)}>
            <label className="field">
              <span>Name</span>
              <input
                autoComplete="name"
                onChange={(event) => onContactNameChange(event.target.value)}
                placeholder="Your name"
                type="text"
                value={contactName}
              />
            </label>

            <label className="field">
              <span>Email</span>
              <input
                autoComplete="email"
                onChange={(event) => onContactEmailChange(event.target.value)}
                placeholder="you@example.com"
                type="email"
                value={contactEmail}
              />
            </label>

            <label className="field">
              <span>Subject</span>
              <input
                onChange={(event) => onContactSubjectChange(event.target.value)}
                placeholder="What do you need help with?"
                type="text"
                value={contactSubject}
              />
            </label>

            <label className="field">
              <span>Message</span>
              <textarea
                onChange={(event) => onContactMessageChange(event.target.value)}
                placeholder="Give us the context, the problem, and what you were trying to do."
                rows={7}
                value={contactMessage}
              />
            </label>

            <button className="button primary block" disabled={contactLoading} type="submit">
              {contactLoading ? "Sending..." : "Send message"}
            </button>
          </form>

          <p className="support-copy">
            We use the same portal language here: cloud-backed, explicit, and never pretending the web is local-only.
          </p>
          {contactStatus ? <p className="inline-feedback">{contactStatus}</p> : null}
        </div>
      </div>
    </section>
  );
}
