import { requireEnv } from "./env.ts";
import type { createAdminClient } from "./supabase.ts";
import { selectBillingSnapshot, type StripeSubscription } from "./billing-state.ts";
type Admin = ReturnType<typeof createAdminClient>;
export const BILLING_SITE = "https://nolostdocs.rmoddel.com";
export async function stripeRequest<T>(path: string, method = "GET", params?: URLSearchParams, idempotencyKey?: string): Promise<T> {
  const headers: Record<string, string> = { Authorization: `Bearer ${requireEnv("STRIPE_SECRET_KEY")}`, "Stripe-Version": "2025-02-24.acacia" };
  if (params) headers["Content-Type"] = "application/x-www-form-urlencoded";
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  const response = await fetch(`https://api.stripe.com/v1/${path}`, { method, headers, body: params, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error("Billing provider could not complete this request. Please try again.");
  return await response.json() as T;
}
export async function priceDetails() {
  const id = requireEnv("STRIPE_PRICE_ID");
  const price = await stripeRequest<{ id: string; active: boolean; livemode: boolean; unit_amount: number | null; currency: string; recurring?: { interval: string; interval_count: number } }>(`prices/${encodeURIComponent(id)}`);
  const live = requireEnv("STRIPE_SECRET_KEY").startsWith("sk_live_");
  if (!price.active || price.livemode !== live || !price.recurring || !price.unit_amount) throw new Error("Paid subscriptions are not available yet.");
  return price;
}
export async function getCustomer(admin: Admin, user: { id: string; email?: string }) {
  const { data, error } = await admin.from("billing_customers").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
  if (error) throw error;
  if (data) return data.stripe_customer_id as string;
  const params = new URLSearchParams({ "metadata[nolostdocs_user_id]": user.id });
  if (user.email) params.set("email", user.email);
  const customer = await stripeRequest<{ id: string }>("customers", "POST", params, `nld-customer-${user.id}`);
  const inserted = await admin.from("billing_customers").upsert({ user_id: user.id, stripe_customer_id: customer.id }, { onConflict: "user_id", ignoreDuplicates: true });
  if (inserted.error) throw inserted.error;
  const result = await admin.from("billing_customers").select("stripe_customer_id").eq("user_id", user.id).single();
  if (result.error) throw result.error;
  return result.data.stripe_customer_id as string;
}
export async function withBillingLock<T>(admin: Admin, userId: string, action: (token: string) => Promise<T>) {
  const token = crypto.randomUUID();
  const lock = await admin.rpc("claim_billing_lock", { p_user_id: userId, p_token: token });
  if (lock.error || !lock.data) throw new Error("Another billing request is in progress. Please retry shortly.");
  try { return await action(token); }
  finally { await admin.rpc("release_billing_lock", { p_user_id: userId, p_token: token }); }
}
export async function listSubscriptions(customer: string) {
  const all: StripeSubscription[] = []; let after = "";
  for (;;) {
    const query = new URLSearchParams({ customer, status: "all", limit: "100" });
    if (after) query.set("starting_after", after);
    const page = await stripeRequest<{ data: StripeSubscription[]; has_more: boolean }>(`subscriptions?${query}`);
    all.push(...page.data);
    if (!page.has_more) return all;
    if (!page.data.length) throw new Error("Billing pagination failed.");
    after = page.data[page.data.length - 1].id;
  }
}
export async function synchronizeBilling(admin: Admin, userId: string, customer: string, eventId?: string) {
  return await withBillingLock(admin, userId, async (token) => {
    const snapshot = selectBillingSnapshot(await listSubscriptions(customer), requireEnv("STRIPE_PRICE_ID"));
    const result = await admin.rpc("apply_billing_snapshot", { p_user_id: userId, p_token: token, p_snapshot: snapshot, p_event_id: eventId ?? null });
    if (result.error) throw result.error;
    return snapshot;
  });
}
