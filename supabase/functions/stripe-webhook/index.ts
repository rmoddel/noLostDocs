import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  return Response.json(
    {
      ok: true,
      function: "stripe-webhook",
      message: "Placeholder Edge Function. Verify Stripe signature and sync subscription state here."
    },
    { headers: corsHeaders }
  );
});
