"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { buildAuthCallbackUrl } from "@/lib/auth/getAuthRedirectUrl";
import { useAuth } from "./AuthProvider";

type LoginFormProps = {
  initialMessage?: string | null;
  mode: "create" | "signin";
  nextPath: string;
};

export function LoginForm({ initialMessage = null, mode, nextPath }: LoginFormProps) {
  const router = useRouter();
  const { configured, ready, session, signInWithPassword, signUpWithPassword } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState<string | null>(initialMessage);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && session) {
      router.replace(nextPath);
    }
  }, [nextPath, ready, router, session]);

  useEffect(() => {
    setMessage(initialMessage);
  }, [initialMessage]);

  async function handleCreateAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim();
    const trimmedName = fullName.trim();

    if (!trimmedName) {
      setMessage("Enter your full name.");
      return;
    }

    if (!trimmedEmail) {
      setMessage("Enter the email address for your account.");
      return;
    }

    if (!password.trim()) {
      setMessage("Create a password.");
      return;
    }

    if (!consent) {
      setMessage("Please agree to continue.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const redirectUrl = typeof window === "undefined" ? "" : buildAuthCallbackUrl(nextPath);
    const { errorMessage } = await signUpWithPassword({
      email: trimmedEmail,
      fullName: trimmedName,
      password,
      redirectTo: redirectUrl
    });

    setLoading(false);

    if (errorMessage) {
      setMessage(errorMessage);
      return;
    }

    setMessage("Check your email to confirm your account.");
  }

  async function handlePasswordSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setMessage("Enter the email address associated with your account.");
      return;
    }

    if (!password.trim()) {
      setMessage("Enter your password.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const { errorMessage } = await signInWithPassword({
      email: trimmedEmail,
      password
    });

    setLoading(false);

    if (errorMessage) {
      setMessage(errorMessage);
      return;
    }

    router.replace(nextPath);
  }

  return (
    <div className="login-shell">
      <section className="login-card">
        <div className="login-copy">
          <p className="login-eyebrow">{mode === "create" ? "Create account" : "Sign in"}</p>
          <h1>{mode === "create" ? "Create your account" : "Sign in to NoLostDocs"}</h1>
          <p className="login-lede">
            {mode === "create"
              ? "Start with a private records space for the important papers you always need to find."
              : "Sign in with your email and password to open the protected records view and continue to your workspace."}
          </p>
        </div>

        {mode === "create" ? (
          <>
            <form className="login-form" onSubmit={(event) => void handleCreateAccount(event)}>
              <label className="login-field">
                <span>Full name</span>
                <input
                  autoComplete="name"
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Your full name"
                  type="text"
                  value={fullName}
                />
              </label>

              <label className="login-field">
                <span>Email address</span>
                <input
                  autoComplete="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                />
              </label>

              <label className="login-field">
                <span>Password</span>
                <input
                  autoComplete="new-password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create a password"
                  type="password"
                  value={password}
                />
              </label>

              <label className="login-consent">
                <input checked={consent} onChange={(event) => setConsent(event.target.checked)} type="checkbox" />
                <span>I agree to create a private NoLostDocs account.</span>
              </label>

              <button className="login-primary-button" disabled={!configured || loading} type="submit">
                {loading ? "Creating..." : "Create account"}
              </button>
            </form>
          </>
        ) : (
          <>
            <form className="login-form signin" onSubmit={(event) => void handlePasswordSignIn(event)}>
              <label className="login-field">
                <span>Email address</span>
                <input
                  autoComplete="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email address"
                  type="email"
                  value={email}
                />
              </label>
              <label className="login-field">
                <span>Password</span>
                <input
                  autoComplete="current-password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  type="password"
                  value={password}
                />
              </label>
              <button className="login-primary-button" disabled={!configured || loading} type="submit">
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </>
        )}

        {mode === "signin" ? <p><Link href="/forgot-password">Forgot your password?</Link></p> : null}

        <p className="login-fineprint">
          NoLostDocs helps keep secure copies organized. Acceptance of digital copies depends on the situation, provider,
          agency, or law.
        </p>

        {message ? <p className="login-feedback">{message}</p> : null}

        <p className="login-alt">
          {mode === "create" ? (
            <>
              Already have an account? <Link href={`/login?mode=signin&next=${encodeURIComponent(nextPath)}`}>Log in</Link>
            </>
          ) : (
            <>
              Need an account? <Link href={`/login?next=${encodeURIComponent(nextPath)}`}>Create one</Link>
            </>
          )}
        </p>
      </section>
    </div>
  );
}
