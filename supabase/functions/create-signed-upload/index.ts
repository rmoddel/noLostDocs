import { enforceRateLimit } from "../_shared/rate-limit.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { recordAuditEvent } from "../_shared/audit.ts";
import { requireTrustedDevice } from "../_shared/device.ts";
import { documentLimitForPlan, fetchAccountPlan } from "../_shared/plans.ts";
import { requireUser } from "../_shared/supabase.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { admin, user } = await requireUser(request);
    await enforceRateLimit(admin, `upload:${user.id}`, 15, 60);
    const payload = await request.json().catch(() => ({}));
    const device = await requireTrustedDevice(admin, user.id, request, payload, "create-signed-upload");
    const plan = await fetchAccountPlan(admin, user.id);
    const documentLimit = documentLimitForPlan(plan);
    const { count, error: countError } = await admin
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("deleted_at", null);

    if (countError) {
      throw countError;
    }

    if ((count ?? 0) >= documentLimit) {
      return Response.json(
        {
          ok: false,
          function: "create-signed-upload",
          plan,
          documentLimit,
          message:
            plan === "free"
              ? "Free Basic accounts have reached the current upload limit. Upgrade to premium to unlock more cloud-backed capacity."
              : "Premium account document limit reached. Increase the quota policy before issuing more uploads."
        },
        { status: 403, headers: corsHeaders }
      );
    }

    const documentTitle =
      typeof payload?.documentTitle === "string" && payload.documentTitle.trim()
        ? payload.documentTitle.trim()
        : "Scan";
    const fileName =
      typeof payload?.fileName === "string" && payload.fileName.trim() ? payload.fileName.trim() : "scan.jpg";
    const mimeType =
      typeof payload?.mimeType === "string" && payload.mimeType.trim() ? payload.mimeType.trim() : "image/jpeg";

    if (mimeType !== "application/octet-stream" || !fileName.endsWith(".nld.enc")) {
      return Response.json({ ok: false, message: "Only encrypted document uploads are supported." }, { status: 400, headers: corsHeaders });
    }
    // Avoid sensitive document titles in URLs, access logs, and object names.
    const path = `${user.id}/${crypto.randomUUID()}.nld.enc`;

    const reservation = await admin.rpc("reserve_document_upload", { p_user_id: user.id, p_path: path, p_limit: documentLimit });
    if (reservation.error) throw reservation.error;
    if (!reservation.data) return Response.json({ ok: false, message: "Your document or pending-upload limit is reached. Remove an unused document or contact support about an interrupted upload." }, { status: 403, headers: corsHeaders });
    const { data, error } = await admin.storage.from("user-documents").createSignedUploadUrl(path);

    if (error) {
      await admin.from("upload_reservations").delete().eq("path", path).eq("user_id", user.id);
      throw error;
    }

    await recordAuditEvent(admin, {
      action: "document_file.upload_authorized",
      deviceId: device.id,
      metadata: {
        content_type: mimeType,
        storage_bucket: "user-documents"
      },
      request,
      resourceType: "document_file",
      userId: user.id
    });

    return Response.json(
      {
        ok: true,
        function: "create-signed-upload",
        plan,
        documentLimit,
        remainingSlots: documentLimit - (count ?? 0),
        documentTitle,
        path: data.path,
        token: data.token,
        signedUrl: data.signedUrl
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
        function: "create-signed-upload",
        message: error instanceof Error ? error.message : "Upload authorization failed."
      },
      { status: 500, headers: corsHeaders }
    );
  }
});
