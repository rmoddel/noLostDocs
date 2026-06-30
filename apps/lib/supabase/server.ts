import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type ServerSupabaseOptions = {
  accessToken?: string | null;
};

export async function createServerSupabaseClient(options: ServerSupabaseOptions = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    return { configured: false as const, client: null };
  }

  const cookieStore = await cookies();

  return {
    configured: true as const,
    client: createServerClient(url, publishableKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options: cookieOptions }) => {
            cookieStore.set(name, value, cookieOptions);
          });
        }
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
