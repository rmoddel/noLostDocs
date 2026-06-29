import { corsHeaders } from "../_shared/cors.ts";
import { requireUser } from "../_shared/supabase.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { admin, user } = await requireUser(request);
    const payload = await request.json().catch(() => ({}));
    const documentFileId =
      typeof payload?.documentFileId === "string" && payload.documentFileId.trim() ? payload.documentFileId.trim() : null;

    if (!documentFileId) {
      return Response.json(
        {
          ok: false,
          function: "create-signed-download",
          message: "Missing documentFileId."
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const { data: fileRow, error: fileError } = await admin
      .from("document_files")
      .select("id, user_id, storage_bucket, storage_path")
      .eq("id", documentFileId)
      .maybeSingle();

    if (fileError) {
      throw fileError;
    }

    if (!fileRow) {
      return Response.json(
        {
          ok: false,
          function: "create-signed-download",
          message: "File not found."
        },
        { status: 404, headers: corsHeaders }
      );
    }

    if (fileRow.user_id !== user.id) {
      return Response.json(
        {
          ok: false,
          function: "create-signed-download",
          message: "Forbidden."
        },
        { status: 403, headers: corsHeaders }
      );
    }

    if (fileRow.storage_bucket !== "user-documents") {
      return Response.json(
        {
          ok: false,
          function: "create-signed-download",
          message: "Forbidden bucket."
        },
        { status: 403, headers: corsHeaders }
      );
    }

    if (!fileRow.storage_path) {
      return Response.json(
        {
          ok: false,
          function: "create-signed-download",
          message: "Missing storage path."
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const expiresIn = 60;
    const { data, error } = await admin.storage.from("user-documents").createSignedUrl(fileRow.storage_path, expiresIn);

    if (error || !data?.signedUrl) {
      return Response.json(
        {
          ok: false,
          function: "create-signed-download",
          message: error?.message ?? "Storage signing failed."
        },
        { status: 500, headers: corsHeaders }
      );
    }

    return Response.json(
      {
        ok: true,
        function: "create-signed-download",
        signedUrl: data.signedUrl,
        expiresIn
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
        function: "create-signed-download",
        message: error instanceof Error ? error.message : "Signed download failed."
      },
      { status: 500, headers: corsHeaders }
    );
  }
});
