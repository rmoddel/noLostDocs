import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const nextValue = resolvedSearchParams.next;
  const nextPath = Array.isArray(nextValue) ? nextValue[0] : nextValue;
  const safeNextPath = typeof nextPath === "string" && nextPath.startsWith("/") ? nextPath : "/dashboard";
  const { client, configured } = await createServerSupabaseClient();

  if (configured && client) {
    const {
      data: { user }
    } = await client.auth.getUser();

    if (user) {
      redirect(safeNextPath);
    }
  }

  return <LoginForm nextPath={safeNextPath} />;
}
