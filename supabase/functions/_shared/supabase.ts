import { createClient } from "npm:@supabase/supabase-js@2";
import type { User } from "npm:@supabase/supabase-js@2";
import { requireEnv } from "./env.ts";

export function createAdminClient() {
  const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!serviceRoleKey) {
    throw new Error("Missing environment variable: SERVICE_ROLE_KEY");
  }

  return createClient(requireEnv("SUPABASE_URL"), serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function requireUser(request: Request): Promise<{ admin: ReturnType<typeof createAdminClient>; user: User }> {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new Response(JSON.stringify({ error: "Missing bearer token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const token = authHeader.replace("Bearer ", "");
  const admin = createAdminClient();
  const {
    data: { user },
    error
  } = await admin.auth.getUser(token);

  if (error || !user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  return { admin, user };
}
