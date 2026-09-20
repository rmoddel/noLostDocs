import type { createAdminClient } from "./supabase.ts";
import { corsHeaders } from "./cors.ts";
export async function enforceRateLimit(admin: ReturnType<typeof createAdminClient>, key: string, limit: number, seconds: number) {
  const { data, error } = await admin.rpc("consume_request_limit", { p_key: key, p_limit: limit, p_seconds: seconds });
  if (error) throw new Error("This service is temporarily unavailable.");
  if (!data) throw new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(seconds) } });
}
export async function hashLimitKey(value: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
  return Array.from(bytes, (b) => b.toString(16).padStart(2,"0")).join("");
}
