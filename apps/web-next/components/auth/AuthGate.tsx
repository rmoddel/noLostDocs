"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { Card } from "../ui/Card";

type AuthGateProps = {
  children: ReactNode;
  redirectTo: string;
};

export function AuthGate({ children, redirectTo }: AuthGateProps) {
  const router = useRouter();
  const { ready, session } = useAuth();

  useEffect(() => {
    if (ready && !session) {
      router.replace(`/login?next=${encodeURIComponent(redirectTo)}`);
    }
  }, [ready, redirectTo, router, session]);

  if (!ready || !session) {
    return (
      <section className="page-section">
        <Card className="content-card compact-card">
          <p className="eyebrow">Checking session</p>
          <h1>Preparing your signed-in view.</h1>
          <p className="section-copy">
            Protected routes in the Next app now verify session state before opening the portal surface.
          </p>
        </Card>
      </section>
    );
  }

  return <>{children}</>;
}
