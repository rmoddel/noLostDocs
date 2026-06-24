import { createClient } from "@supabase/supabase-js";

type ServerSupabaseOptions = {
  accessToken?: string | null;
};

export function createServerSupabaseClient(options: ServerSupabaseOptions = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    return { configured: false as const, client: null };
  }

  return {
    configured: true as const,
    client: createClient(url, publishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: options.accessToken
        ? {
            headers: {
              Authorization: `Bearer ${options.accessToken}`
            }
          }
        : undefined
    })
  };
}
