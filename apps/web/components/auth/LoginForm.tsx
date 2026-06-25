"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

type LoginFormProps = {
  nextPath: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const { configured, ready, session, signInWithOtp } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && session) {
      router.replace(nextPath);
    }
  }, [nextPath, ready, router, session]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setMessage("Enter the email address you want to use.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const redirectUrl =
      typeof window === "undefined"
        ? ""
        : `${window.location.origin}${nextPath.startsWith("/") ? nextPath : "/dashboard"}`;
    const { errorMessage } = await signInWithOtp(trimmedEmail, redirectUrl);

    setLoading(false);

    if (errorMessage) {
      setMessage(errorMessage);
      return;
    }

    setMessage("Check your email for the sign-in link.");
  }

  return (
    <section className="page-section">
      <Card className="content-card compact-card">
        <p className="eyebrow">Login</p>
        <h1>Use your email to continue.</h1>
        <p className="section-copy">
          Use the sign-in link to open your protected workspace. Signed-out users who open secure routes are returned here first.
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
            {loading ? "Sending..." : "Continue with email"}
          </Button>
        </form>
        <p className="support-copy">
          {configured ? "Login is ready to send sign-in links." : "Add your public backend values locally to activate login."}
        </p>
        {message ? <p className="inline-feedback">{message}</p> : null}
      </Card>
    </section>
  );
}
