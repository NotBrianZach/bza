import { supabase } from '../supabase'

export interface Webhook {
  id: number
  user_id: string
  url: string
  secret: string | null
  events: string[]
  active: boolean
  created_at: string
  updated_at: string
}

export interface WebhookDelivery {
  id: number
  webhook_id: number
  event: string
  payload: Record<string, any>
  status_code: number | null
  response_body: string | null
  error: string | null
  delivered_at: string
}

// Available webhook events
export const WEBHOOK_EVENTS = [
  { id: 'book.uploaded', label: 'Book Uploaded', desc: 'When a new book/article is added to your library' },
  { id: 'book.deleted', label: 'Book Deleted', desc: 'When a book is moved to trash' },
  { id: 'book.progress', label: 'Reading Progress', desc: 'When you reach 25%, 50%, 75%, or 100% of a book' },
  { id: 'analysis.characters', label: 'Character Analysis', desc: 'When character analysis completes on a book' },
  { id: 'analysis.structure', label: 'Structure Analysis', desc: 'When structure/concept analysis completes' },
  { id: 'quiz.completed', label: 'Quiz Completed', desc: 'When you finish a quiz session' },
  { id: 'problem.solved', label: 'Problem Solved', desc: 'When a solution space is saved in problem sets' },
  { id: 'bookmark.created', label: 'Bookmark Created', desc: 'When you add a bookmark' },
] as const

export const webhookQueries = {
  async list(): Promise<Webhook[]> {
    const { data, error } = await supabase
      .from('webhooks')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  async create(url: string, events: string[], secret?: string): Promise<Webhook> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) throw new Error('Not authenticated')
    const { data, error } = await supabase
      .from('webhooks')
      .insert({ user_id: session.user.id, url, events, secret: secret || null })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: number, updates: Partial<Pick<Webhook, 'url' | 'events' | 'secret' | 'active'>>): Promise<void> {
    const { error } = await supabase
      .from('webhooks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase.from('webhooks').delete().eq('id', id)
    if (error) throw error
  },

  async getDeliveries(webhookId: number, limit = 20): Promise<WebhookDelivery[]> {
    const { data, error } = await supabase
      .from('webhook_deliveries')
      .select('*')
      .eq('webhook_id', webhookId)
      .order('delivered_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data ?? []
  },
}
