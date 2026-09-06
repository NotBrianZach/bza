import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Internal webhook dispatch endpoint.
 * Called from other server code to fire webhooks for a user's event.
 * Not meant to be called directly by clients.
 */
export async function POST(req: NextRequest) {
  const { userId, event, payload } = await req.json() as {
    userId: string
    event: string
    payload: Record<string, any>
  }

  if (!userId || !event) {
    return NextResponse.json({ error: 'userId and event required' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Get active webhooks for this user subscribed to this event
  const { data: webhooks } = await supabase
    .from('webhooks')
    .select('id, url, secret, events')
    .eq('user_id', userId)
    .eq('active', true)

  const matching = (webhooks ?? []).filter(w => w.events.includes(event) || w.events.includes('*'))
  if (matching.length === 0) {
    return NextResponse.json({ dispatched: 0 })
  }

  const envelope = {
    event,
    timestamp: new Date().toISOString(),
    data: payload,
  }

  const results = await Promise.allSettled(
    matching.map(async (webhook) => {
      const body = JSON.stringify(envelope)
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Webhook-Event': event,
      }

      // HMAC-SHA256 signature if secret is set
      if (webhook.secret) {
        const encoder = new TextEncoder()
        const key = await crypto.subtle.importKey(
          'raw',
          encoder.encode(webhook.secret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign'],
        )
        const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
        headers['X-Webhook-Signature'] = `sha256=${Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')}`
      }

      let statusCode: number | null = null
      let responseBody: string | null = null
      let error: string | null = null

      try {
        const res = await fetch(webhook.url, {
          method: 'POST',
          headers,
          body,
          signal: AbortSignal.timeout(10000),
        })
        statusCode = res.status
        responseBody = await res.text().catch(() => null)
      } catch (err: any) {
        error = err.message ?? 'Delivery failed'
      }

      // Log delivery
      await supabase.from('webhook_deliveries').insert({
        webhook_id: webhook.id,
        event,
        payload: envelope,
        status_code: statusCode,
        response_body: responseBody?.slice(0, 1000) ?? null,
        error,
      })

      return { webhookId: webhook.id, statusCode, error }
    })
  )

  return NextResponse.json({ dispatched: matching.length, results: results.map(r => r.status === 'fulfilled' ? r.value : { error: 'failed' }) })
}
