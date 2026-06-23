import { corsHeaders } from "../_shared/cors.ts";
import { requireUser } from "../_shared/supabase.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { admin, user } = await requireUser(request);
    const body = await request.json();
    const deviceId = String(body.deviceId ?? "");

    if (!deviceId) {
      return Response.json({ ok: false, error: "deviceId is required" }, { status: 400, headers: corsHeaders });
    }

    const { data, error } = await admin
      .from("devices")
      .update({
        is_locked: false,
        is_trusted: true,
        last_seen_at: new Date().toISOString()
      })
      .eq("id", deviceId)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      return Response.json({ ok: false, error: error.message }, { status: 400, headers: corsHeaders });
    }

    await admin.from("audit_events").insert({
      user_id: user.id,
      device_id: deviceId,
      action: "device.unlocked",
      resource_type: "device",
      resource_id: deviceId,
      metadata: {
        platform: data.platform,
        device_name: data.device_name
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
