import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { prototypeSnapshot } from "@doc-wallet/config";
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

type AuthMode = "password" | "magic";
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
  const [authMode, setAuthMode] = useState<AuthMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [devices, setDevices] = useState<DeviceRecord[]>(prototypeSnapshot.devices);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [deviceAction, setDeviceAction] = useState<DeviceActionState>({ loading: false, message: null });

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

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!configured) {
      setAuthMessage("Connect Supabase in apps/web/.env.local to enable live sign-in.");
      return;
    }

    setAuthLoading(true);
    setAuthMessage(null);

    if (authMode === "magic") {
      const { error } = await client.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      setAuthLoading(false);
      setAuthMessage(error ? error.message : "Magic link sent. Check your email to continue.");
      return;
    }

    const { error } = await client.auth.signInWithPassword({
      email,
      password
    });

    setAuthLoading(false);

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setPassword("");
    setAuthMessage("Signed in. Opening your dashboard.");
    navigate("/");
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

  async function handleRegisterBrowser() {
    if (!configured || !session) {
      setDeviceAction({
        loading: false,
        message: "Demo mode only. Add Supabase credentials to enable live device registration."
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

  const selectedGroup = findLauncherGroup(selectedGroupId);
  const selectedGroupDocs = useMemo(
    () => getGroupTemplates(selectedGroup, prototypeSnapshot.templates),
    [selectedGroup]
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

  return (
    <main className="app-shell">
      <header className="site-topbar">
        <button className="brand-lockup" onClick={() => navigate("/")} type="button">
          <span className="brand-orb" />
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
        <InfoPage
          eyebrow="Contact"
          title="Reach the team without digging."
          body="Use this page for support, product questions, or early access conversations. In the real product this would route to a contact form, support inbox, and security contact path."
          secondary="For the current prototype, the important thing is structural: Contact lives as its own route instead of being shoved into the app shell."
          onPrimary={() => navigate("/")}
          primaryLabel={session ? "Return to dashboard" : "Return to home"}
        />
      ) : null}

      {route === "/" && !session ? (
        <PublicHome
          authLoading={authLoading}
          authMessage={authMessage}
          authMode={authMode}
          configured={configured}
          email={email}
          onAuthModeChange={setAuthMode}
          onEmailChange={setEmail}
          onGroupSelect={setSelectedGroupId}
          onPasswordChange={setPassword}
          onSignIn={handleSignIn}
          password={password}
          selectedGroup={selectedGroup}
          selectedGroupDocs={selectedGroupDocs}
          uploadedCount={uploadedCount}
        />
      ) : null}

      {route === "/" && session ? (
        <DashboardHome
          activeDeviceCount={activeDeviceCount}
          deviceAction={deviceAction}
          devices={devices}
          devicesLoading={devicesLoading}
          missingCount={missingCount}
          nextActionDocs={nextActionDocs}
          onDeviceLock={handleDeviceLock}
          onGroupSelect={setSelectedGroupId}
          onRefreshDevices={loadDevices}
          onRegisterBrowser={handleRegisterBrowser}
          selectedGroup={selectedGroup}
          selectedGroupDocs={selectedGroupDocs}
          session={session}
          sessionLoading={sessionLoading}
          signedIn={Boolean(session)}
          savedInSelectedGroup={savedInSelectedGroup}
          uploadedCount={uploadedCount}
          urgentCount={urgentCount}
        />
      ) : null}
    </main>
  );
}

type PublicHomeProps = {
  authLoading: boolean;
  authMessage: string | null;
  authMode: AuthMode;
  configured: boolean;
  email: string;
  onAuthModeChange: (mode: AuthMode) => void;
  onEmailChange: (value: string) => void;
  onGroupSelect: (id: LauncherGroupId) => void;
  onPasswordChange: (value: string) => void;
  onSignIn: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  password: string;
  selectedGroup: LauncherGroup;
  selectedGroupDocs: DocumentTemplate[];
  uploadedCount: number;
};

function PublicHome({
  authLoading,
  authMessage,
  authMode,
  configured,
  email,
  onAuthModeChange,
  onEmailChange,
  onGroupSelect,
  onPasswordChange,
  onSignIn,
  password,
  selectedGroup,
  selectedGroupDocs,
  uploadedCount
}: PublicHomeProps) {
  return (
    <>
      <section className="launcher-hero">
        <div className="hero-copy-card">
          <p className="eyebrow">Locked preview</p>
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
                <h3>Sign in to open your dashboard.</h3>
              </div>
              <span className="mini-pill">{configured ? "Live auth" : "Demo mode"}</span>
            </div>

            <form className="auth-form" onSubmit={(event) => void onSignIn(event)}>
              <div className="segmented-control" role="tablist" aria-label="Sign-in mode">
                <button
                  className={`segment${authMode === "password" ? " active" : ""}`}
                  onClick={() => onAuthModeChange("password")}
                  type="button"
                >
                  Password
                </button>
                <button
                  className={`segment${authMode === "magic" ? " active" : ""}`}
                  onClick={() => onAuthModeChange("magic")}
                  type="button"
                >
                  Magic link
                </button>
              </div>

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

              {authMode === "password" ? (
                <label className="field">
                  <span>Password</span>
                  <input
                    autoComplete="current-password"
                    onChange={(event) => onPasswordChange(event.target.value)}
                    placeholder="Enter your password"
                    type="password"
                    value={password}
                  />
                </label>
              ) : null}

              <button className="button primary block" disabled={authLoading} type="submit">
                {authLoading ? "Working..." : authMode === "password" ? "Sign in" : "Send magic link"}
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
  deviceAction: DeviceActionState;
  devices: DeviceRecord[];
  devicesLoading: boolean;
  missingCount: number;
  nextActionDocs: DocumentTemplate[];
  onDeviceLock: (deviceId: string, shouldLock: boolean) => Promise<void>;
  onGroupSelect: (id: LauncherGroupId) => void;
  onRefreshDevices: () => Promise<void>;
  onRegisterBrowser: () => Promise<void>;
  savedInSelectedGroup: number;
  selectedGroup: LauncherGroup;
  selectedGroupDocs: DocumentTemplate[];
  session: Session;
  sessionLoading: boolean;
  signedIn: boolean;
  uploadedCount: number;
  urgentCount: number;
};

function DashboardHome({
  activeDeviceCount,
  deviceAction,
  devices,
  devicesLoading,
  missingCount,
  nextActionDocs,
  onDeviceLock,
  onGroupSelect,
  onRefreshDevices,
  onRegisterBrowser,
  savedInSelectedGroup,
  selectedGroup,
  selectedGroupDocs,
  session,
  sessionLoading,
  signedIn,
  uploadedCount,
  urgentCount
}: DashboardHomeProps) {
  return (
    <>
      <section className="dashboard-hero">
        <div className="hero-copy-card">
          <p className="eyebrow">Dashboard</p>
          <h1>Your document launcher is now the home screen.</h1>
          <p className="lede">
            Categories are the primary navigation layer. Document actions stay smaller, status-aware, and easy to scan
            without competing with the main grid.
          </p>
        </div>

        <div className="hero-summary-card">
          <p className="eyebrow">Signed in</p>
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
        </div>
      </section>

      <section className="dashboard-layout">
        <section className="dashboard-main">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Categories</p>
              <h2>Larger tiles lead the interaction.</h2>
            </div>
            <p className="section-support">Mobile uses a 2-up grid, then expands to a cleaner desktop grid without stretching the cards into soup.</p>
          </div>

          <div className="launcher-grid">
            {launcherGroups.map((group) => (
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
                <button className={`document-action status-${template.status}`} key={template.id} type="button">
                  <div>
                    <strong>{template.title}</strong>
                    <p>{template.note ?? template.helper}</p>
                  </div>
                  <span className={`status-pill status-${template.status}`}>{statusTone[template.status]}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <aside className="dashboard-side">
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
