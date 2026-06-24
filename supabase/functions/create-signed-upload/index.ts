import { corsHeaders } from "../_shared/cors.ts";
import { documentLimitForPlan, fetchAccountPlan } from "../_shared/plans.ts";
import { requireUser } from "../_shared/supabase.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { admin, user } = await requireUser(request);
    const plan = await fetchAccountPlan(admin, user.id);
    const documentLimit = documentLimitForPlan(plan);
    const { count, error } = await admin
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("deleted_at", null);

    if (error) {
      throw error;
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

    return Response.json(
      {
        ok: true,
        function: "create-signed-upload",
        plan,
        documentLimit,
        remainingSlots: documentLimit - (count ?? 0),
        message: "Plan/quota check passed. Replace this placeholder with a real signed upload instruction flow."
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
