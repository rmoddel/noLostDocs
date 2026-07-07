import type { SupabaseClient, User } from "@supabase/supabase-js";

function getStringMetadata(user: User, key: string) {
  const value = user.user_metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function getUserDisplayName(user: User) {
  return (
    getStringMetadata(user, "full_name") ??
    getStringMetadata(user, "name") ??
    user.email?.split("@")[0] ??
    "Signed-in account"
  );
}

export async function ensureUserProfile(client: SupabaseClient, user: User) {
  const fullName = getUserDisplayName(user);
  const email = user.email ?? getStringMetadata(user, "email");

  const { data: existingProfile, error: existingProfileError } = await client
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfileError) {
    throw existingProfileError;
  }

  const { error: profileError } = await client.from("profiles").upsert(
    {
      id: user.id,
      full_name: existingProfile?.full_name || fullName,
      email: existingProfile?.email || email
    },
    { onConflict: "id" }
  );

  if (profileError) {
    throw profileError;
  }

  const { data: ownerProfiles, error: ownerProfilesError } = await client
    .from("document_profiles")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  if (ownerProfilesError) {
    throw ownerProfilesError;
  }

  if (!ownerProfiles?.length) {
    const { error: ownerProfileError } = await client.from("document_profiles").insert({
      user_id: user.id,
      display_name: "Me",
      profile_type: "person",
      sort_order: 0
    });

    if (ownerProfileError) {
      throw ownerProfileError;
    }
  }
}
