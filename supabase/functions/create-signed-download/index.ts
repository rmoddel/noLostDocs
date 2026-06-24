import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const payload = await request.json().catch(() => ({}));
  const documentTitle =
    typeof payload?.documentTitle === "string" && payload.documentTitle.length > 0
      ? payload.documentTitle
      : "Document";

  return Response.json(
    {
      ok: true,
      function: "create-signed-download",
      message: `${documentTitle} cleared the placeholder authorization check. Replace this response with a real short-lived signed URL.`
    },
    { headers: corsHeaders }
  );
});
