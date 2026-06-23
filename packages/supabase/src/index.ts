import { DEFAULT_SUPABASE_PUBLISHABLE_KEY, DEFAULT_SUPABASE_URL, isPlaceholderValue } from "@doc-wallet/config";
import { createClient } from "@supabase/supabase-js";

export type SupabaseEnv = {
  url?: string;
  publishableKey?: string;
  // Temporary fallback for older call sites; browser code should prefer publishableKey.
  anonKey?: string;
};

export function resolveSupabaseEnv(env: SupabaseEnv) {
  const url = env.url ?? DEFAULT_SUPABASE_URL;
  const publishableKey = env.publishableKey ?? env.anonKey ?? DEFAULT_SUPABASE_PUBLISHABLE_KEY;

  return {
    url,
    publishableKey,
    configured: !isPlaceholderValue(url) && !isPlaceholderValue(publishableKey)
  };
}

export function createDocWalletSupabaseClient(env: SupabaseEnv) {
  const { url, publishableKey, configured } = resolveSupabaseEnv(env);

  return {
    configured,
    // This helper is for browser-safe public client initialization only.
    client: createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  };
}
