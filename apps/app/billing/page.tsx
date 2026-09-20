import { requireUser } from "@/lib/auth/requireUser";
import { BillingPanel } from "@/components/billing/BillingPanel";
import { createServerSupabaseClient } from "@/lib/supabase/server";
export default async function BillingPage() {
  const user = await requireUser("/billing");
  const { client } = await createServerSupabaseClient();
  const { data } = await client!.from("subscriptions").select("plan,status,current_period_end,cancel_at_period_end").eq("user_id", user.id).eq("provider", "stripe").maybeSingle();
  return <BillingPanel subscription={data} />;
}
