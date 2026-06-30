import { supabase } from "@/integrations/supabase/client";

export type SubscriptionStatus = "active" | "inactive" | "cancelled" | "past_due";

export interface BrandSubscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  opportunities_used_this_period: number;
  updated_at: string;
  created_at: string;
}

export async function fetchBrandSubscription(
  userId: string
): Promise<
  | { ok: true; subscription: BrandSubscription | null }
  | { ok: false; message: string }
> {
  const { data, error } = await (supabase as any)
    .from("brand_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, subscription: (data as BrandSubscription) ?? null };
}

export async function initiateCheckout(
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<{ ok: true; checkoutUrl: string } | { ok: false; message: string }> {
  const { data, error } = await supabase.functions.invoke(
    "create-checkout-session",
    { body: { priceId, successUrl, cancelUrl } }
  );

  if (error) {
    return { ok: false, message: error.message || "Failed to start checkout." };
  }

  if (!data?.url) {
    return { ok: false, message: "No checkout URL returned from Stripe." };
  }

  return { ok: true, checkoutUrl: data.url };
}

export async function checkCanPublishOpportunity(
  userId: string
): Promise<{ canPublish: boolean; reason?: string }> {
  const result = await fetchBrandSubscription(userId);

  if (!result.ok) {
    // brand_subscriptions table doesn't exist yet (Stripe not fully set up) —
    // fail open so brands can still post opportunities.
    const isTableMissing =
      result.message.includes("does not exist") ||
      result.message.includes("relation");
    if (isTableMissing) return { canPublish: true };
    return { canPublish: false, reason: "Could not verify subscription status." };
  }

  const sub = result.subscription;

  // No subscription row yet — brand hasn't subscribed via Stripe.
  // Allow posting until Stripe is fully wired up (table exists but row absent).
  if (!sub) return { canPublish: true };

  if (sub.status !== "active") {
    return {
      canPublish: false,
      reason: "An active subscription is required to publish opportunities.",
    };
  }

  if (sub.opportunities_used_this_period >= 1) {
    return {
      canPublish: false,
      reason:
        "You have already posted an opportunity this billing period. Your allowance resets at the next renewal.",
    };
  }

  return { canPublish: true };
}
