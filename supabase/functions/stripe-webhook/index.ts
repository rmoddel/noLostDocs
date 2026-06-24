import { corsHeaders } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabase.ts";

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

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await request.json();
    const eventType = typeof payload?.type === "string" ? payload.type : "stripe.event";
    const subscription = (payload?.data?.object ?? {}) as StripeSubscriptionPayload;
    const userId = subscription.metadata?.user_id;
    const plan = subscription.metadata?.plan === "premium" ? "premium" : "free";
    const status = subscription.status ?? "incomplete";

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

    return Response.json(
      {
        ok: true,
        function: "stripe-webhook",
        eventType,
        userId,
        plan,
        cloudEnabled,
        message: "Subscription state synchronized from webhook payload. Add Stripe signature verification before production use."
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    return Response.json(
      {
        ok: false,
        function: "stripe-webhook",
        message: error instanceof Error ? error.message : "Webhook handling failed."
      },
      { status: 500, headers: corsHeaders }
    );
  }
});
