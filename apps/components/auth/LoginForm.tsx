"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { buildAuthCallbackUrl } from "@/lib/auth/getAuthRedirectUrl";
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

    const redirectUrl = typeof window === "undefined" ? "" : buildAuthCallbackUrl(nextPath);
    const { errorMessage } = await signInWithOtp(trimmedEmail, redirectUrl);

    setLoading(false);

    if (errorMessage) {
      setMessage(errorMessage);
      return;
    }

    setMessage("Check your email for a secure sign-in link.");
  }

  return (
    <section className="page-section">
      <Card className="content-card compact-card">
        <p className="eyebrow">Sign in</p>
        <h1>Sign in to NoLostDocs.</h1>
        <p className="section-copy">
          Use an email sign-in link to access the protected workspace. Signed-out users who request protected routes are returned here first.
        </p>
        <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
          <label className="field">
            <span>Email address</span>
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email address"
              type="email"
              value={email}
            />
          </label>
          <Button disabled={loading} type="submit">
            {loading ? "Sending..." : "Send sign-in link"}
          </Button>
        </form>
        <p className="support-copy">
          {configured
            ? "Email sign-in is available."
            : "Sign-in is not enabled yet."}
        </p>
        {message ? <p className="inline-feedback">{message}</p> : null}
      </Card>
    </section>
  );
}
