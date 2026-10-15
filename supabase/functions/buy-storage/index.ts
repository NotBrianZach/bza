// buy-storage: creates a Stripe Checkout session for a $1/2 GB storage add-on.
// The webhook handles the resulting subscription and updates storage_limit_bytes.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const storagePriceId = Deno.env.get('STRIPE_STORAGE_PRICE_ID')
    if (!storagePriceId) throw new Error('Storage add-on not configured (STRIPE_STORAGE_PRICE_ID missing)')

    const db = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    const { data: { user }, error: authError } = await db.auth.getUser(token)
    if (authError || !user) throw new Error('Unauthorized')

    const { data: profile } = await db
      .from('profiles')
      .select('stripe_customer_id, tier')
      .eq('id', user.id)
      .single()

    if (profile?.tier !== 'pro' && profile?.tier !== 'enterprise') {
      throw new Error('Storage add-ons require an active Pro subscription')
    }

    if (!profile?.stripe_customer_id) throw new Error('No Stripe customer found')

    const body = await req.json().catch(() => ({}))
    const quantity: number = Math.min(Math.max(1, parseInt(body.quantity ?? '1', 10)), 100)

    const siteUrl = Deno.env.get('SITE_URL') || 'https://aireadalong.com'

    const session = await stripe.checkout.sessions.create({
      customer: profile.stripe_customer_id,
      mode: 'subscription',
      line_items: [{ price: storagePriceId, quantity }],
      success_url: `${siteUrl}/billing?storage_added=1`,
      cancel_url: `${siteUrl}/billing`,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('buy-storage error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
