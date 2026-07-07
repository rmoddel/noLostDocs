import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const nextValue = resolvedSearchParams.next;
  const authErrorValue = resolvedSearchParams.authError;
  const modeValue = resolvedSearchParams.mode;
  const nextPath = Array.isArray(nextValue) ? nextValue[0] : nextValue;
  const authError = Array.isArray(authErrorValue) ? authErrorValue[0] : authErrorValue;
  const modeParam = Array.isArray(modeValue) ? modeValue[0] : modeValue;
  const mode = modeParam === "signin" ? "signin" : "create";
  const safeNextPath = typeof nextPath === "string" && nextPath.startsWith("/") ? nextPath : "/dashboard";
  const initialMessage =
    authError === "exchange_failed"
      ? "That sign-in link could not be completed. Request a new link and try again."
      : authError === "not_configured"
        ? "Sign-in is not enabled yet."
        : authError === "missing_code" || authError === "missing_token_hash"
          ? "That sign-in link is incomplete. Request a new email link."
          : authError === "verify_failed"
            ? "That sign-in link could not be verified. Request a new link and try again."
          : null;
  const { client, configured } = await createServerSupabaseClient();

  if (configured && client) {
    const {
      data: { user }
    } = await client.auth.getUser();

    if (user) {
      redirect(safeNextPath);
    }
  }

  return <LoginForm initialMessage={initialMessage} mode={mode} nextPath={safeNextPath} />;
}
