"use client";

import { DEFAULT_SUPABASE_PUBLISHABLE_KEY, DEFAULT_SUPABASE_URL, isPlaceholderValue } from "@nolostdocs/config";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? DEFAULT_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? DEFAULT_SUPABASE_PUBLISHABLE_KEY;
  const configured = !isPlaceholderValue(url) && !isPlaceholderValue(publishableKey);

  if (!cachedClient) {
    cachedClient = createBrowserClient(url, publishableKey);
  }

  return { configured, client: cachedClient as SupabaseClient };
}
