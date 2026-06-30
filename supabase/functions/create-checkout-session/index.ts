import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return new Response(JSON.stringify({ error: 'No auth' }), { status: 401, headers: corsHeaders });
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    const { priceId, successUrl, cancelUrl } = await req.json();
    const { data: existingSub } = await supabase.from('brand_subscriptions').select('stripe_customer_id').eq('user_id', user.id).maybeSingle();
    let customerId = existingSub?.stripe_customer_id;
    if (!customerId) {
      const { data: brandProfile } = await supabase.from('brand_profiles').select('brand_name, email').eq('user_id', user.id).maybeSingle();
      const customer = await stripe.customers.create({ email: brandProfile?.email ?? user.email, name: brandProfile?.brand_name, metadata: { supabase_user_id: user.id } });
      customerId = customer.id;
      await supabase.from('brand_subscriptions').upsert({ user_id: user.id, stripe_customer_id: customerId, status: 'inactive' });
    }
    const session = await stripe.checkout.sessions.create({ customer: customerId, payment_method_types: ['card'], mode: 'subscription', line_items: [{ price: priceId, quantity: 1 }], success_url: successUrl, cancel_url: cancelUrl, subscription_data: { metadata: { supabase_user_id: user.id } } });
    return new Response(JSON.stringify({ url: session.url }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
