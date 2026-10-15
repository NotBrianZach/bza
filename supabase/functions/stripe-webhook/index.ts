// Stripe Webhook Edge Function
// Handles Stripe webhook events for billing

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno'

const GB2 = 2 * 1024 * 1024 * 1024 // 2 GiB in bytes

/** Compute storage_limit_bytes from a Stripe subscription's items.
 *  - Pro plan item    → base 2 GB
 *  - Storage add-on   → +2 GB × quantity
 */
function storageFromItems(items: Stripe.SubscriptionItem[], proPriceId: string, storagePriceId: string): number {
  let bytes = 0
  for (const item of items) {
    if (item.price.id === proPriceId) bytes += GB2
    if (storagePriceId && item.price.id === storagePriceId) bytes += GB2 * (item.quantity ?? 1)
  }
  return bytes
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')

  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!webhookSecret) {
      throw new Error('Webhook secret not configured')
    }

    // Verify webhook signature
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    )

    // Initialize Supabase client with service role key (bypass RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Webhook event:', event.type)

    // Handle different event types
    switch (event.type) {
      case 'customer.created': {
        const customer = event.data.object as Stripe.Customer

        // Find user by email
        const { data: users } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', customer.email)
          .single()

        if (users) {
          // Create billing customer record
          await supabaseAdmin
            .from('billing_customers')
            .upsert({
              user_id: users.id,
              stripe_customer_id: customer.id,
              billing_email: customer.email,
            })

          // Update profile
          await supabaseAdmin
            .from('profiles')
            .update({ stripe_customer_id: customer.id })
            .eq('id', users.id)
        }
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription' || !session.subscription) break

        const proPriceId = Deno.env.get('STRIPE_PRO_PRICE_ID') ?? ''
        const storagePriceId = Deno.env.get('STRIPE_STORAGE_PRICE_ID') ?? ''

        // Resolve user — prefer client_reference_id (set at session creation = authoritative Supabase UID).
        // This prevents orphaned-account mismatches where checkout was completed under the wrong session.
        let userId: string | null = session.client_reference_id ?? null

        if (userId) {
          // Ensure billing_customers and profiles point to this user
          await supabaseAdmin.from('billing_customers').upsert({
            user_id: userId,
            stripe_customer_id: session.customer,
            billing_email: session.customer_details?.email ?? null,
          }, { onConflict: 'stripe_customer_id' })
          await supabaseAdmin.from('profiles')
            .update({ stripe_customer_id: session.customer })
            .eq('id', userId)
        } else {
          // Fallback for sessions created before client_reference_id was added
          const { data: bcRow } = await supabaseAdmin
            .from('billing_customers')
            .select('user_id')
            .eq('stripe_customer_id', session.customer)
            .single()

          if (bcRow) {
            userId = bcRow.user_id
          } else {
            const stripeCustomer = await stripe.customers.retrieve(session.customer as string) as Stripe.Customer
            const supabaseUserId = stripeCustomer.metadata?.supabase_user_id
            if (supabaseUserId) {
              await supabaseAdmin.from('billing_customers').upsert({
                user_id: supabaseUserId,
                stripe_customer_id: session.customer,
                billing_email: stripeCustomer.email,
              })
              await supabaseAdmin.from('profiles').update({ stripe_customer_id: session.customer }).eq('id', supabaseUserId)
              userId = supabaseUserId
            }
          }
        }

        if (!userId) {
          console.warn('checkout.session.completed: could not resolve user for customer', session.customer)
          break
        }

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const isActive = subscription.status === 'active' || subscription.status === 'trialing'
        const items = subscription.items.data
        const hasPro = items.some(i => i.price.id === proPriceId)
        const tier = isActive && hasPro ? 'pro' : 'free'
        const totalStorage = storageFromItems(items, proPriceId, storagePriceId)

        await supabaseAdmin
          .from('profiles')
          .update({ tier, storage_limit_bytes: totalStorage })
          .eq('id', userId)

        console.log('checkout.session.completed: set tier=', tier, 'for user', userId)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const proPriceId = Deno.env.get('STRIPE_PRO_PRICE_ID') ?? ''
        const storagePriceId = Deno.env.get('STRIPE_STORAGE_PRICE_ID') ?? ''

        // Skip incomplete subscriptions — they haven't been paid yet.
        // checkout.session.completed handles the initial pro upgrade after payment confirms.
        // Allowing incomplete subs to run here would race and revert tier to 'free'.
        if (subscription.status === 'incomplete' || subscription.status === 'incomplete_expired') break

        const { data: customer } = await supabaseAdmin
          .from('billing_customers')
          .select('user_id')
          .eq('stripe_customer_id', subscription.customer)
          .single()

        if (customer) {
          // Compute tier and storage from ALL active/trialing subscriptions for this customer
          // so storage add-ons purchased separately are accumulated correctly.
          const activeSubs = await stripe.subscriptions.list({
            customer: subscription.customer as string,
          })
          let totalStorage = 0
          let hasPro = false
          for (const sub of activeSubs.data) {
            if (sub.status !== 'active' && sub.status !== 'trialing') continue
            const items = sub.items.data
            totalStorage += storageFromItems(items, proPriceId, storagePriceId)
            if (items.some(i => i.price.id === proPriceId)) hasPro = true
          }
          const tier = hasPro ? 'pro' : 'free'

          await supabaseAdmin
            .from('profiles')
            .update({ tier, storage_limit_bytes: totalStorage })
            .eq('id', customer.user_id)

          console.log(`${event.type}: set tier=${tier} storage=${totalStorage} for user`, customer.user_id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const proPriceId = Deno.env.get('STRIPE_PRO_PRICE_ID') ?? ''
        const storagePriceId = Deno.env.get('STRIPE_STORAGE_PRICE_ID') ?? ''

        const { data: customer } = await supabaseAdmin
          .from('billing_customers')
          .select('user_id')
          .eq('stripe_customer_id', subscription.customer)
          .single()

        if (customer) {
          // Recompute from remaining active subscriptions
          const activeSubs = await stripe.subscriptions.list({
            customer: subscription.customer as string,
            status: 'active',
          })
          let totalStorage = 0
          let hasPro = false
          for (const sub of activeSubs.data) {
            const items = sub.items.data
            totalStorage += storageFromItems(items, proPriceId, storagePriceId)
            if (items.some(i => i.price.id === proPriceId)) hasPro = true
          }

          await supabaseAdmin
            .from('profiles')
            .update({ tier: hasPro ? 'pro' : 'free', storage_limit_bytes: totalStorage })
            .eq('id', customer.user_id)
        }
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice

        // Get user by stripe customer ID
        const { data: customer } = await supabaseAdmin
          .from('billing_customers')
          .select('user_id')
          .eq('stripe_customer_id', invoice.customer)
          .single()

        if (customer) {
          // Update or create invoice record
          await supabaseAdmin
            .from('invoices')
            .upsert({
              user_id: customer.user_id,
              stripe_invoice_id: invoice.id,
              period_start: new Date(invoice.period_start * 1000).toISOString(),
              period_end: new Date(invoice.period_end * 1000).toISOString(),
              total_charged_cost: (invoice.amount_paid || 0) / 100,
              status: 'paid',
              paid_at: new Date().toISOString(),
            }, {
              onConflict: 'stripe_invoice_id'
            })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        // Get user by stripe customer ID
        const { data: customer } = await supabaseAdmin
          .from('billing_customers')
          .select('user_id')
          .eq('stripe_customer_id', invoice.customer)
          .single()

        if (customer) {
          // Update invoice status
          await supabaseAdmin
            .from('invoices')
            .upsert({
              user_id: customer.user_id,
              stripe_invoice_id: invoice.id,
              period_start: new Date(invoice.period_start * 1000).toISOString(),
              period_end: new Date(invoice.period_end * 1000).toISOString(),
              total_charged_cost: (invoice.amount_due || 0) / 100,
              status: 'uncollectible',
            }, {
              onConflict: 'stripe_invoice_id'
            })
        }
        break
      }

      case 'payment_method.attached': {
        const paymentMethod = event.data.object as Stripe.PaymentMethod

        if (paymentMethod.customer) {
          // Update billing customer with payment method
          await supabaseAdmin
            .from('billing_customers')
            .update({ payment_method_id: paymentMethod.id })
            .eq('stripe_customer_id', paymentMethod.customer)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
