import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  return Response.json(
    {
      ok: true,
      function: "create-signed-upload",
      message: "Placeholder Edge Function. Enforce plan/quota and return safe upload instructions here."
    },
    { headers: corsHeaders }
  );
});
