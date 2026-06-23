import { corsHeaders } from "../_shared/cors.ts";
import { requireUser } from "../_shared/supabase.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { admin, user } = await requireUser(request);
    const body = await request.json();
    const deviceName = String(body.deviceName ?? "Unnamed device");
    const platform = String(body.platform ?? "web");
    const deviceFingerprint = String(body.deviceFingerprint ?? "");

    let existingId: string | null = null;

    if (deviceFingerprint) {
      const { data: existing } = await admin
        .from("devices")
        .select("id")
        .eq("user_id", user.id)
        .eq("platform", platform)
        .eq("device_fingerprint", deviceFingerprint)
        .maybeSingle();

      existingId = existing?.id ?? null;
    }

    const payload = {
      user_id: user.id,
      device_name: deviceName,
      platform,
      device_fingerprint: deviceFingerprint || null,
      is_trusted: true,
      is_locked: false,
      last_seen_at: new Date().toISOString()
    };

    const query = existingId
      ? admin.from("devices").update(payload).eq("id", existingId).select("*").single()
      : admin.from("devices").insert(payload).select("*").single();

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
