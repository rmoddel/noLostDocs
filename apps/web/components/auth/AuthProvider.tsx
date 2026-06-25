"use client";

import type { Session } from "@supabase/supabase-js";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type AuthContextValue = {
  configured: boolean;
  ready: boolean;
  session: Session | null;
  signInWithOtp: (email: string, redirectTo: string) => Promise<{ errorMessage: string | null }>;
  signOut: () => Promise<{ errorMessage: string | null }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const { client, configured } = createBrowserSupabaseClient();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!configured);

  useEffect(() => {
    if (!configured) {
      setReady(true);
      return;
    }

    let active = true;

    client.auth.getSession().then(({ data }) => {
      if (!active) {
        return;
      }

      setSession(data.session ?? null);
      setReady(true);
    });

    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setReady(true);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [client, configured]);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      ready,
      session,
      async signInWithOtp(email: string, redirectTo: string) {
        if (!configured) {
          return { errorMessage: "Login is not connected yet." };
        }

        const { error } = await client.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: redirectTo
          }
        });

        return { errorMessage: error?.message ?? null };
      },
      async signOut() {
        if (!configured) {
          setSession(null);
          return { errorMessage: null };
        }

        const { error } = await client.auth.signOut();
        if (!error) {
          setSession(null);
        }

        return { errorMessage: error?.message ?? null };
      }
    }),
    [client, configured, ready, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
