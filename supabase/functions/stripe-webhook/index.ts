import { corsHeaders } from "../_shared/cors.ts";
import { recordAuditEvent } from "../_shared/audit.ts";
import { requireEnv } from "../_shared/env.ts";
import { createAdminClient } from "../_shared/supabase.ts";
import { assertStripeWebhookSignature } from "../_shared/stripe.ts";

type StripeSubscriptionPayload = {
  id?: string;
  customer?: string;
  status?: string;
  metadata?: {
    user_id?: string;
    plan?: string;
  };
  current_period_end?: number;
};

const SUBSCRIPTION_EVENTS = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted"
]);

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const rawBody = await request.text();
    await assertStripeWebhookSignature(rawBody, request.headers.get("Stripe-Signature"), requireEnv("STRIPE_WEBHOOK_SECRET"));
    const payload = JSON.parse(rawBody);
    const eventType = typeof payload?.type === "string" ? payload.type : "stripe.event";

    if (!SUBSCRIPTION_EVENTS.has(eventType)) {
      return Response.json(
        {
          ok: true,
          function: "stripe-webhook",
          eventType,
          ignored: true
        },
        { headers: corsHeaders }
      );
    }

    const subscription = (payload?.data?.object ?? {}) as StripeSubscriptionPayload;
    const userId = subscription.metadata?.user_id;
    const plan = subscription.metadata?.plan === "premium" ? "premium" : "free";
    const status = subscription.status ?? "incomplete";

    if (!subscription.id) {
      return Response.json(
        {
          ok: false,
          function: "stripe-webhook",
          message: "Missing Stripe subscription id."
        },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!userId) {
      return Response.json(
        {
          ok: false,
          function: "stripe-webhook",
          message: "Missing metadata.user_id in webhook payload."
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const admin = createAdminClient();

    const { error: subscriptionError } = await admin.from("subscriptions").upsert(
      {
        user_id: userId,
        provider: "stripe",
        provider_customer_id: subscription.customer ?? null,
        provider_subscription_id: subscription.id ?? null,
        plan,
        status,
        current_period_end: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null
      },
      { onConflict: "provider_subscription_id" }
    );

    if (subscriptionError) {
      throw subscriptionError;
    }

    const cloudEnabled = plan === "premium" && (status === "active" || status === "trialing");
    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: userId,
        plan: cloudEnabled ? "premium" : "free",
        cloud_enabled: cloudEnabled
      },
      { onConflict: "id" }
    );

    if (profileError) {
      throw profileError;
    }

    await recordAuditEvent(admin, {
      action: "billing.subscription_synchronized",
      metadata: {
        cloud_enabled: cloudEnabled,
        event_type: eventType,
        provider: "stripe",
        provider_customer_id: subscription.customer ?? null,
        provider_subscription_id: subscription.id ?? null,
        status
      },
      resourceType: "subscription",
      userId
    });

    return Response.json(
      {
        ok: true,
        function: "stripe-webhook",
        eventType,
        userId,
        plan,
        cloudEnabled,
        message: "Subscription state synchronized from verified Stripe webhook payload."
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handling failed.";
    const verificationFailed =
      message.includes("Stripe-Signature") || message.includes("Stripe webhook signature");

    return Response.json(
      {
        ok: false,
        function: "stripe-webhook",
        message
      },
      { status: verificationFailed ? 400 : 500, headers: corsHeaders }
    );
  }
});
