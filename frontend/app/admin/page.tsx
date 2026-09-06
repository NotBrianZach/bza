'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2, Save, Plus, RefreshCw, TrendingUp, Users, BookOpen, DollarSign } from 'lucide-react'

interface PricingRow {
  id: number
  model: string
  provider: string
  input_cost_per_1m: number | null
  output_cost_per_1m: number | null
  image_cost: number | null
  markup_multiplier: number
  active: boolean
  effective_date: string
}

interface Stats {
  month: string
  total_api_calls: number
  total_base_cost: number
  total_charged_cost: number
  margin: string | null
  by_model: { model: string; calls: number; base_cost: number; charged_cost: number }[]
  total_users: number
  users_by_tier: Record<string, number>
  books_added_this_month: number
}

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [pricing, setPricing] = useState<PricingRow[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [edits, setEdits] = useState<Record<number, Partial<PricingRow>>>({})
  const [saving, setSaving] = useState<number | null>(null)
  const [saveErr, setSaveErr] = useState<Record<number, string>>({})
  const [newRow, setNewRow] = useState({ model: '', provider: 'openai', input_cost_per_1m: '', output_cost_per_1m: '', image_cost: '', markup_multiplier: '2.0' })
  const [addingRow, setAddingRow] = useState(false)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email !== 'poinkcompany@gmail.com') {
      router.replace('/')
      return
    }
    await Promise.all([loadPricing(), loadStats()])
    setLoading(false)
  }

  const loadPricing = async () => {
    const res = await fetch('/api/admin/pricing')
    if (res.ok) setPricing(await res.json())
  }

  const loadStats = async () => {
    setStatsLoading(true)
    const res = await fetch('/api/admin/stats')
    if (res.ok) setStats(await res.json())
    setStatsLoading(false)
  }

  const save = async (row: PricingRow) => {
    const patch = edits[row.id]
    if (!patch || Object.keys(patch).length === 0) return
    setSaving(row.id)
    setSaveErr(prev => ({ ...prev, [row.id]: '' }))
    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, ...patch }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      const updated = await res.json()
      setPricing(prev => prev.map(r => r.id === row.id ? updated : r))
      setEdits(prev => { const e = { ...prev }; delete e[row.id]; return e })
    } catch (e: any) {
      setSaveErr(prev => ({ ...prev, [row.id]: e.message }))
    } finally {
      setSaving(null)
    }
  }

  const addRow = async () => {
    setAddingRow(true)
    try {
      const body: any = { model: newRow.model, provider: newRow.provider, active: true }
      if (newRow.input_cost_per_1m) body.input_cost_per_1m = parseFloat(newRow.input_cost_per_1m)
      if (newRow.output_cost_per_1m) body.output_cost_per_1m = parseFloat(newRow.output_cost_per_1m)
      if (newRow.image_cost) body.image_cost = parseFloat(newRow.image_cost)
      body.markup_multiplier = parseFloat(newRow.markup_multiplier) || 2.0
      const res = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      await loadPricing()
      setNewRow({ model: '', provider: 'openai', input_cost_per_1m: '', output_cost_per_1m: '', image_cost: '', markup_multiplier: '2.0' })
    } catch (e: any) {
      alert(e.message)
    } finally {
      setAddingRow(false)
    }
  }

  const field = (row: PricingRow, key: keyof PricingRow) =>
    (edits[row.id]?.[key] as any) ?? (row[key] as any) ?? ''

  const setField = (id: number, key: keyof PricingRow, value: any) =>
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [key]: value } }))

  const isDirty = (id: number) => !!(edits[id] && Object.keys(edits[id]).length > 0)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin" size={32} />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
        <button onClick={loadStats} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          <RefreshCw size={14} /> Refresh stats
        </button>
      </div>

      {/* Stats */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">This Month</h2>
        {statsLoading ? (
          <div className="flex items-center gap-2 text-gray-400"><Loader2 size={16} className="animate-spin" /> Loading…</div>
        ) : stats ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: TrendingUp, label: 'API calls', value: stats.total_api_calls.toLocaleString() },
                { icon: DollarSign, label: 'Revenue (charged)', value: `$${stats.total_charged_cost.toFixed(4)}` },
                { icon: DollarSign, label: 'Cost (base)', value: `$${stats.total_base_cost.toFixed(4)}` },
                { icon: TrendingUp, label: 'Margin', value: stats.margin ? `${stats.margin}%` : 'N/A' },
                { icon: Users, label: 'Total users', value: stats.total_users.toLocaleString() },
                { icon: Users, label: 'Pro users', value: (stats.users_by_tier.pro || 0).toLocaleString() },
                { icon: BookOpen, label: 'Books added', value: stats.books_added_this_month.toLocaleString() },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <Icon size={12} />{label}
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{value}</div>
                </div>
              ))}
            </div>

            {/* Per-model breakdown */}
            {stats.by_model.length > 0 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400 uppercase">
                    <tr>
                      <th className="text-left px-4 py-2">Model</th>
                      <th className="text-right px-4 py-2">Calls</th>
                      <th className="text-right px-4 py-2">Base cost</th>
                      <th className="text-right px-4 py-2">Charged</th>
                      <th className="text-right px-4 py-2">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {stats.by_model.sort((a, b) => b.charged_cost - a.charged_cost).map(m => (
                      <tr key={m.model}>
                        <td className="px-4 py-2 font-mono text-xs">{m.model}</td>
                        <td className="px-4 py-2 text-right">{m.calls.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right">${m.base_cost.toFixed(4)}</td>
                        <td className="px-4 py-2 text-right">${m.charged_cost.toFixed(4)}</td>
                        <td className="px-4 py-2 text-right text-green-600 dark:text-green-400">
                          {m.base_cost > 0 ? `${((m.charged_cost - m.base_cost) / m.base_cost * 100).toFixed(0)}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : <p className="text-sm text-gray-400">Failed to load stats.</p>}
      </section>

      {/* Pricing config */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Pricing Config</h2>
          <span className="text-xs text-gray-400">Markup is per-model; edge functions read it from DB on each call</span>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400 uppercase">
              <tr>
                <th className="text-left px-3 py-2">Model</th>
                <th className="text-left px-3 py-2">Provider</th>
                <th className="text-right px-3 py-2">Input /1M</th>
                <th className="text-right px-3 py-2">Output /1M</th>
                <th className="text-right px-3 py-2">Image</th>
                <th className="text-right px-3 py-2">Markup</th>
                <th className="text-right px-3 py-2">Charged input /1M</th>
                <th className="text-right px-3 py-2">Active</th>
                <th className="px-3 py-2 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {pricing.map(row => {
                const inp = parseFloat(field(row, 'input_cost_per_1m')) || 0
                const markup = parseFloat(field(row, 'markup_multiplier')) || 2.0
                return (
                  <tr key={row.id} className={isDirty(row.id) ? 'bg-amber-50 dark:bg-amber-900/20' : ''}>
                    <td className="px-3 py-2 font-mono text-xs">{row.model}</td>
                    <td className="px-3 py-2 text-gray-500 dark:text-gray-400 text-xs">{row.provider}</td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number" step="0.001" min="0"
                        value={field(row, 'input_cost_per_1m')}
                        onChange={e => setField(row.id, 'input_cost_per_1m', parseFloat(e.target.value))}
                        className="w-20 text-right bg-transparent border-b border-gray-200 dark:border-gray-600 focus:outline-none focus:border-violet-500 text-xs py-0.5"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number" step="0.001" min="0"
                        value={field(row, 'output_cost_per_1m')}
                        onChange={e => setField(row.id, 'output_cost_per_1m', parseFloat(e.target.value))}
                        className="w-20 text-right bg-transparent border-b border-gray-200 dark:border-gray-600 focus:outline-none focus:border-violet-500 text-xs py-0.5"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number" step="0.001" min="0"
                        value={field(row, 'image_cost')}
                        onChange={e => setField(row.id, 'image_cost', parseFloat(e.target.value))}
                        className="w-16 text-right bg-transparent border-b border-gray-200 dark:border-gray-600 focus:outline-none focus:border-violet-500 text-xs py-0.5"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number" step="0.1" min="1"
                        value={field(row, 'markup_multiplier')}
                        onChange={e => setField(row.id, 'markup_multiplier', parseFloat(e.target.value))}
                        className="w-14 text-right bg-transparent border-b border-gray-200 dark:border-gray-600 focus:outline-none focus:border-violet-500 text-xs py-0.5"
                      />
                      <span className="text-xs text-gray-400 ml-0.5">×</span>
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-gray-400">
                      {inp ? `$${(inp * markup).toFixed(3)}` : '—'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="checkbox"
                        checked={field(row, 'active') ?? true}
                        onChange={e => setField(row.id, 'active', e.target.checked)}
                        className="accent-violet-600"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      {isDirty(row.id) && (
                        <button
                          onClick={() => save(row)}
                          disabled={saving === row.id}
                          className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 disabled:opacity-50 font-medium"
                        >
                          {saving === row.id ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                          Save
                        </button>
                      )}
                      {saveErr[row.id] && <p className="text-xs text-red-500 mt-1">{saveErr[row.id]}</p>}
                    </td>
                  </tr>
                )
              })}

              {/* Add new row */}
              <tr className="bg-gray-50 dark:bg-gray-700/30">
                <td className="px-3 py-2">
                  <input
                    value={newRow.model} onChange={e => setNewRow(p => ({ ...p, model: e.target.value }))}
                    placeholder="model name"
                    className="w-full text-xs bg-transparent border-b border-gray-300 dark:border-gray-500 focus:outline-none focus:border-violet-500 py-0.5 font-mono"
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={newRow.provider} onChange={e => setNewRow(p => ({ ...p, provider: e.target.value }))}
                    className="text-xs bg-transparent border-b border-gray-300 dark:border-gray-500 focus:outline-none py-0.5"
                  >
                    <option>openai</option><option>anthropic</option><option>openrouter</option>
                  </select>
                </td>
                <td className="px-3 py-2 text-right">
                  <input type="number" step="0.001" min="0" placeholder="0.00"
                    value={newRow.input_cost_per_1m} onChange={e => setNewRow(p => ({ ...p, input_cost_per_1m: e.target.value }))}
                    className="w-20 text-right text-xs bg-transparent border-b border-gray-300 dark:border-gray-500 focus:outline-none focus:border-violet-500 py-0.5"
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <input type="number" step="0.001" min="0" placeholder="0.00"
                    value={newRow.output_cost_per_1m} onChange={e => setNewRow(p => ({ ...p, output_cost_per_1m: e.target.value }))}
                    className="w-20 text-right text-xs bg-transparent border-b border-gray-300 dark:border-gray-500 focus:outline-none focus:border-violet-500 py-0.5"
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <input type="number" step="0.001" min="0" placeholder="0.00"
                    value={newRow.image_cost} onChange={e => setNewRow(p => ({ ...p, image_cost: e.target.value }))}
                    className="w-16 text-right text-xs bg-transparent border-b border-gray-300 dark:border-gray-500 focus:outline-none focus:border-violet-500 py-0.5"
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <input type="number" step="0.1" min="1" placeholder="2.0"
                    value={newRow.markup_multiplier} onChange={e => setNewRow(p => ({ ...p, markup_multiplier: e.target.value }))}
                    className="w-14 text-right text-xs bg-transparent border-b border-gray-300 dark:border-gray-500 focus:outline-none focus:border-violet-500 py-0.5"
                  />
                  <span className="text-xs text-gray-400 ml-0.5">×</span>
                </td>
                <td colSpan={2} className="px-3 py-2 text-right">
                  <button
                    onClick={addRow}
                    disabled={addingRow || !newRow.model.trim()}
                    className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 disabled:opacity-40 font-medium ml-auto"
                  >
                    {addingRow ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                    Add
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-400 mt-2">
          Changes take effect immediately for new API calls. Existing <code>api_usage</code> rows are not retroactively updated.
        </p>
      </section>
    </div>
  )
}
