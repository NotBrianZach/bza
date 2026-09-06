import { supabase } from '../supabase'
import type { ApiUsage, UserQuota } from './types'

const FUNCTIONS_BASE =
  (process.env.NEXT_PUBLIC_FUNCTIONS_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) +
  '/functions/v1'

// Billing Queries
// ===========================================

export const billingQueries = {
  /**
   * Get current usage quota
   */
  async getQuota(): Promise<UserQuota> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .rpc('get_user_quota', { user_uuid: user.id })

    if (error) throw error

    if (!data || data.length === 0) {
      return {
        tier: 'free',
        books_used: 0,
        books_limit: 999999,
        spend_this_month: 0,
        spend_limit: 5.0,
        storage_bytes_used: 0,
        storage_limit_bytes: 0,
      }
    }

    return data[0]
  },

  /**
   * Get API usage history
   */
  async getUsage(limit: number = 100): Promise<ApiUsage[]> {
    const { data, error } = await supabase
      .from('api_usage')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  },

  /**
   * Get monthly costs
   */
  async getMonthlyCosts(monthStart?: string): Promise<{
    totalCalls: number
    totalTokens: number
    totalImages: number
    totalBaseCost: number
    totalChargedCost: number
    breakdownByModel: any[]
  }> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .rpc('get_monthly_api_costs', {
        user_uuid: user.id,
        month_start: monthStart || new Date().toISOString()
      })

    if (error) throw error

    if (!data || data.length === 0) {
      return {
        totalCalls: 0,
        totalTokens: 0,
        totalImages: 0,
        totalBaseCost: 0,
        totalChargedCost: 0,
        breakdownByModel: []
      }
    }

    return {
      totalCalls: data[0].total_calls,
      totalTokens: data[0].total_tokens,
      totalImages: data[0].total_images,
      totalBaseCost: data[0].total_base_cost,
      totalChargedCost: data[0].total_charged_cost,
      breakdownByModel: data[0].breakdown_by_model
    }
  },

  /**
   * Get a single invoice with line items
   */
  async getInvoice(invoiceId: number): Promise<{ invoice: any; line_items: any[] }> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, invoice_line_items(*)')
      .eq('id', invoiceId)
      .single()

    if (error) throw error
    const { invoice_line_items, ...invoice } = data
    return { invoice, line_items: invoice_line_items || [] }
  },

  /**
   * List invoices
   */
  async listInvoices(): Promise<any[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('period_start', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Get pricing configuration
   */
  async getPricing(): Promise<any[]> {
    const { data, error } = await supabase
      .from('pricing_config')
      .select('*')
      .eq('active', true)
      .order('model', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Create a Stripe Checkout session to upgrade to Pro.
   * Returns the Stripe-hosted checkout URL.
   */
  async createCheckoutSession(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const res = await fetch(
      `${FUNCTIONS_BASE}/stripe-checkout`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      }
    )
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed to create checkout session')
    return json.url
  },

  /**
   * Create a Stripe Customer Portal session for managing an existing subscription.
   * Returns the Stripe-hosted portal URL.
   */
  async createPortalSession(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const res = await fetch(
      `${FUNCTIONS_BASE}/stripe-portal`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      }
    )
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed to create portal session')
    return json.url
  },

  /**
   * Re-sync subscription tier from live Stripe data.
   * Safe to call any time — idempotent. Returns the current tier after sync.
   */
  async syncSubscription(): Promise<{ tier: string; storage_limit_bytes: number; synced: boolean; reason?: string }> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const res = await fetch(`${FUNCTIONS_BASE}/sync-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Sync failed')
    return json
  },

  /** Create a Stripe Checkout for buying a storage add-on block (+2 GB for $1/mo).
   *  quantity = number of 2 GB blocks to purchase.
   */
  async createStorageCheckout(quantity = 1): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const res = await fetch(`${FUNCTIONS_BASE}/buy-storage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ quantity }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed to start storage checkout')
    return json.url
  },
}

// ===========================================
// Quiz Queries
