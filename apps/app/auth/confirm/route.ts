import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function resolveSafeRedirectTarget(requestUrl: URL, rawRedirectTo: string | null) {
  if (!rawRedirectTo) {
    return new URL("/dashboard", requestUrl.origin);
  }

  if (rawRedirectTo.startsWith("/")) {
    return new URL(rawRedirectTo, requestUrl.origin);
  }

  try {
    const redirectUrl = new URL(rawRedirectTo);
    return redirectUrl.origin === requestUrl.origin ? redirectUrl : new URL("/dashboard", requestUrl.origin);
  } catch {
    return new URL("/dashboard", requestUrl.origin);
  }
}

function createLoginRedirect(requestUrl: URL, redirectTarget: URL, authError: string) {
  const loginUrl = new URL("/login", requestUrl.origin);
  loginUrl.searchParams.set("next", `${redirectTarget.pathname}${redirectTarget.search}`);
  loginUrl.searchParams.set("authError", authError);
  return NextResponse.redirect(loginUrl);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const redirectTarget = resolveSafeRedirectTarget(requestUrl, requestUrl.searchParams.get("redirect_to"));

  if (!tokenHash || !type) {
    return createLoginRedirect(requestUrl, redirectTarget, "missing_token_hash");
  }

  const { client, configured } = await createServerSupabaseClient();

  if (!configured || !client) {
    return createLoginRedirect(requestUrl, redirectTarget, "not_configured");
  }

  const { error } = await client.auth.verifyOtp({
    token_hash: tokenHash,
    type
  });

  if (error) {
    return createLoginRedirect(requestUrl, redirectTarget, "verify_failed");
  }

  return NextResponse.redirect(redirectTarget);
}
