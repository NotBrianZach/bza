// sync-subscription: re-derives tier and storage from live Stripe subscription data.
// Safe to call any time — idempotent. Used for auto-heal on billing page load and manual re-sync.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GB2 = 2 * 1024 * 1024 * 1024

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const db = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    const { data: { user }, error: authError } = await db.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const proPriceId = Deno.env.get('STRIPE_PRO_PRICE_ID') ?? ''
    const storagePriceId = Deno.env.get('STRIPE_STORAGE_PRICE_ID') ?? ''

    // Get stored customer ID
    const { data: profile } = await db
      .from('profiles')
      .select('stripe_customer_id, tier')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      // No Stripe customer — user is definitively free
      return new Response(JSON.stringify({ tier: 'free', synced: false, reason: 'no_customer' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Fetch all subscriptions for this customer from Stripe
    const subs = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
    })

    let hasPro = false
    let totalStorage = 0
    for (const sub of subs.data) {
      if (sub.status !== 'active' && sub.status !== 'trialing') continue
      for (const item of sub.items.data) {
        if (item.price.id === proPriceId) { hasPro = true; totalStorage += GB2 }
        if (storagePriceId && item.price.id === storagePriceId) totalStorage += GB2 * (item.quantity ?? 1)
      }
    }

    const tier = hasPro ? 'pro' : 'free'

    // Only write if something changed (avoids unnecessary DB writes on every page load)
    const changed = tier !== profile.tier || (hasPro && totalStorage === 0)
    if (changed) {
      await db.from('profiles').update({ tier, storage_limit_bytes: totalStorage }).eq('id', user.id)
      console.log(`sync-subscription: updated user ${user.id} tier=${tier} storage=${totalStorage}`)
    }

    return new Response(JSON.stringify({ tier, storage_limit_bytes: totalStorage, synced: changed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('sync-subscription error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
