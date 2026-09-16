import { corsHeaders } from "../_shared/cors.ts";
import { requireRecentAuth } from "../_shared/session.ts";
import { requireUser } from "../_shared/supabase.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { admin, token, user } = await requireUser(request);
    const body = await request.json();
    const deviceName = String(body.deviceName ?? "Unnamed device");
    const platform = String(body.platform ?? "web");
    const deviceFingerprint = String(body.deviceFingerprint ?? "");

    if (!deviceFingerprint || deviceFingerprint.length > 200 || deviceName.length > 200 || platform !== "web") {
      return Response.json({ ok: false, error: "A valid web browser identifier and name are required." }, { status: 400, headers: corsHeaders });
    }
    let existingId: string | null = null;

    if (deviceFingerprint) {
      const { data: existing, error: lookupError } = await admin
        .from("devices")
        .select("id")
        .eq("user_id", user.id)
        .eq("platform", platform)
        .eq("device_fingerprint", deviceFingerprint)
        .maybeSingle();

      if (lookupError) throw lookupError;
      existingId = existing?.id ?? null;
    }

    const payload = {
      user_id: user.id,
      device_name: deviceName,
      platform,
      device_fingerprint: deviceFingerprint || null,
      is_trusted: true,
      last_seen_at: new Date().toISOString()
    };

    if (!existingId) requireRecentAuth(token, "register-device", 10 * 60);
    const query = existingId
      ? admin.from("devices").update({ device_name: deviceName, last_seen_at: payload.last_seen_at }).eq("id", existingId).select("*").single()
      : admin.from("devices").insert({ ...payload, is_locked: false }).select("*").single();

    const { data, error } = await query;

    if (error) {
      return Response.json({ ok: false, error: error.message }, { status: 400, headers: corsHeaders });
    }

    await admin.from("audit_events").insert({
      user_id: user.id,
      device_id: data.id,
      action: existingId ? "device.refreshed" : "device.registered",
      resource_type: "device",
      resource_id: data.id,
      metadata: {
        platform,
        device_name: deviceName
      }
    });

    return Response.json({ ok: true, device: data }, { headers: corsHeaders });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500, headers: corsHeaders }
    );
  }
});
