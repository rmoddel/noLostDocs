import { corsHeaders } from "../_shared/cors.ts";
import { recordAuditEvent } from "../_shared/audit.ts";
import { readDeviceContext } from "../_shared/device.ts";
import { requireUser } from "../_shared/supabase.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { admin, user } = await requireUser(request);
    const payload = await request.json().catch(() => ({}));
    const action = typeof payload?.action === "string" && payload.action.trim() ? payload.action.trim() : null;

    if (!action) {
      return Response.json(
        {
          ok: false,
          function: "audit-log",
          message: "Missing audit action."
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const deviceContext = readDeviceContext(request, payload);
    let deviceId = typeof payload?.deviceId === "string" ? payload.deviceId : null;

    if (!deviceId && deviceContext.deviceFingerprint) {
      const { data: device } = await admin
        .from("devices")
        .select("id")
        .eq("user_id", user.id)
        .eq("platform", deviceContext.platform)
        .eq("device_fingerprint", deviceContext.deviceFingerprint)
        .order("last_seen_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      deviceId = device?.id ?? null;
    }

    await recordAuditEvent(admin, {
      action,
      deviceId,
      metadata: typeof payload?.metadata === "object" && payload.metadata ? payload.metadata : {},
      request,
      resourceId: typeof payload?.resourceId === "string" ? payload.resourceId : null,
      resourceType: typeof payload?.resourceType === "string" ? payload.resourceType : null,
      userId: user.id
    });

    return Response.json(
      {
        ok: true,
        function: "audit-log"
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    return Response.json(
      {
        ok: false,
        function: "audit-log",
        message: error instanceof Error ? error.message : "Audit logging failed."
      },
      { status: 500, headers: corsHeaders }
    );
  }
});
