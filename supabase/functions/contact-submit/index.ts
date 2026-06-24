import { corsHeaders } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabase.ts";

function jsonError(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status, headers: corsHeaders });
}

async function resolveUserId(request: Request) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice("Bearer ".length);
  const admin = createAdminClient();
  const {
    data: { user }
  } = await admin.auth.getUser(token);

  return user?.id ?? null;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonError("Method not allowed", 405);
  }

  try {
    const admin = createAdminClient();
    const userId = await resolveUserId(request);
    const body = await request.json().catch(() => ({}));

    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim();
    const subject = String(body?.subject ?? "").trim();
    const message = String(body?.message ?? "").trim();
    const sourceRoute = String(body?.page ?? "/").trim() || "/";

    if (!name || !email || !subject || !message) {
      return jsonError("Name, email, subject, and message are required.");
    }

    const { data, error } = await admin
      .from("contact_requests")
      .insert({
        user_id: userId,
        name,
        email,
        subject,
        message,
        source_route: sourceRoute,
        status: "new"
      })
      .select("id")
      .single();

    if (error) {
      return jsonError(error.message, 400);
    }

    if (userId) {
      await admin.from("audit_events").insert({
        user_id: userId,
        action: "contact.submitted",
        resource_type: "contact_request",
        resource_id: data.id,
        metadata: {
          subject,
          source_route: sourceRoute
        }
      });
    }

    return Response.json(
      {
        ok: true,
        contactRequestId: data.id,
        message: "Message sent. We will reply by email."
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unexpected error", 500);
  }
});
