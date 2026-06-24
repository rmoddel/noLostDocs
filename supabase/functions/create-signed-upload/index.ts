import { corsHeaders } from "../_shared/cors.ts";
import { documentLimitForPlan, fetchAccountPlan } from "../_shared/plans.ts";
import { requireUser } from "../_shared/supabase.ts";

function getFileExtension(fileName: string, mimeType: string) {
  const match = fileName.match(/\.([a-z0-9]+)$/i);

  if (match?.[1]) {
    return match[1].toLowerCase();
  }

  if (mimeType.includes("jpeg")) return "jpg";
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("heic")) return "heic";
  return "jpg";
}

function slugify(value: string) {
  return value.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "scan";
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { admin, user } = await requireUser(request);
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

    const payload = await request.json().catch(() => ({}));
    const documentTitle =
      typeof payload?.documentTitle === "string" && payload.documentTitle.trim()
        ? payload.documentTitle.trim()
        : "Scan";
    const fileName =
      typeof payload?.fileName === "string" && payload.fileName.trim() ? payload.fileName.trim() : "scan.jpg";
    const mimeType =
      typeof payload?.mimeType === "string" && payload.mimeType.trim() ? payload.mimeType.trim() : "image/jpeg";

    const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}-${slugify(documentTitle)}.${getFileExtension(
      fileName,
      mimeType
    )}`;

    const { data, error } = await admin.storage.from("user-documents").createSignedUploadUrl(path);

    if (error) {
      throw error;
    }

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
