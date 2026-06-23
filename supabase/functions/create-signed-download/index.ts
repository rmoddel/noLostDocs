import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  return Response.json(
    {
      ok: true,
      function: "create-signed-download",
      message: "Placeholder Edge Function. Verify access and return short-lived download access here."
    },
    { headers: corsHeaders }
  );
});
