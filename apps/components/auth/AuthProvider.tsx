"use client";

import type { Session } from "@supabase/supabase-js";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ensureUserProfile } from "@/lib/auth/ensureUserProfile";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type AuthContextValue = {
  configured: boolean;
  ready: boolean;
  session: Session | null;
  signInWithGoogle: (redirectTo: string) => Promise<{ errorMessage: string | null }>;
  signInWithPassword: (values: { email: string; password: string }) => Promise<{ errorMessage: string | null }>;
  signUpWithPassword: (values: { email: string; fullName: string; password: string; redirectTo: string }) => Promise<{ errorMessage: string | null }>;
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
      async signInWithGoogle(redirectTo: string) {
        if (!configured) {
          return { errorMessage: "Sign-in is not enabled yet." };
        }

        const { error } = await client.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo
          }
        });

        return { errorMessage: error?.message ?? null };
      },
      async signInWithPassword({ email, password }) {
        if (!configured) {
          return { errorMessage: "Sign-in is not enabled yet." };
        }

        const { data, error } = await client.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          return { errorMessage: error.message };
        }

        if (data.user) {
          try {
            await ensureUserProfile(client, data.user);
          } catch (profileError) {
            return { errorMessage: profileError instanceof Error ? profileError.message : "Profile setup failed." };
          }
        }

        return { errorMessage: null };
      },
      async signUpWithPassword({ email, fullName, password, redirectTo }) {
        if (!configured) {
          return { errorMessage: "Sign-up is not enabled yet." };
        }

        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectTo,
            data: {
              full_name: fullName,
              name: fullName
            }
          }
        });

        if (error) {
          return { errorMessage: error.message };
        }

        if (data.user && data.session) {
          try {
            await ensureUserProfile(client, data.user);
          } catch (profileError) {
            return { errorMessage: profileError instanceof Error ? profileError.message : "Profile setup failed." };
          }
        }

        return { errorMessage: null };
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
