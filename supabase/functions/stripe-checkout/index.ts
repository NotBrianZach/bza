// stripe-checkout: creates a Stripe Checkout session for upgrading to Pro.
// Returns { url } — the frontend redirects the user there.

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
    const db = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    const { data: { user }, error: authError } = await db.auth.getUser(token)
    if (authError || !user) throw new Error('Unauthorized')

    // Look up existing Stripe customer ID
    const { data: profile } = await db
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single()

    const email = profile?.email || user.email || ''
    let customerId: string | undefined = profile?.stripe_customer_id || undefined

    // Helper: create (or find by email) a fresh Stripe customer and persist it
    const createFreshCustomer = async (): Promise<string> => {
      let existingCustomer: Stripe.Customer | null = null
      if (email) {
        const existing = await stripe.customers.list({ email, limit: 1 })
        if (existing.data.length > 0 && !(existing.data[0] as any).deleted) {
          existingCustomer = existing.data[0] as Stripe.Customer
        }
      }
      const customer = existingCustomer ?? await stripe.customers.create({
        email,
        metadata: { supabase_user_id: user.id },
      })
      await Promise.all([
        db.from('profiles').update({ stripe_customer_id: customer.id }).eq('id', user.id),
        db.from('billing_customers').upsert({
          user_id: user.id,
          stripe_customer_id: customer.id,
          billing_email: email,
        }),
      ])
      return customer.id
    }

    // Ensure we have a valid customer ID
    if (!customerId) {
      customerId = await createFreshCustomer()
    }

    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:3000'

    const sessionParams = {
      customer: customerId,
      client_reference_id: user.id, // authoritative Supabase user ID — webhook uses this first
      mode: 'subscription' as const,
      line_items: [{ price: Deno.env.get('STRIPE_PRO_PRICE_ID'), quantity: 1 }],
      success_url: `${siteUrl}/billing?upgraded=true`,
      cancel_url: `${siteUrl}/billing`,
      allow_promotion_codes: true,
    }

    // Try to create session; if the stored customer is stale (deleted/wrong mode), clear and retry once
    let session: Stripe.Checkout.Session
    try {
      session = await stripe.checkout.sessions.create(sessionParams)
    } catch (err: any) {
      if (err?.code === 'resource_missing' && customerId) {
        // Stale customer ID — clear it, create a fresh one, and retry
        await db.from('profiles').update({ stripe_customer_id: null }).eq('id', user.id)
        customerId = await createFreshCustomer()
        session = await stripe.checkout.sessions.create({ ...sessionParams, customer: customerId })
      } else {
        throw err
      }
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('stripe-checkout error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
