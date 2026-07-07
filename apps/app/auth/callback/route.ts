import { NextResponse } from "next/server";
import { ensureUserProfile } from "@/lib/auth/ensureUserProfile";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function resolveSafeNextPath(rawNext: string | null) {
  return rawNext && rawNext.startsWith("/") ? rawNext : "/dashboard";
}

function createLoginRedirect(requestUrl: URL, nextPath: string, authError: string) {
  const loginUrl = new URL("/login", requestUrl.origin);
  loginUrl.searchParams.set("next", nextPath);
  loginUrl.searchParams.set("authError", authError);
  return NextResponse.redirect(loginUrl);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = resolveSafeNextPath(requestUrl.searchParams.get("next"));
  const redirectUrl = new URL(nextPath, requestUrl.origin);

  if (!code) {
    return createLoginRedirect(requestUrl, nextPath, "missing_code");
  }

  const { client, configured } = await createServerSupabaseClient();

  if (!configured || !client) {
    return createLoginRedirect(requestUrl, nextPath, "not_configured");
  }

  const { error } = await client.auth.exchangeCodeForSession(code);

  if (error) {
    return createLoginRedirect(requestUrl, nextPath, "exchange_failed");
  }

  const {
    data: { user }
  } = await client.auth.getUser();

  if (user) {
    try {
      await ensureUserProfile(client, user);
    } catch (profileError) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Failed to ensure user profile", profileError);
      }
    }
  }

  return NextResponse.redirect(redirectUrl);
}
