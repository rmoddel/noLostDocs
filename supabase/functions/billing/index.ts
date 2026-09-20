import { enforceRateLimit } from "../_shared/rate-limit.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { requireUser } from "../_shared/supabase.ts";
import { requireRecentAuth } from "../_shared/session.ts";
import { BILLING_SITE, getCustomer, listSubscriptions, priceDetails, stripeRequest, synchronizeBilling, withBillingLock } from "../_shared/billing.ts";
Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  try {
    const { admin, user, token } = await requireUser(request);
    await enforceRateLimit(admin, `billing:${user.id}`, 20, 60);
    const body = await request.json().catch(() => ({}));
    if (!["info", "checkout", "portal", "refresh"].includes(body.action)) return Response.json({ error: "Unknown billing action" }, { status: 400, headers: corsHeaders });
    if (body.action === "info") {
      try { return Response.json({ available: true, price: await priceDetails() }, { headers: corsHeaders }); }
      catch { return Response.json({ available: false }, { headers: corsHeaders }); }
    }
    requireRecentAuth(token, "billing", 30 * 60);
    if (body.action === "checkout") {
      const recovery = await admin.from("vault_recovery").select("user_id").eq("user_id", user.id).maybeSingle();
      if (recovery.error || !recovery.data) return Response.json({ error: "Set up document recovery before subscribing." }, { status: 409, headers: corsHeaders });
    }
    const existingCustomer = await admin.from("billing_customers").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
    if (existingCustomer.error) throw existingCustomer.error;
    if (!existingCustomer.data && body.action !== "checkout") return Response.json({ error: "There is no billing account to manage yet." }, { status: 409, headers: corsHeaders });
    const customer = existingCustomer.data?.stripe_customer_id ?? await getCustomer(admin, user);
    if (body.action === "refresh") return Response.json({ subscription: await synchronizeBilling(admin, user.id, customer) }, { headers: corsHeaders });
    if (body.action === "portal") {
      const session = await stripeRequest<{ url: string }>("billing_portal/sessions", "POST", new URLSearchParams({ customer, return_url: `${BILLING_SITE}/billing` }));
      return Response.json({ url: session.url }, { headers: corsHeaders });
    }
    if (body.action !== "checkout") return Response.json({ error: "Unknown billing action" }, { status: 400, headers: corsHeaders });
    const price = await priceDetails();
    const url = await withBillingLock(admin, user.id, async () => {
      const subs = await listSubscriptions(customer);
      if (subs.some((s) => !["canceled", "incomplete_expired"].includes(s.status))) throw new Error("You already have a subscription or pending payment. Open Manage billing instead.");
      const existing = await stripeRequest<{ data: { url: string | null }[] }>(`checkout/sessions?${new URLSearchParams({ customer, status: "open", limit: "1" })}`);
      if (existing.data[0]?.url) return existing.data[0].url;
      const params = new URLSearchParams({ customer, mode: "subscription", "line_items[0][price]": price.id, "line_items[0][quantity]": "1", client_reference_id: user.id, "subscription_data[metadata][nolostdocs_user_id]": user.id, success_url: `${BILLING_SITE}/billing?checkout=success`, cancel_url: `${BILLING_SITE}/billing?checkout=canceled` });
      const session = await stripeRequest<{ url: string }>("checkout/sessions", "POST", params, `nld-checkout-${user.id}-${Math.floor(Date.now() / 3600000)}`);
      return session.url;
    });
    return Response.json({ url }, { headers: corsHeaders });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: error instanceof Error ? error.message : "Billing is temporarily unavailable." }, { status: 409, headers: corsHeaders });
  }
});
