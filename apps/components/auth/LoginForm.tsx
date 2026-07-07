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

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M21.6 12.27c0-.74-.06-1.3-.18-1.87H12v3.34h5.49c-.11.83-.7 2.07-2 2.9l-.03.11 2.82 2.18.2.02c1.84-1.7 3.12-4.22 3.12-7.68Z" fill="#4285F4" />
      <path d="M12 22c2.62 0 4.82-.86 6.43-2.34l-3.07-2.38c-.82.56-1.92.95-3.36.95a5.82 5.82 0 0 1-5.48-4.02l-.1.01-2.94 2.27-.04.1A10 10 0 0 0 12 22Z" fill="#34A853" />
      <path d="M6.52 14.21A5.9 5.9 0 0 1 6.2 12c0-.77.14-1.51.36-2.21l-.01-.15-3-2.31-.1.05A10 10 0 0 0 2 12c0 1.61.39 3.14 1.05 4.5l3.47-2.29Z" fill="#FBBC05" />
      <path d="M12 6.18c1.82 0 3.05.79 3.76 1.45l2.74-2.67C16.81 3.35 14.62 2.4 12 2.4A9.99 9.99 0 0 0 3.05 9.59l3.46 2.7A5.9 5.9 0 0 1 12 6.18Z" fill="#EA4335" />
    </svg>
  );
}

export function LoginForm({ initialMessage = null, mode, nextPath }: LoginFormProps) {
  const router = useRouter();
  const { configured, ready, session, signInWithGoogle, signInWithOtp, signUpWithPassword } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(true);
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

  async function handleSendLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setMessage("Enter the email address associated with your account.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const redirectUrl = typeof window === "undefined" ? "" : buildAuthCallbackUrl(nextPath);
    const { errorMessage } = await signInWithOtp(trimmedEmail, redirectUrl);

    setLoading(false);

    if (errorMessage) {
      setMessage(errorMessage);
      return;
    }

    setMessage("Check your email for a secure sign-in link.");
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setMessage(null);

    const redirectUrl = typeof window === "undefined" ? "" : buildAuthCallbackUrl(nextPath);
    const { errorMessage } = await signInWithGoogle(redirectUrl);

    setLoading(false);

    if (errorMessage) {
      setMessage(errorMessage);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="login-copy">
          <p className="login-eyebrow">{mode === "create" ? "Create account" : "Sign in"}</p>
          <h1>{mode === "create" ? "Create your account" : "Sign in to NoLostDocs"}</h1>
          <p className="login-lede">
            {mode === "create"
              ? "Start with a private records space for the important papers you always need to find."
              : "Use an email link to open the protected records view and continue to your workspace."}
          </p>
        </div>

        {mode === "create" ? (
          <>
            <button className="login-google-button" disabled={!configured || loading} onClick={() => void handleGoogleSignIn()} type="button">
              <GoogleMark />
              Continue with Google
            </button>

            <div className="login-divider" aria-hidden="true">
              <span />
              <strong>OR SIGN UP WITH EMAIL</strong>
              <span />
            </div>

            <form className="login-form" onSubmit={(event) => void handleCreateAccount(event)}>
              <label className="login-field">
                <span>Full name</span>
                <input
                  autoComplete="name"
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Reuben Modell"
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

              <button className="login-primary-button" disabled={loading} type="submit">
                {loading ? "Creating..." : "Create account"}
              </button>
            </form>
          </>
        ) : (
          <form className="login-form signin" onSubmit={(event) => void handleSendLink(event)}>
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
            <button className="login-primary-button" disabled={loading} type="submit">
              {loading ? "Sending..." : "Send sign-in link"}
            </button>
          </form>
        )}

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
    </main>
  );
}
