import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2024-06-20', httpClient: Stripe.createFetchHttpClient() });
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) return new Response('No signature', { status: 400 });
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEventAsync ? await stripe.webhooks.constructEventAsync(body, signature, webhookSecret) : stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) { return new Response(`Webhook error: ${err.message}`, { status: 400 }); }
  const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
  const upsert = async (sub: Stripe.Subscription) => {
    const userId = sub.metadata?.supabase_user_id;
    if (!userId) return;
    await supabase.from('brand_subscriptions').upsert({ user_id: userId, stripe_customer_id: sub.customer as string, stripe_subscription_id: sub.id, stripe_price_id: sub.items.data[0]?.price.id, status: sub.status, current_period_start: new Date(sub.current_period_start * 1000).toISOString(), current_period_end: new Date(sub.current_period_end * 1000).toISOString(), opportunities_used_this_period: 0, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  };
  switch (event.type) {
    case 'customer.subscription.created': case 'customer.subscription.updated': await upsert(event.data.object as Stripe.Subscription); break;
    case 'customer.subscription.deleted': { const sub = event.data.object as Stripe.Subscription; const uid = sub.metadata?.supabase_user_id; if (uid) await supabase.from('brand_subscriptions').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('user_id', uid); break; }
    case 'invoice.payment_succeeded': { const inv = event.data.object as Stripe.Invoice; if (inv.subscription && inv.billing_reason === 'subscription_cycle') { const sub = await stripe.subscriptions.retrieve(inv.subscription as string); const uid = sub.metadata?.supabase_user_id; if (uid) await supabase.from('brand_subscriptions').update({ opportunities_used_this_period: 0, current_period_start: new Date(sub.current_period_start * 1000).toISOString(), current_period_end: new Date(sub.current_period_end * 1000).toISOString(), updated_at: new Date().toISOString() }).eq('user_id', uid); } break; }
    case 'invoice.payment_failed': { const inv = event.data.object as Stripe.Invoice; if (inv.subscription) { const sub = await stripe.subscriptions.retrieve(inv.subscription as string); const uid = sub.metadata?.supabase_user_id; if (uid) await supabase.from('brand_subscriptions').update({ status: 'past_due', updated_at: new Date().toISOString() }).eq('user_id', uid); } break; }
  }
  return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
});
