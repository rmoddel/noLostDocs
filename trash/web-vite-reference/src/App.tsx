import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { FREE_PLAN_DOCUMENT_LIMIT, prototypeSnapshot } from "@nolostdocs/config";
import { createNoLostDocsSupabaseClient } from "@nolostdocs/supabase";
import type { CategoryId, DeviceRecord, DocumentStatus, DocumentTemplate } from "@nolostdocs/types";

const { configured, client } = createNoLostDocsSupabaseClient({
  url: import.meta.env.VITE_SUPABASE_URL,
  publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
});

const statusTone: Record<DocumentStatus, string> = {
  uploaded: "Saved",
  "expiring-soon": "Soon",
  missing: "Missing",
  expired: "Expired"
};

type AppRoute = "/" | "/login" | "/dashboard" | "/scan" | "/security" | "/contact";
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
  if (pathname === "/login") return "/login";
  if (pathname === "/dashboard") return "/dashboard";
  if (pathname === "/scan") return "/scan";
  if (pathname === "/security" || pathname === "/about") return "/security";
  if (pathname === "/contact") return "/contact";
  return "/";
}

function findLauncherGroup(id: LauncherGroupId) {
  return launcherGroups.find((group) => group.id === id) ?? launcherGroups[0];
}

function getGroupTemplates(group: LauncherGroup, templates: DocumentTemplate[]) {
  return templates.filter((template) => group.categories.includes(template.category));
}

function getUserDisplayName(session: Session | null) {
  if (!session) {
    return null;
  }

  const metadataName = session.user.user_metadata?.full_name;
  if (typeof metadataName === "string" && metadataName.trim()) {
    return metadataName.trim();
  }

  return session.user.email ?? null;
}

function getFileExtension(fileName: string, mimeType: string) {
  const match = fileName.match(/\.([a-z0-9]+)$/i);
  if (match?.[1]) {
    return match[1].toLowerCase();
  }

  if (mimeType.includes("jpeg")) return "jpg";
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("heic")) return "heic";
  return "jpg";
}

function buildDisplayFileName(baseName: string) {
  return baseName.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "scan";
}

async function rotateImageFile(file: File, rotation: number) {
  const angle = ((rotation % 360) + 360) % 360;
  const blobUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Unable to load the selected image."));
      img.src = blobUrl;
    });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas is not available in this browser.");
    }

    const swapDimensions = angle === 90 || angle === 270;
    canvas.width = swapDimensions ? image.height : image.width;
    canvas.height = swapDimensions ? image.width : image.height;

    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate((angle * Math.PI) / 180);
    context.drawImage(image, -image.width / 2, -image.height / 2);

    const mimeType = file.type || "image/jpeg";

    const rotatedBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Unable to process the scan image."));
          return;
        }

        resolve(blob);
      }, mimeType, 0.95);
    });

    return new File([rotatedBlob], file.name, { type: mimeType, lastModified: Date.now() });
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

