export type StripeSubscription = {
  id: string; status: string; created?: number; customer: string;
  current_period_end?: number; cancel_at_period_end?: boolean;
  items?: { data: { price?: { id: string }; current_period_end?: number }[] };
};
export function selectBillingSnapshot(subscriptions: StripeSubscription[], priceId: string) {
  const eligible = subscriptions.filter((s) => s.items?.data.some((item) => item.price?.id === priceId));
  eligible.sort((a, b) => Number(["active", "trialing"].includes(b.status)) - Number(["active", "trialing"].includes(a.status)) || (b.created ?? 0) - (a.created ?? 0));
  const subscription = eligible[0];
  if (!subscription) return { id: null, plan: "free", status: "none", current_period_end: null, cancel_at_period_end: false, price_id: null };
  const end = subscription.current_period_end ?? subscription.items?.data[0]?.current_period_end;
  return { id: subscription.id, plan: "premium", status: subscription.status, current_period_end: end ? new Date(end * 1000).toISOString() : null, cancel_at_period_end: Boolean(subscription.cancel_at_period_end), price_id: priceId };
}
