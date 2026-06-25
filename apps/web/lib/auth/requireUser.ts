import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function requireUser(nextPath: string) {
  const loginPath = `/login?next=${encodeURIComponent(nextPath)}`;
  const { client, configured } = await createServerSupabaseClient();

  if (!configured || !client) {
    redirect(loginPath);
  }

  const {
    data: { user },
    error
  } = await client.auth.getUser();

  if (error || !user) {
    redirect(loginPath);
  }

  return user;
}
