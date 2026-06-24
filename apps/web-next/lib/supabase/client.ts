"use client";

import { createDocWalletSupabaseClient } from "@doc-wallet/supabase";

let cachedClient: ReturnType<typeof createDocWalletSupabaseClient> | null = null;

export function createBrowserSupabaseClient() {
  if (!cachedClient) {
    cachedClient = createDocWalletSupabaseClient({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    });
  }

  return cachedClient;
}
