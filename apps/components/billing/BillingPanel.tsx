"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
type Subscription = { plan: string; status: string; current_period_end: string | null; cancel_at_period_end: boolean };
type Price = { unit_amount: number; currency: string; livemode: boolean; recurring: { interval: string; interval_count: number } };
export function BillingPanel({ subscription }: { subscription: Subscription | null }) {
  const [price, setPrice] = useState<Price | null>(null), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false); const router = useRouter();
  const { client } = createBrowserSupabaseClient();
  useEffect(() => { void client.functions.invoke("billing", { body: { action: "info" } }).then(({ data }) => { setPrice(data?.available ? data.price : null); setLoaded(true); }); }, [client]);
  async function action(kind: "checkout" | "portal" | "refresh") {
    setBusy(true); setMessage("");
    try {
      const { data, error } = await client.functions.invoke("billing", { body: { action: kind } });
      if (error) {
        let detail = "Billing could not be completed. Sign in again and retry.";
        try { const body = await error.context.json(); if (typeof body.error === "string") detail = body.error; } catch {}
        throw new Error(detail);
      }
      if (kind === "refresh") { router.refresh(); setMessage("Subscription status refreshed from the payment provider."); return; }
      const target = new URL(data.url);
      if (target.protocol !== "https:" || !["checkout.stripe.com", "billing.stripe.com"].includes(target.hostname)) throw new Error("Unexpected billing destination.");
      window.location.assign(target.toString());
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  }
  const active = subscription?.plan === "premium" && ["active", "trialing"].includes(subscription.status);
  return <section className="page-section"><div className="content-card">
    <p className="eyebrow">Plans and billing</p><h1>{active ? "Your Premium plan" : "More room for important documents"}</h1>
    <p>Free Basic includes 3 encrypted documents. Premium includes up to 50 documents and all document categories. Each file can be up to 10 MB.</p>
    <p><Link href="/recovery">Set up your recovery code</Link> before subscribing. Keep the code and your original documents safe.</p>
    {subscription ? <p>Status: {subscription.status}. {subscription.current_period_end ? `${subscription.cancel_at_period_end ? "Access through" : "Current period ends"} ${new Date(subscription.current_period_end).toLocaleDateString()}.` : ""}</p> : null}
    {!loaded ? <p>Loading plans…</p> : !price ? <p>Paid subscriptions are not available yet. You can continue using Free Basic.</p> : <>
      <h2>{new Intl.NumberFormat(undefined, { style: "currency", currency: price.currency }).format(price.unit_amount / 100)} / {price.recurring.interval_count > 1 ? price.recurring.interval_count + " " : ""}{price.recurring.interval}</h2>
      {!price.livemode ? <p role="status">Test checkout only. Real subscriptions are not available yet.</p> : null}
      <p>Renews automatically until canceled. Manage payment details and cancellation through Stripe. Canceling keeps Premium access until the paid period ends; it does not delete your documents.</p>
      {!active ? <button className="button primary" disabled={busy} onClick={() => void action("checkout")}>Continue to {price.livemode ? "secure" : "test"} checkout</button> : null}
      <button className="button secondary" disabled={busy} onClick={() => void action("portal")}>Manage billing</button>
      <button className="button secondary" disabled={busy} onClick={() => void action("refresh")}>Refresh payment status</button>
    </>}
    {message ? <p role="status">{message}</p> : null}
    <p><Link href="/dashboard">Back to documents</Link> · <Link href="/contact">Billing support</Link></p>
  </div></section>;
}
