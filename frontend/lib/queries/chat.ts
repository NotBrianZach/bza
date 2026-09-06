import { supabase } from '../supabase'
import { ensureSession } from '../anonAuth'
import type { Conversation, ChatMessage } from './types'

const FUNCTIONS_BASE =
  (process.env.NEXT_PUBLIC_FUNCTIONS_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) +
  '/functions/v1'

// Chat Queries
// ===========================================

export const chatQueries = {
  /**
   * List conversations
   */
  async listConversations(bookId?: number): Promise<Conversation[]> {
    let query = supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false })

    if (bookId) {
      query = query.eq('book_id', bookId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  /**
   * Get conversation messages
   */
  async getMessages(conversationId: number): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Create a new conversation
   */
  async createConversation(
    bookId: number,
    title?: string,
    type: 'chat' | 'discussion' | 'reflection' = 'chat'
  ): Promise<Conversation> {
    const userId = await ensureSession()
    if (!userId) throw new Error('Could not create session')

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        book_id: bookId,
        title,
        conversation_type: type
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Send a message (calls Edge Function)
   */
  async sendMessage(
    conversationId: number,
    message: string,
    options: {
      model?: string
      includeContext?: boolean
      pageNum?: number
      personaPrompt?: string
    } = {}
  ): Promise<{ message: ChatMessage; usage: any }> {
    await ensureSession()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Could not create session')

    const response = await fetch(`${FUNCTIONS_BASE}/chat-with-book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        conversationId,
        message,
        model: options.model || 'gpt-4o-mini',
        includeContext: options.includeContext ?? true,
        pageNum: options.pageNum,
        personaPrompt: options.personaPrompt || undefined,
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to send message')
    }

    return await response.json()
  },

  /**
   * Quick chat (creates temp conversation and sends message)
   */
  async quickChat(
    bookId: number,
    message: string,
    pageNum?: number
  ): Promise<{ conversation: Conversation; response: ChatMessage }> {
    const conversation = await this.createConversation(bookId, 'Quick Chat')
    const result = await this.sendMessage(conversation.id, message, { pageNum })

    return {
      conversation,
      response: result.message
    }
  },

  /**
   * Generate discussion points for a page
   */
  async generateDiscussion(
    bookId: number,
    pageNum: number,
    numPoints: number = 3
  ): Promise<string[]> {
    await ensureSession()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Could not create session')

    const response = await fetch(`${FUNCTIONS_BASE}/generate-discussion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ bookId, pageNum, numPoints })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to generate discussion')
    }

    const data = await response.json()
    return data.questions
  }
}