export function App() {
  const [route, setRoute] = useState<AppRoute>(() => normalizeRoute(window.location.pathname));
  const [selectedGroupId, setSelectedGroupId] = useState<LauncherGroupId>("basic");
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(configured);
  const [email, setEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
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
  const userDisplayName = getUserDisplayName(session);

  useEffect(() => {
    const onPopState = () => setRoute(normalizeRoute(window.location.pathname));
    window.addEventListener("popstate", onPopState);

    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (session && route === "/login") {
      setRoute("/dashboard");
      window.history.replaceState({}, "", "/dashboard");
    }

    if (!session && (route === "/dashboard" || route === "/scan")) {
      setRoute("/login");
      window.history.replaceState({}, "", "/login");
    }
  }, [route, session]);

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

    setContactEmail((current) => (current ? current : session.user.email ?? ""));
    const fullName = getUserDisplayName(session) ?? "";
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
    setMenuOpen(false);
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
      setPreferenceMessage("Using local dashboard visibility until preferences are ready.");
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
      setAuthMessage("Login is not connected yet.");
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

    setAuthMessage("Check your email for the link.");
    navigate("/login");
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
      setContactStatus("Messages can't be sent yet.");
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
        message: "Device setup isn't connected yet."
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
        message: `${baseMessage} The download flow isn't connected yet.`
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
          <img alt="NoLostDocs" aria-hidden="true" className="brand-mark" src="/navbar-logo-transparent.png" />
        </button>

        <div className="topbar-actions">
          <button
            className="button secondary small"
            onClick={() => navigate(session ? "/dashboard" : "/login")}
            type="button"
          >
            {session ? "Open dashboard" : "Get started"}
          </button>
          <button
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="menu-toggle"
            onClick={() => setMenuOpen((current) => !current)}
            type="button"
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        {menuOpen ? (
          <div className="site-drawer" role="dialog" aria-label="Site menu">
            <div className="drawer-card">
              {session ? (
                <div className="drawer-user">
                  <strong>{userDisplayName ?? "Signed in"}</strong>
                  <span>{session.user.email}</span>
                  <span>{getPlanLabel(accountPlan)}</span>
                </div>
              ) : (
                <div className="drawer-user">
                  <strong>Guest</strong>
                  <span>Use your email to continue.</span>
                </div>
              )}
              <div className="drawer-links">
                <button className="drawer-link" onClick={() => navigate("/")} type="button">
                  Home
                </button>
                <button className="drawer-link" onClick={() => navigate("/security")} type="button">
                  Security
                </button>
                <button className="drawer-link" onClick={() => navigate("/contact")} type="button">
                  Contact
                </button>
                {session ? (
                  <>
                    <button className="drawer-link" onClick={() => navigate("/dashboard")} type="button">
                      Dashboard
                    </button>
                    <button className="drawer-link" onClick={() => navigate("/scan")} type="button">
                      Scan
                    </button>
                    <button
                      className="drawer-link"
                      onClick={() => {
                        setMenuOpen(false);
                        void handleSignOut();
                      }}
                      type="button"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <button className="drawer-link" onClick={() => navigate("/login")} type="button">
                    Login
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </header>

      {route === "/security" ? (
        <SecurityPage onPrimary={() => navigate(session ? "/dashboard" : "/login")} />
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
          primaryLabel="Back home"
          sessionEmail={session?.user.email ?? null}
        />
      ) : null}

      {route === "/login" ? (
        <LoginPage
          authLoading={authLoading}
          authMessage={authMessage}
          configured={configured}
          email={email}
          onEmailChange={setEmail}
          onSignIn={handleSignIn}
        />
      ) : null}

      {route === "/" ? (
        <PublicHome
          onPrimary={() => navigate("/login")}
          onSecondary={() => navigate("/security")}
        />
      ) : null}

      {route === "/dashboard" && session ? (
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
          onOpenScan={() => navigate("/scan")}
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

      {route === "/scan" && session ? (
        <ScanPage
          configured={configured}
          onBack={() => navigate("/dashboard")}
          selectedGroup={selectedGroup}
          session={session}
        />
      ) : null}

      <footer className="site-footer">
        <img alt="NoLostDocs" className="footer-brand-image" src="/transparent_slogan.png" />
        <div className="footer-links">
          <button className="footer-link" onClick={() => navigate("/")} type="button">
            Home
          </button>
          <button className="footer-link" onClick={() => navigate("/security")} type="button">
            Security
          </button>
          <button className="footer-link" onClick={() => navigate("/contact")} type="button">
            Contact
          </button>
          <button className="footer-link" onClick={() => navigate(session ? "/dashboard" : "/login")} type="button">
            {session ? "Dashboard" : "Login"}
          </button>
        </div>
      </footer>
    </main>
  );
}

type PublicHomeProps = {
  onPrimary: () => void;
  onSecondary: () => void;
};

function PublicHome({ onPrimary, onSecondary }: PublicHomeProps) {
  return (
    <>
      <section className="landing-hero">
        <div className="hero-copy-card">
          <p className="eyebrow">NoLostDocs</p>
          <h1>No more lost docs.</h1>
          <p className="lede">
            Securely store, organize, and find your important documents - license, insurance, registration, medical cards,
            and more - all in one place.
          </p>
          <div className="button-row">
            <button className="button primary" onClick={onPrimary} type="button">
              Get Started
            </button>
            <button className="button secondary" onClick={onSecondary} type="button">
              See how it works
            </button>
          </div>
        </div>

        <div className="hero-summary-card hero-visual-card">
          <div className="visual-stack">
            {launcherGroups.map((group) => (
              <div className="visual-card" key={group.id}>
                <strong>{group.title}</strong>
                <span>{group.description}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Documents</p>
            <h2>Category cards that map to real life.</h2>
          </div>
        </div>
        <div className="launcher-grid">
          {launcherGroups.map((group) => (
            <article className="launcher-card" key={group.id}>
              <strong>{group.title}</strong>
              <p>{group.description}</p>
              <small>{group.helper}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Security</p>
            <h2>Built for documents you don't want floating around.</h2>
          </div>
        </div>
        <div className="trust-strip">
          <article className="trust-card">
            <p>Private storage keeps files behind your account.</p>
          </article>
          <article className="trust-card">
            <p>Sign in protects web access and recovery flows.</p>
          </article>
          <article className="trust-card">
            <p>Remote lock helps when a device goes missing.</p>
          </article>
        </div>
      </section>

      <section className="landing-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Lost phone</p>
              <h2>Lock your account from here.</h2>
            </div>
          </div>
        <div className="trust-strip">
          <article className="trust-card">
            <p>Lock the device and stop access until it is re-authorized.</p>
          </article>
          <article className="trust-card">
            <p>Digital copies help with access. Acceptance still depends on the situation.</p>
          </article>
          <article className="trust-card">
            <p>Cloud-backed web access is explicit. Local-only behavior is not implied.</p>
          </article>
        </div>
      </section>

      <section className="landing-section">
        <div className="trust-strip">
          <article className="trust-card">
            <p>NoLostDocs helps you keep secure copies organized. Acceptance of digital copies depends on the situation,
            provider, agency, or law.</p>
          </article>
          <article className="trust-card">
            <p>Save. Scan. Search. Recover.</p>
          </article>
          <article className="trust-card">
            <button className="button primary block" onClick={onPrimary} type="button">
              Get Started
            </button>
          </article>
        </div>
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
  onOpenScan: () => void;
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
  onOpenScan,
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
          <h1>Documents and devices.</h1>
          <p className="lede">
            {accountPlan === "premium"
              ? "Premium unlocks every group and keeps protected actions available."
              : "Free Basic keeps the core group and login access available."}
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
              ? "Email recovery stays enabled."
              : `Free Basic keeps ${FREE_PLAN_DOCUMENT_LIMIT} saved cloud documents in the core group.`}
          </p>
          {accountMessage ? <p className="inline-feedback">{accountMessage}</p> : null}
        </div>
      </section>

      <section className="dashboard-layout">
        <section className="dashboard-main">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Categories</p>
              <h2>Categories.</h2>
            </div>
            <p className="section-support">Categories lead. Documents stay secondary.</p>
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

          <div className="side-card">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Scan</p>
                <h3>Capture a new document.</h3>
              </div>
            </div>
            <p className="section-support">Use the bank-style scan flow to capture a document.</p>
            <button className="button primary block" onClick={onOpenScan} type="button">
              Start scan
            </button>
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
              <p className="section-support">Premium expands the dashboard beyond Basic.</p>
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
                <span>Use your email to continue when you need access again.</span>
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
                <span>Upload limits are enforced before a new file is saved.</span>
              </li>
            </ul>
          </div>

          <div className="side-card">
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
          </div>

          <div className="side-card">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Access trail</p>
                <h3>Access trail.</h3>
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
          <h1>Send a message.</h1>
          <p className="lede">Messages are saved for follow-up.</p>
          <p className="section-text">
            {sessionEmail
              ? `Signed in as ${sessionEmail}.`
              : "Send from any email address."}
          </p>
          <ul className="note-list">
            <li>
              <strong>Support</strong>
              <span>Billing, access, and trust questions.</span>
            </li>
            <li>
              <strong>Be specific</strong>
              <span>Include the feature, device, or account state.</span>
            </li>
            <li>
              <strong>Tracked</strong>
              <span>The message is saved for follow-up.</span>
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
              <p className="eyebrow">Message</p>
              <h3>Send your message.</h3>
            </div>
          </div>

          <form className="auth-form contact-form" onSubmit={(event) => void onContactSubmit(event)}>
            <label className="field">
              <span>Name</span>
              <input
                autoComplete="name"
                onChange={(event) => onContactNameChange(event.target.value)}
                type="text"
                value={contactName}
              />
            </label>

            <label className="field">
              <span>Email</span>
              <input
                autoComplete="email"
                onChange={(event) => onContactEmailChange(event.target.value)}
                type="email"
                value={contactEmail}
              />
            </label>

            <label className="field">
              <span>Subject</span>
              <input
                onChange={(event) => onContactSubjectChange(event.target.value)}
                type="text"
                value={contactSubject}
              />
            </label>

            <label className="field">
              <span>Message</span>
              <textarea
                onChange={(event) => onContactMessageChange(event.target.value)}
                rows={7}
                value={contactMessage}
              />
            </label>

            <button className="button primary block" disabled={contactLoading} type="submit">
              {contactLoading ? "Sending..." : "Send message"}
            </button>
          </form>

          <p className="support-copy">
            Messages are saved with your account.
          </p>
          {contactStatus ? <p className="inline-feedback">{contactStatus}</p> : null}
        </div>
      </div>
    </section>
  );
}

type LoginPageProps = {
  authLoading: boolean;
  authMessage: string | null;
  configured: boolean;
  email: string;
  onEmailChange: (value: string) => void;
  onSignIn: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

function LoginPage({ authLoading, authMessage, configured, email, onEmailChange, onSignIn }: LoginPageProps) {
  return (
    <section className="info-page login-page">
      <div className="info-page-card login-card">
        <p className="eyebrow">Login</p>
        <h1>Use your email to continue.</h1>
        <p className="section-text">We will email a link to your inbox.</p>
        <form className="auth-form" onSubmit={(event) => void onSignIn(event)}>
          <label className="field">
            <span>Email</span>
            <input
              autoComplete="email"
              onChange={(event) => onEmailChange(event.target.value)}
              type="email"
              value={email}
            />
          </label>
          <button className="button primary block" disabled={authLoading} type="submit">
            {authLoading ? "Sending..." : "Continue"}
          </button>
        </form>
        <p className="support-copy">{configured ? "Email access is ready." : "Login will be ready soon."}</p>
        {authMessage ? <p className="inline-feedback">{authMessage}</p> : null}
      </div>
    </section>
  );
}

type SecurityPageProps = {
  onPrimary: () => void;
};

function SecurityPage({ onPrimary }: SecurityPageProps) {
  return (
    <section className="info-page security-page">
        <div className="info-page-card">
          <p className="eyebrow">Security</p>
          <h1>Built for documents you don't want floating around.</h1>
          <div className="trust-strip">
            <article className="trust-card">
              <p>Private storage keeps files behind your account.</p>
            </article>
            <article className="trust-card">
              <p>Signed-in access protects your account.</p>
            </article>
            <article className="trust-card">
              <p>Device lock and re-authorization are built in.</p>
            </article>
          </div>
        <div className="button-row">
          <button className="button primary" onClick={onPrimary} type="button">
            Continue
          </button>
        </div>
      </div>
    </section>
  );
}

type ScanPageProps = {
  configured: boolean;
  onBack: () => void;
  selectedGroup: LauncherGroup;
  session: Session;
};

function ScanPage({ configured, onBack, selectedGroup, session }: ScanPageProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [scanTitle, setScanTitle] = useState("New scan");
  const [saving, setSaving] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setScanMessage(null);
    setRotation(0);
    setFile(nextFile);
  }

  async function handleSave() {
    if (!file) {
      setScanMessage("Choose a document image first.");
      return;
    }

    if (!configured) {
      setScanMessage("Scan saving is not ready yet.");
      return;
    }

    setSaving(true);
    setScanMessage(null);

    try {
      const rotatedFile = rotation ? await rotateImageFile(file, rotation) : file;
      const safeTitle = buildDisplayFileName(scanTitle);
      const uploadResponse = await client.functions.invoke("create-signed-upload", {
        body: {
          documentTitle: scanTitle,
          fileName: rotatedFile.name,
          mimeType: rotatedFile.type,
          safeTitle
        }
      });

      if (uploadResponse.error) {
        throw new Error(uploadResponse.error.message);
      }

      const payload = uploadResponse.data as {
        path: string;
        token: string;
        message?: string;
      } | null;

      if (!payload?.path || !payload.token) {
        throw new Error("Upload authorization failed.");
      }

      const uploadResult = await client.storage
        .from("user-documents")
        .uploadToSignedUrl(payload.path, payload.token, rotatedFile, {
          contentType: rotatedFile.type || "image/jpeg",
          upsert: true
        });

      if (uploadResult.error) {
        throw new Error(uploadResult.error.message);
      }

      const { data: documentRow, error: documentError } = await client
        .from("documents")
        .insert({
          user_id: session.user.id,
          title: scanTitle,
          description: `Captured from ${selectedGroup.title}`,
          status: "uploaded",
          metadata: {
            scan: true,
            category: selectedGroup.id,
            source: "web-scan"
          }
        })
        .select("id")
        .single();

      if (documentError) {
        throw new Error(documentError.message);
      }

      const fileInsert = await client.from("document_files").insert({
        document_id: documentRow.id,
        user_id: session.user.id,
        storage_bucket: "user-documents",
        storage_path: payload.path,
        local_only: false,
        mime_type: rotatedFile.type || "image/jpeg",
        size_bytes: rotatedFile.size,
        encryption_version: "v1"
      });

      if (fileInsert.error) {
        throw new Error(fileInsert.error.message);
      }

      setScanMessage("Scan saved.");
      setFile(null);
      setRotation(0);
      onBack();
    } catch (error) {
      setScanMessage(error instanceof Error ? error.message : "Scan save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="info-page scan-page">
      <div className="scan-shell">
        <div className="info-page-card scan-intro-card">
          <p className="eyebrow">Scan</p>
          <h1>Capture it like a bank deposit.</h1>
          <p className="section-text">Use your camera or an image file. Rotate, review, then save it to your account.</p>
          <div className="button-row">
            <button className="button secondary" onClick={onBack} type="button">
              Back to dashboard
            </button>
          </div>
        </div>

        <div className="side-card scan-card">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Capture</p>
              <h3>{scanTitle}</h3>
            </div>
            <span className="mini-pill">{selectedGroup.title}</span>
          </div>

          <label className="field">
            <span>Scan name</span>
            <input onChange={(event) => setScanTitle(event.target.value)} type="text" value={scanTitle} />
          </label>

          <label className="scan-dropzone" htmlFor="scan-file">
            <input
              accept="image/*"
              capture="environment"
              id="scan-file"
              onChange={(event) => void handleFileChange(event)}
              type="file"
            />
            <strong>{file ? file.name : "Tap to take a photo or choose a file"}</strong>
            <span>Front-lit, flat, and within the frame works best.</span>
          </label>

          {previewUrl ? (
            <div className="scan-preview">
              <img alt="Scan preview" src={previewUrl} style={{ transform: `rotate(${rotation}deg)` }} />
            </div>
          ) : null}

          <div className="button-row">
            <button className="button secondary small" disabled={!file || saving} onClick={() => setRotation((r) => r + 90)} type="button">
              Rotate
            </button>
            <button className="button secondary small" disabled={!file || saving} onClick={() => setFile(null)} type="button">
              Retake
            </button>
            <button className="button primary small" disabled={!file || saving} onClick={() => void handleSave()} type="button">
              {saving ? "Saving..." : "Save scan"}
            </button>
          </div>

          {scanMessage ? <p className="inline-feedback">{scanMessage}</p> : null}
        </div>
      </div>
    </section>
  );
}
