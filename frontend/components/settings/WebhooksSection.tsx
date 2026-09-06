'use client'

/**
 * WebhooksSection — Pro-only webhook CRUD settings section.
 *
 * Extracted from app/settings/page.tsx. Self-contained: owns webhooks list,
 * add-form state, per-webhook expand+deliveries state. Renders differently
 * per (isAuthenticated, isPro) — auth-gated at top-level, Pro-gated for CRUD.
 *
 * See ScoreBarsSection for the extraction pattern (task #5).
 */

import { useEffect, useState } from 'react'
import { webhookQueries, WEBHOOK_EVENTS, Webhook, WebhookDelivery } from '@/lib/queries/webhooks'

interface WebhooksSectionProps {
  isAuthenticated: boolean
  isPro: boolean
}

export default function WebhooksSection({ isAuthenticated, isPro }: WebhooksSectionProps) {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ url: '', events: [] as string[], secret: '' })
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [deliveries, setDeliveries] = useState<Record<number, WebhookDelivery[]>>({})

  useEffect(() => {
    if (isAuthenticated) webhookQueries.list().then(setWebhooks).catch(() => {})
  }, [isAuthenticated])

  if (!isAuthenticated) return null

  const toggleExpanded = (id: number) => {
    if (expandedId === id) {
      setExpandedId(null)
    } else {
      setExpandedId(id)
      webhookQueries.getDeliveries(id).then(d => setDeliveries(prev => ({ ...prev, [id]: d }))).catch(() => {})
    }
  }

  const togglePause = async (wh: Webhook) => {
    await webhookQueries.update(wh.id, { active: !wh.active })
    setWebhooks(ws => ws.map(w => w.id === wh.id ? { ...w, active: !w.active } : w))
  }

  const remove = async (id: number) => {
    if (!confirm('Delete this webhook?')) return
    await webhookQueries.delete(id)
    setWebhooks(ws => ws.filter(w => w.id !== id))
  }

  const create = async () => {
    if (!form.url || form.events.length === 0) return
    const created = await webhookQueries.create(form.url, form.events, form.secret || undefined)
    setWebhooks(ws => [created, ...ws])
    setForm({ url: '', events: [], secret: '' })
    setShowForm(false)
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-1">
        🔗 Webhooks <span className="text-[10px] font-bold px-1 py-0 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">Pro</span>
      </h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        POST notifications to your URL when events happen. Payloads are signed with HMAC-SHA256 if you set a secret.
      </p>
      {!isPro && (
        <div className="rounded-lg border border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/20 p-3 text-center">
          <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">Webhooks require a Pro subscription</p>
          <a href="/billing" className="text-xs text-purple-600 dark:text-purple-400 hover:underline mt-1 inline-block">Upgrade →</a>
        </div>
      )}

      {isPro && webhooks.length > 0 && (
        <div className="space-y-2 mb-4">
          {webhooks.map(wh => (
            <div key={wh.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate">{wh.url}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{wh.events.join(', ')}{!wh.active && ' · PAUSED'}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => togglePause(wh)}
                    className={`text-[10px] px-2 py-0.5 rounded ${wh.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {wh.active ? 'Active' : 'Paused'}
                  </button>
                  <button
                    onClick={() => toggleExpanded(wh.id)}
                    className="text-[10px] px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  >
                    Log
                  </button>
                  <button
                    onClick={() => remove(wh.id)}
                    className="text-[10px] px-2 py-0.5 rounded text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {expandedId === wh.id && (
                <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                  {(deliveries[wh.id] ?? []).length === 0 ? (
                    <p className="text-[10px] text-gray-400 italic">No deliveries yet</p>
                  ) : (deliveries[wh.id] ?? []).map(d => (
                    <div key={d.id} className="flex items-center gap-2 text-[10px]">
                      <span className={`font-mono ${d.status_code && d.status_code < 400 ? 'text-green-600' : 'text-red-600'}`}>{d.status_code ?? 'ERR'}</span>
                      <span className="text-gray-400">{d.event}</span>
                      <span className="text-gray-400 ml-auto">{new Date(d.delivered_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isPro && showForm ? (
        <div className="space-y-3 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <input
            type="url"
            value={form.url}
            onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
            placeholder="https://your-endpoint.com/webhook"
            className="input w-full text-sm"
          />
          <input
            type="text"
            value={form.secret}
            onChange={e => setForm(f => ({ ...f, secret: e.target.value }))}
            placeholder="HMAC secret (optional — for signature verification)"
            className="input w-full text-sm"
          />
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Events:</p>
            <div className="grid grid-cols-2 gap-1.5">
              {WEBHOOK_EVENTS.map(ev => (
                <label key={ev.id} className="flex items-start gap-1.5 text-[11px] text-gray-600 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded mt-0.5"
                    checked={form.events.includes(ev.id)}
                    onChange={e => setForm(f => ({
                      ...f,
                      events: e.target.checked ? [...f.events, ev.id] : f.events.filter(x => x !== ev.id)
                    }))}
                  />
                  <span><strong>{ev.label}</strong><br/><span className="text-gray-400">{ev.desc}</span></span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={create}
              disabled={!form.url || form.events.length === 0}
              className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-40"
            >
              Create Webhook
            </button>
            <button onClick={() => setShowForm(false)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
          </div>
        </div>
      ) : isPro ? (
        <button onClick={() => setShowForm(true)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
          + Add webhook
        </button>
      ) : null}
    </section>
  )
}
