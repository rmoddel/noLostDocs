"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

type LoginFormProps = {
  initialMessage?: string | null;
  nextPath: string;
};

export function LoginForm({ initialMessage = null, nextPath }: LoginFormProps) {
  const router = useRouter();
  const { configured, ready, session, signInWithOtp } = useAuth();
  const [email, setEmail] = useState("");
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setMessage("Enter the email address associated with your account.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const redirectUrl =
      typeof window === "undefined"
        ? ""
        : `${window.location.origin}/auth/callback?next=${encodeURIComponent(
            nextPath.startsWith("/") ? nextPath : "/dashboard"
          )}`;
    const { errorMessage } = await signInWithOtp(trimmedEmail, redirectUrl);

    setLoading(false);

    if (errorMessage) {
      setMessage(errorMessage);
      return;
    }

    setMessage("Check your email for the secure sign-in link to access or finish setting up your account.");
  }

  return (
    <section className="page-section">
      <Card className="content-card compact-card">
        <p className="eyebrow">Login</p>
        <h1>Secure account access.</h1>
        <p className="section-copy">
          Use an email sign-in link to access the protected workspace. Signed-out users who request secure routes are returned here first.
        </p>
        <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
          <label className="field">
            <span>Email</span>
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              type="email"
              value={email}
            />
          </label>
          <Button disabled={loading} type="submit">
            {loading ? "Sending..." : "Continue with secure email link"}
          </Button>
        </form>
        <p className="support-copy">
          {configured
            ? "Email sign-in is ready for this environment."
            : "Add the public backend values for this environment to activate account login."}
        </p>
        {message ? <p className="inline-feedback">{message}</p> : null}
      </Card>
    </section>
  );
}
