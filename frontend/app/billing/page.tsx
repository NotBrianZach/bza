'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Invoice, PricingConfig } from '@/types'
import { billingQueries, UserQuota } from '@/lib/queries'
import UsageStats from '@/components/billing/UsageStats'
import InvoiceList from '@/components/billing/InvoiceList'
import PricingTable from '@/components/billing/PricingTable'
import { CreditCard, TrendingUp, FileText, DollarSign, Loader2, ExternalLink, ArrowLeft, RefreshCw } from 'lucide-react'

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''
const stripeConfigured = stripeKey.startsWith('pk_') && stripeKey !== 'pk_test_placeholder'
const stripeTestMode = stripeConfigured && stripeKey.startsWith('pk_test_')

export default function BillingPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'pricing'>('overview')
  const [quota, setQuota] = useState<UserQuota | null>(null)
  const [costs, setCosts] = useState<Awaited<ReturnType<typeof billingQueries.getMonthlyCosts>> | null>(null)
  const [invoices, setInvoices] = useState<any[]>([])
  const [pricing, setPricing] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  // After Stripe checkout redirects back with ?upgraded=true, poll until the
  // webhook has updated tier to 'pro' (usually < 3s, timeout after 15s).
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!new URLSearchParams(window.location.search).has('upgraded')) return
    // Clear the query param so a refresh doesn't re-trigger
    router.replace('/billing', { scroll: false })

    let attempts = 0
    const maxAttempts = 8
    const poll = async () => {
      attempts++
      try {
        const q = await billingQueries.getQuota()
        if (q.tier === 'pro') {
          setQuota(q)
          setIsSyncing(false)
          return
        }
      } catch {}
      if (attempts < maxAttempts) {
        setTimeout(poll, 2000)
      } else {
        setIsSyncing(false)
      }
    }
    setIsSyncing(true)
    setTimeout(poll, 1500) // give webhook a head start
  }, [])

  const handleUpgrade = async () => {
    try {
      setIsRedirecting(true)
      setError(null)
      const url = await billingQueries.createCheckoutSession()
      window.location.href = url
    } catch (err: any) {
      setError(err.message || 'Failed to start checkout')
      setIsRedirecting(false)
    }
  }

  const handleManageSubscription = async () => {
    try {
      setIsRedirecting(true)
      setError(null)
      const url = await billingQueries.createPortalSession()
      window.location.href = url
    } catch (err: any) {
      setError(err.message || 'Failed to open billing portal')
      setIsRedirecting(false)
    }
  }

  const handleBuyStorage = async () => {
    try {
      setIsRedirecting(true)
      setError(null)
      const url = await billingQueries.createStorageCheckout(1)
      window.location.href = url
    } catch (err: any) {
      setError(err.message || 'Failed to start storage checkout')
      setIsRedirecting(false)
    }
  }

  const handleSyncSubscription = async () => {
    try {
      setIsSyncing(true)
      setSyncMessage(null)
      const result = await billingQueries.syncSubscription()
      // Refresh quota from DB after sync so all fields are up to date
      const q = await billingQueries.getQuota()
      setQuota(q)
      setSyncMessage(result.synced ? `Subscription synced — plan is now ${result.tier}.` : `Already up to date (${result.tier} plan).`)
    } catch (err: any) {
      setSyncMessage(`Sync failed: ${err.message}`)
    } finally {
      setIsSyncing(false)
    }
  }

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [quotaResult, costsResult, invoicesResult, pricingResult] = await Promise.allSettled([
        billingQueries.getQuota(),
        billingQueries.getMonthlyCosts(),
        billingQueries.listInvoices(),
        billingQueries.getPricing(),
      ])

      if (quotaResult.status === 'fulfilled') setQuota(quotaResult.value)
      else console.error('getQuota failed:', quotaResult.reason)

      // Auto-sync subscription tier from Stripe in the background
      billingQueries.syncSubscription().then(async (result) => {
        if (result.synced) {
          // Tier was updated — refresh quota so the UI reflects it
          try { setQuota(await billingQueries.getQuota()) } catch {}
        }
      }).catch(() => {/* silent — sync is best-effort */})

      if (costsResult.status === 'fulfilled') setCosts(costsResult.value)
      else console.error('getMonthlyCosts failed:', costsResult.reason)

      if (invoicesResult.status === 'fulfilled') setInvoices(invoicesResult.value)
      else console.error('listInvoices failed:', invoicesResult.reason)

      if (pricingResult.status === 'fulfilled') setPricing(pricingResult.value)
      else console.error('getPricing failed:', pricingResult.reason)

      // Only hard-fail if quota couldn't load (everything else is non-critical)
      if (quotaResult.status === 'rejected') {
        throw quotaResult.reason
      }
    } catch (err: any) {
      console.error('Error loading billing data:', err)
      setError('Failed to load billing information')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading billing information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="btn btn-secondary p-2"
                title="Back to library"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Billing & Usage</h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-gray-600 dark:text-gray-400">
                    {isSyncing
                      ? <span className="flex items-center gap-1"><Loader2 size={14} className="animate-spin" /> Syncing subscription…</span>
                      : quota ? `${quota.tier === 'pro' ? 'Pro' : 'Free'} plan` : 'Track your usage and manage billing'}
                  </p>
                  <button
                    onClick={handleSyncSubscription}
                    disabled={isSyncing || isLoading}
                    title="Re-sync subscription from Stripe"
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-40 transition-colors"
                  >
                    <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                  </button>
                  {syncMessage && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">{syncMessage}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {costs && (
                <div className="text-right mr-2">
                  <div className="text-sm text-gray-600 dark:text-gray-300">Current Month</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    ${costs.totalChargedCost.toFixed(2)}
                  </div>
                </div>
              )}
              {stripeTestMode && (
                <span className="text-xs font-medium bg-amber-100 text-amber-700 border border-amber-300 rounded px-2 py-1">
                  Stripe test mode
                </span>
              )}
              {!stripeConfigured && (
                <span className="text-xs font-medium bg-gray-100 text-gray-500 dark:text-gray-400 border border-gray-200 rounded px-2 py-1">
                  Billing not configured
                </span>
              )}
              {quota?.tier === 'pro' ? (
                <button
                  onClick={handleManageSubscription}
                  disabled={isRedirecting || !stripeConfigured}
                  className="btn btn-secondary disabled:opacity-50"
                >
                  {isRedirecting ? <Loader2 size={16} className="animate-spin mr-2" /> : <ExternalLink size={16} className="mr-2" />}
                  Manage Subscription
                </button>
              ) : stripeConfigured ? (
                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={handleUpgrade}
                    disabled={isRedirecting}
                    className="btn btn-primary disabled:opacity-50"
                  >
                    {isRedirecting ? <Loader2 size={16} className="animate-spin mr-2" /> : <CreditCard size={16} className="mr-2" />}
                    Upgrade to Pro
                  </button>
                  <span className="text-xs text-gray-500 dark:text-gray-400">$6.55/mo — includes $5 AI budget</span>
                </div>
              ) : (
                <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                  Payments coming soon
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-8">
            <TabButton
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              icon={<TrendingUp size={20} />}
              label="Overview"
            />
            <TabButton
              active={activeTab === 'invoices'}
              onClick={() => setActiveTab('invoices')}
              icon={<FileText size={20} />}
              label="Invoices"
            />
            <TabButton
              active={activeTab === 'pricing'}
              onClick={() => setActiveTab('pricing')}
              icon={<DollarSign size={20} />}
              label="Pricing"
            />
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && quota && costs && (
          <div className="space-y-6">
            {/* Quota Warning / Overage Notice */}
            {quota.spend_this_month >= quota.spend_limit && (
              <div className={`border rounded-lg p-4 ${quota.tier === 'pro' ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <h3 className={`text-sm font-semibold mb-2 ${quota.tier === 'pro' ? 'text-blue-900' : 'text-yellow-900'}`}>
                  {quota.tier === 'pro' ? 'Using Pay-as-you-go AI' : 'Free Quota Reached'}
                </h3>
                <p className={`text-sm ${quota.tier === 'pro' ? 'text-blue-800' : 'text-yellow-800'}`}>
                  {quota.tier === 'pro'
                    ? 'You\'ve used your $5 included AI budget this month. Additional usage is billed at cost (2× API rate) and will appear on your next invoice.'
                    : 'You\'ve used your $2 free AI budget. Upgrade to Pro for $5 included per month, then pay-as-you-go beyond that.'}
                </p>
                {quota.tier !== 'pro' && stripeConfigured && (
                  <button
                    onClick={handleUpgrade}
                    disabled={isRedirecting}
                    className="mt-3 btn btn-sm btn-primary"
                  >
                    {isRedirecting ? <Loader2 size={12} className="animate-spin mr-1" /> : null}
                    Upgrade to Pro
                  </button>
                )}
              </div>
            )}

            {/* Usage Breakdown */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Usage Breakdown</h2>
              </div>

              <div className="space-y-3">
                <UsageRow
                  label={quota.tier === 'pro' ? 'AI Spend (incl. $2 free + $3 pro)' : 'AI Spend (free tier)'}
                  value={`$${Number(quota.spend_this_month).toFixed(2)} / $${Number(quota.spend_limit).toFixed(2)} included`}
                  cost=""
                  percentage={Math.min(100, (Number(quota.spend_this_month) / Number(quota.spend_limit)) * 100)}
                />
                {quota.tier === 'pro' && Number(quota.spend_this_month) > Number(quota.spend_limit) && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 pl-1">
                    ${(Number(quota.spend_this_month) - Number(quota.spend_limit)).toFixed(2)} over included budget — billed at 2× API cost
                  </p>
                )}

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Total This Month</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">${costs.totalChargedCost.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>API Cost: ${costs.totalBaseCost.toFixed(2)}</span>
                    <span>BZA Markup: ${(costs.totalChargedCost - costs.totalBaseCost).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Storage */}
            {quota.storage_limit_bytes > 0 && (() => {
              const used = quota.storage_bytes_used
              const limit = quota.storage_limit_bytes
              const pct = Math.min(100, Math.round((used / limit) * 100))
              const usedGB = (used / (1024 ** 3)).toFixed(2)
              const limitGB = (limit / (1024 ** 3)).toFixed(1)
              const isWarning = pct >= 80
              return (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Cloud Storage</h3>
                  <div className="flex items-center justify-between mb-1 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{usedGB} GB used of {limitGB} GB</span>
                    <span className={pct >= 80 ? "font-semibold text-amber-600" : "text-gray-500"}>{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden mb-3">
                    <div
                      className={"h-2 rounded-full transition-all " + (isWarning ? "bg-amber-500" : "bg-primary-500")}
                      style={{ width: pct + "%" }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Each block adds 2 GB for $1/mo.
                    </p>
                    <button
                      onClick={handleBuyStorage}
                      disabled={isRedirecting || !stripeConfigured}
                      className="btn btn-sm btn-primary disabled:opacity-50"
                    >
                      {isRedirecting ? <span className="spinner mr-1.5" /> : null}
                      + 2 GB for $1/mo
                    </button>
                  </div>
                  {isWarning && (
                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">Storage almost full — add more to continue uploading documents.</p>
                  )}
                </div>
              )
            })()}
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="space-y-6">
            <InvoiceList invoices={invoices} />
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <PricingTable pricing={pricing} />
          </div>
        )}

      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors
        ${active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
        }
      `}
    >
      {icon}
      {label}
    </button>
  )
}

function UsageRow({
  label,
  value,
  cost,
  percentage,
}: {
  label: string
  value: string
  cost: string
  percentage: number
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-gray-700 dark:text-gray-300">{label}</span>
        <div className="text-right">
          <div className="font-medium text-gray-900 dark:text-gray-100">{value}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{cost}</div>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}

