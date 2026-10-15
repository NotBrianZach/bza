// stripe-overage.ts — Report AI cost overage to Stripe billing meter.
//
// Called after every api_usage INSERT in chat-with-book and generate-image.
// The DB function get_and_increment_overage atomically computes the delta
// (cents above the $3 included quota not yet sent to Stripe) and updates
// the reported counter, so concurrent requests never double-bill.

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

/**
 * If the user has exceeded their included quota ($3 / 300 cents of charged_cost),
 * report the new overage increment to the Stripe billing meter.
 *
 * Safe to call on every request — returns early with no side-effects when there
 * is no overage, when the user has no Stripe customer record, or when Stripe
 * env vars are missing.
 */
export async function reportOverageIfNeeded(
  db: SupabaseClient,
  userId: string,
): Promise<void> {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  const meterId   = Deno.env.get('STRIPE_METER_ID')
  if (!stripeKey || !meterId) return

  try {
    const { data, error } = await db.rpc('get_and_increment_overage', {
      p_user_id: userId,
    })
    if (error || !data?.length) return

    const { stripe_customer_id, delta_cents } = data[0] as {
      stripe_customer_id: string
      delta_cents: number
    }

    if (!stripe_customer_id || delta_cents <= 0) return

    // POST to Stripe billing meter events API
    const body = new URLSearchParams({
      event_name:                   'ai_usage_cents',
      timestamp:                    String(Math.floor(Date.now() / 1000)),
      'payload[stripe_customer_id]': stripe_customer_id,
      'payload[value]':             String(delta_cents),
    })

    const res = await fetch('https://api.stripe.com/v1/billing/meter_events', {
      method:  'POST',
      headers: {
        Authorization:  `Basic ${btoa(stripeKey + ':')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    if (!res.ok) {
      const err = await res.text()
      console.error(`[overage] Stripe meter event failed (${res.status}):`, err)
    } else {
      console.log(`[overage] reported ${delta_cents} cents for ${stripe_customer_id}`)
    }
  } catch (err) {
    // Non-fatal — log and continue; reconciliation script will catch any gaps
    console.error('[overage] error reporting overage:', err)
  }
}
