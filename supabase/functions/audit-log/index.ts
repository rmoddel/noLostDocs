import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  return Response.json(
    {
      ok: true,
      function: "audit-log",
      message: "Placeholder Edge Function. Centralize sensitive action logging here."
    },
    { headers: corsHeaders }
  );
});
