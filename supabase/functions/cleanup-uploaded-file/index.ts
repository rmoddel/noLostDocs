import { corsHeaders } from "../_shared/cors.ts";
import { recordAuditEvent } from "../_shared/audit.ts";
import { requireTrustedDevice } from "../_shared/device.ts";
import { requireUser } from "../_shared/supabase.ts";

function isOwnStoragePath(userId: string, path: unknown) {
  return typeof path === "string" && path.startsWith(`${userId}/`) && !path.includes("..");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { admin, user } = await requireUser(request);
    const payload = await request.json().catch(() => ({}));
    const device = await requireTrustedDevice(admin, user.id, request, payload, "cleanup-uploaded-file");

    if (!isOwnStoragePath(user.id, payload?.path)) {
      return Response.json(
        {
          ok: false,
          function: "cleanup-uploaded-file",
          message: "Invalid storage path."
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const { error } = await admin.storage.from("user-documents").remove([payload.path]);

    if (error) {
      throw error;
    }

    await recordAuditEvent(admin, {
      action: "document_file.upload_cleanup",
      deviceId: device.id,
      metadata: {
        storage_bucket: "user-documents",
        storage_path: payload.path
      },
      request,
      resourceType: "document_file",
      userId: user.id
    });

    return Response.json({ ok: true, function: "cleanup-uploaded-file" }, { headers: corsHeaders });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    return Response.json(
      {
        ok: false,
        function: "cleanup-uploaded-file",
        message: error instanceof Error ? error.message : "Upload cleanup failed."
      },
      { status: 500, headers: corsHeaders }
    );
  }
});
