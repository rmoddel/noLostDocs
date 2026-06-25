"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/components/auth/AuthProvider";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return <AuthProvider>{children}</AuthProvider>;
}
