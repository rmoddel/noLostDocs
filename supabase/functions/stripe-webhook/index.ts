import { corsHeaders } from "../_shared/cors.ts";
import { requireEnv } from "../_shared/env.ts";
import { createAdminClient } from "../_shared/supabase.ts";
import { assertStripeWebhookSignature } from "../_shared/stripe.ts";
import { synchronizeBilling } from "../_shared/billing.ts";
const EVENTS = new Set(["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted", "checkout.session.completed", "invoice.paid", "invoice.payment_failed"]);
Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  try {
    if (Number(request.headers.get("content-length")) > 1048576) return new Response("Request too large", { status: 413 });
    const rawBody = await request.text();
    if (rawBody.length > 1048576) return new Response("Request too large", { status: 413 });
    await assertStripeWebhookSignature(rawBody, request.headers.get("Stripe-Signature"), requireEnv("STRIPE_WEBHOOK_SECRET"));
    const event = JSON.parse(rawBody);
    if (event.livemode !== requireEnv("STRIPE_SECRET_KEY").startsWith("sk_live_")) return new Response("Wrong billing mode", { status: 400 });
    if (!EVENTS.has(event.type)) return Response.json({ ok: true, ignored: true });
    if (typeof event.id !== "string" || typeof event.data?.object?.customer !== "string") return new Response("Invalid event", { status: 400 });
    const admin = createAdminClient();
    const processed = await admin.from("billing_events").select("event_id").eq("event_id", event.id).maybeSingle();
    if (processed.error) throw processed.error;
    if (processed.data) return Response.json({ ok: true, duplicate: true });
    // Ownership is established by our server-created customer mapping, never event metadata.
    const customer = event.data.object.customer;
    const owner = await admin.from("billing_customers").select("user_id").eq("stripe_customer_id", customer).maybeSingle();
    if (owner.error) throw owner.error;
    if (!owner.data) return Response.json({ ok: true, ignored: true });
    // Retrieve Stripe's current state under a customer lease. Old event payloads cannot restore canceled access.
    await synchronizeBilling(admin, owner.data.user_id, customer, event.id);
    return Response.json({ ok: true }, { headers: corsHeaders });
  } catch (error) {
    const invalidSignature = error instanceof Error && /Stripe-Signature|Stripe webhook signature/.test(error.message);
    return Response.json({ error: invalidSignature ? "Invalid webhook signature." : "Billing synchronization failed. Retry this event." }, { status: invalidSignature ? 400 : 500 });
  }
});
