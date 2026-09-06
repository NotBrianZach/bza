/**
 * Supabase Queries - Replaces Flask API
 * Comprehensive query library for all BZA features
 */

import { supabase } from './supabase'
import { fileToTextWithPageMap, processDocumentViaCloudRun } from './pdfToMarkdown'

// Base URL for Supabase Edge Functions.
// In local dev, NEXT_PUBLIC_FUNCTIONS_URL points to `supabase functions serve` (port 54321).
// In production (or when serving from remote), falls back to the Supabase project URL.
const FUNCTIONS_BASE =
  (process.env.NEXT_PUBLIC_FUNCTIONS_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) +
  '/functions/v1'

// ===========================================
// Types
// ===========================================

export interface Book {
  id: number
  user_id: string
  file_path: string
  title: string
  article_type: string
  summary?: string
  synopsis?: string
  narrator?: string
  source_url?: string
  total_pages: number
  char_page_length: number
  created_at: string
  updated_at: string
}

export interface PageBookmark {
  id: number
  user_id: string
  book_id: number
  page_num: number
  note?: string
  created_at: string
}

export interface Conversation {
  id: number
  user_id: string
  book_id?: number
  title?: string
  conversation_type: 'chat' | 'discussion' | 'reflection'
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: number
  user_id: string
  conversation_id: number
  role: 'user' | 'assistant' | 'system'
  content: string
  page_num?: number
  metadata?: Record<string, any>
  created_at: string
}

export interface Character {
  id: number
  user_id: string
  book_id: number
  name: string
  type: 'person' | 'animal' | 'entity' | 'group'
  description?: string
  aliases?: string
  first_page?: number
  last_page?: number
  created_at: string
}

export interface PageImage {
  id: number
  user_id: string
  book_id: number
  page_num: number
  prompt: string
  image_url: string
  model: string
  size: string
  source: 'ai_generated' | 'extracted'
  created_at: string
}

export interface UserQuota {
  tier: string
  books_used: number
  books_limit: number
  spend_this_month: number
  spend_limit: number
}

export interface ApiUsage {
  id: number
  user_id: string
  api_provider: string
  model: string
  endpoint_type: string
  request_type?: string
  input_tokens: number
  output_tokens: number
  total_tokens: number
  base_cost: number
  charged_cost: number
  book_id?: number
  page_num?: number
  timestamp: string
}

// ===========================================
// Books Queries
// ===========================================

export const booksQueries = {
  /**
   * List all books for current user
   */
  async list(): Promise<Book[]> {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async listTrashed(): Promise<Book[]> {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async restore(bookId: number): Promise<void> {
    const { error } = await supabase
      .from('books')
      .update({ deleted_at: null })
      .eq('id', bookId)
    if (error) throw error
  },

  async emptyTrash(): Promise<void> {
    // Get all trashed books to remove their files
    const trashed = await this.listTrashed()
    for (const book of trashed) {
      const { error: dbError } = await supabase.from('books').delete().eq('id', book.id)
      if (dbError) throw dbError
      await supabase.storage.from('books').remove([book.file_path])
    }
  },

  /**
   * Get a single book by ID
   */
  async get(bookId: number): Promise<Book | null> {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Upload a book file and create database record
   */
  async upload(file: File, metadata: {
    title: string
    articleType?: string
    charPageLength?: number
    onStatus?: (status: string) => void
  }): Promise<Book> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Enforce per-tier book quota before uploading
    const { data: quotaRows } = await supabase.rpc('get_user_quota', { user_uuid: user.id })
    const quota = quotaRows?.[0]
    if (quota && quota.books_used >= quota.books_limit) {
      throw new Error(`Book limit reached (${quota.books_limit} books on your plan). Upgrade your plan to store more.`)
    }

    const charPageLength = metadata.charPageLength || 800
    const timestamp = Date.now()
    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-]/g, '_')
    const isPdf = file.name.toLowerCase().endsWith('.pdf')

    // PDFs go through the Cloud Run Marker pipeline; other formats are read directly
    let rawText: string
    let pageMap: number[]
    if (isPdf) {
      rawText = await processDocumentViaCloudRun(file, user.id, 'default', metadata.onStatus)
      pageMap = []
    } else {
      const result = await fileToTextWithPageMap(file)
      rawText = result.text
      pageMap = result.pageMap
    }

    // For PDFs: extract images client-side and embed refs into the markdown
    let finalMarkdown = rawText
    const pendingImages: Array<{ virtualPage: number; url: string; label: string }> = []

    if (isPdf && pageMap.length > 0) {
      try {
        const { extractImagesFromPdf } = await import('./pdfImageExtractor')
        const extracted = await extractImagesFromPdf(file)

        if (extracted.length > 0) {
          const PAGE_SEP = '\n\n---\n\n'
          const sections = rawText.split(PAGE_SEP)

          for (const img of extracted) {
            const sectionIdx = pageMap.indexOf(img.pdfPage)
            if (sectionIdx === -1) continue

            // Upload to storage at {userId}/{timestamp}_{baseName}_fig{N}.jpg
            const imgPath = `${user.id}/${timestamp}_${baseName}_fig${pendingImages.length + 1}.jpg`
            const { error: imgUploadErr } = await supabase.storage
              .from('page-images')
              .upload(imgPath, img.blob, { contentType: 'image/jpeg' })

            if (imgUploadErr) continue

            const { data: { publicUrl } } = supabase.storage
              .from('page-images')
              .getPublicUrl(imgPath)

            // Calculate virtual page from char offset at start of this section
            const charsBefore = sections
              .slice(0, sectionIdx)
              .join(PAGE_SEP).length + (sectionIdx > 0 ? PAGE_SEP.length : 0)
            const virtualPage = Math.floor(charsBefore / charPageLength) + 1

            // Embed inline image ref at end of the matching page section
            sections[sectionIdx] += `\n\n![${img.label}](${publicUrl})`
            pendingImages.push({ virtualPage, url: publicUrl, label: img.label })
          }

          finalMarkdown = sections.join(PAGE_SEP)
        }
      } catch (imgErr) {
        console.error('PDF image extraction failed (non-fatal):', imgErr)
      }
    }

    const totalPages = Math.ceil(finalMarkdown.length / charPageLength)

    // Store final markdown in books bucket
    const filePath = `${user.id}/${timestamp}_${baseName}.md`
    const { error: uploadError } = await supabase.storage
      .from('books')
      .upload(filePath, new Blob([finalMarkdown], { type: 'text/markdown' }))

    if (uploadError) throw uploadError

    // Create database record
    const { data, error } = await supabase
      .from('books')
      .insert({
        user_id: user.id,
        file_path: filePath,
        title: metadata.title,
        article_type: metadata.articleType || 'fiction',
        content_type: metadata.articleType || 'fiction',
        char_page_length: charPageLength,
        total_pages: totalPages,
      })
      .select()
      .single()

    if (error) {
      await supabase.storage.from('books').remove([filePath])
      throw error
    }

    // Insert page_images records for the Images tab (non-fatal if it fails)
    if (pendingImages.length > 0) {
      await supabase.from('page_images').insert(
        pendingImages.map(img => ({
          user_id: user.id,
          book_id: data.id,
          page_num: img.virtualPage,
          prompt: img.label,
          image_url: img.url,
          model: 'extracted',
          size: 'extracted',
          source: 'extracted',
        }))
      ).then(({ error: e }) => {
        if (e) console.error('Failed to store extracted image records:', e)
      })
    }

    return data
  },

  /**
   * Delete a book (from database and storage)
   */
  async delete(bookId: number): Promise<void> {
    const { error } = await supabase
      .from('books')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', bookId)
    if (error) throw error
  },

  /**
   * Update book metadata
   */
  async update(bookId: number, updates: Partial<Book>): Promise<Book> {
    const { data, error } = await supabase
      .from('books')
      .update(updates)
      .eq('id', bookId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Get book content from storage
   */
  async getContent(filePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('books')
      .download(filePath)

    if (error) throw error

    // Convert blob to text
    const text = await data.text()
    return text
  },

  /**
   * Get a specific page from a book
   */
  async getPage(bookId: number, pageNum: number): Promise<string> {
    const book = await this.get(bookId)
    if (!book) throw new Error('Book not found')

    const content = await this.getContent(book.file_path)

    // Calculate page boundaries
    const start = (pageNum - 1) * book.char_page_length
    const end = start + book.char_page_length

    return content.substring(start, end)
  },

  /**
   * Update reading progress
   */
  async updateProgress(bookId: number, pageNum: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Get or create current session
    const { data: sessions } = await supabase
      .from('reading_sessions')
      .select('*')
      .eq('book_id', bookId)
      .is('end_time', null)
      .order('start_time', { ascending: false })
      .limit(1)

    if (sessions && sessions.length > 0) {
      // Update existing session
      const session = sessions[0]
      const duration = Math.floor((Date.now() - new Date(session.start_time).getTime()) / 60000)

      await supabase
        .from('reading_sessions')
        .update({
          end_page: pageNum,
          end_time: new Date().toISOString(),
          duration_minutes: duration
        })
        .eq('id', session.id)
    } else {
      // Create new session
      await supabase
        .from('reading_sessions')
        .insert({
          user_id: user.id,
          book_id: bookId,
          start_page: pageNum,
          end_page: pageNum
        })
    }
  },

  /**
   * Get reading progress
   */
  async getProgress(bookId: number): Promise<{
    currentPage: number
    totalPages: number
    progressPercent: number
    timeSpentMinutes: number
  }> {
    const { data, error } = await supabase
      .rpc('get_reading_progress', { book_uuid: bookId })

    if (error) throw error

    if (!data || data.length === 0) {
      const book = await this.get(bookId)
      return {
        currentPage: 0,
        totalPages: book?.total_pages || 0,
        progressPercent: 0,
        timeSpentMinutes: 0
      }
    }

    return {
      currentPage: data[0].current_page,
      totalPages: data[0].total_pages,
      progressPercent: data[0].progress_percent,
      timeSpentMinutes: data[0].time_spent_minutes
    }
  }
}

// ===========================================
// Bookmarks Queries
// ===========================================

export const bookmarksQueries = {
  /**
   * List bookmarks for a book
   */
  async list(bookId: number): Promise<PageBookmark[]> {
    const { data, error } = await supabase
      .from('page_bookmarks')
      .select('*')
      .eq('book_id', bookId)
      .order('page_num', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Add a bookmark
   */
  async add(bookId: number, pageNum: number, note?: string): Promise<PageBookmark> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('page_bookmarks')
      .insert({
        user_id: user.id,
        book_id: bookId,
        page_num: pageNum,
        note
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Remove a bookmark
   */
  async remove(bookmarkId: number): Promise<void> {
    const { error } = await supabase
      .from('page_bookmarks')
      .delete()
      .eq('id', bookmarkId)

    if (error) throw error
  },

  /**
   * Update bookmark note
   */
  async update(bookmarkId: number, note: string): Promise<PageBookmark> {
    const { data, error } = await supabase
      .from('page_bookmarks')
      .update({ note })
      .eq('id', bookmarkId)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// ===========================================
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
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
    } = {}
  ): Promise<{ message: ChatMessage; usage: any }> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

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
        pageNum: options.pageNum
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
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

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

// ===========================================
// Character Queries
// ===========================================

export const characterQueries = {
  /**
   * List characters for a book
   */
  async list(bookId: number): Promise<Character[]> {
    const { data, error } = await supabase
      .from('characters')
      .select('*, character_mentions(page_num, evidence)')
      .eq('book_id', bookId)
      .order('first_page', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Analyze characters in a book (calls Edge Function)
   */
  async analyze(bookId: number, endPage?: number, currentPage?: number, forceRestart?: boolean): Promise<{ characters: any[]; charactersFound: number; hasMore: boolean; pagesAnalyzed: any }> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const response = await fetch(`${FUNCTIONS_BASE}/analyze-characters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ bookId, currentPage: currentPage ?? endPage ?? 9999, forceRestart })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || error.message || 'Failed to analyze characters')
    }

    return await response.json()
  },

  /**
   * Get character mentions
   */
  async getMentions(characterId: number): Promise<any[]> {
    const { data, error } = await supabase
      .from('character_mentions')
      .select('*')
      .eq('character_id', characterId)
      .order('page_num', { ascending: true })

    if (error) throw error
    return data || []
  }
}

// ===========================================
// Image Queries
// ===========================================

export const imageQueries = {
  /**
   * List images for a book
   */
  async list(bookId: number): Promise<PageImage[]> {
    const { data, error } = await supabase
      .from('page_images')
      .select('*')
      .eq('book_id', bookId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Generate an image for a page (calls Edge Function)
   */
  async generate(
    bookId: number,
    pageNum: number,
    prompt?: string
  ): Promise<PageImage> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const response = await fetch(`${FUNCTIONS_BASE}/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ bookId, pageNum, prompt })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to generate image')
    }

    return await response.json()
  },

  /**
   * Delete an image
   */
  async delete(imageId: number): Promise<void> {
    // Get image to find URL
    const { data: image } = await supabase
      .from('page_images')
      .select('*')
      .eq('id', imageId)
      .single()

    if (!image) throw new Error('Image not found')

    // Delete from database
    const { error: dbError } = await supabase
      .from('page_images')
      .delete()
      .eq('id', imageId)

    if (dbError) throw dbError

    // Extract path from URL and delete from storage
    const url = new URL(image.image_url)
    const path = url.pathname.split('/storage/v1/object/public/page-images/')[1]

    if (path) {
      await supabase.storage.from('page-images').remove([path])
    }
  }
}

// ===========================================
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
        books_limit: 3,
        spend_this_month: 0,
        spend_limit: 5.0
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
}

// ===========================================
// Quiz Queries
// ===========================================

export interface QuizQuestion {
  question: string
  options: [string, string, string, string]
  correct: number
  explanation: string
}

export type QuizFocusType = 'page' | 'book' | 'character' | 'custom'

export interface QuizFocus {
  type: QuizFocusType
  value?: string  // character name or custom topic
}

export const quizQueries = {
  async generate(bookId: number, pageNum: number, focus: QuizFocus = { type: 'page' }): Promise<QuizQuestion[]> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const res = await fetch(`${FUNCTIONS_BASE}/generate-quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ bookId, pageNum, focus }),
    })

    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed to generate quiz')
    return json.questions as QuizQuestion[]
  },
}

// ===========================================
// Picturebook Queries
// ===========================================

export interface PicturebookSettings {
  id: number
  user_id: string
  book_id: number
  preset: string
  image_style: string | null
  image_density: string
  images_per_1000_words: number
  image_size: string
  content_filter: string
  analysis_guidance: string | null
  negative_prompt: string | null
  theme: string
  image_provider: string
  custom_config: Record<string, any>
  created_at: string
  updated_at: string
}

export interface PicturebookMoment {
  id: number
  user_id: string
  book_id: number
  settings_id: number
  page_num: number
  after_text: string
  position_offset: number | null
  scene_description: string
  caption: string | null
  mood: string | null
  image_prompt: string | null
  image_url: string | null
  image_model: string | null
  image_size: string | null
  generation_status: 'pending' | 'generating' | 'completed' | 'failed' | 'skipped'
  generation_error: string | null
  moment_index: number
  created_at: string
  updated_at: string
}

export interface PicturebookRun {
  id: number
  user_id: string
  book_id: number
  settings_id: number | null
  status: 'analyzing' | 'generating' | 'completed' | 'failed' | 'cancelled'
  total_moments: number
  completed_moments: number
  total_cost: number
  started_at: string
  completed_at: string | null
  error: string | null
}

export type PicturebookPreset = 'childrens' | 'literary' | 'graphic_novel' | 'fantasy_art' | 'romantic' | 'horror' | 'custom'

export const PICTUREBOOK_PRESETS: Record<PicturebookPreset, { label: string; description: string; contentFilter: string }> = {
  childrens: { label: 'Children\'s', description: 'Watercolor, whimsical, family-friendly', contentFilter: 'strict' },
  literary: { label: 'Literary', description: 'Ink drawing, atmospheric, subtle', contentFilter: 'moderate' },
  graphic_novel: { label: 'Graphic Novel', description: 'Bold lines, dynamic, high contrast', contentFilter: 'moderate' },
  fantasy_art: { label: 'Fantasy Art', description: 'Epic painterly, rich detail', contentFilter: 'moderate' },
  romantic: { label: 'Romantic', description: 'Soft lighting, intimate, warm', contentFilter: 'permissive' },
  horror: { label: 'Horror', description: 'Dark, grotesque, unsettling', contentFilter: 'permissive' },
  custom: { label: 'Custom', description: 'Configure all settings yourself', contentFilter: 'moderate' },
}

export type PicturebookProvider = 'openrouter' | 'webgpu' | 'local'

export const OPENROUTER_IMAGE_MODELS = [
  { id: 'openai/gpt-5-image', label: 'GPT-5 Image', cost: '~$0.04' },
  { id: 'openai/gpt-5-image-mini', label: 'GPT-5 Image Mini', cost: '~$0.02' },
  { id: 'openai/gpt-5.4-image-2', label: 'GPT-5.4 Image 2', cost: '~$0.06' },
  { id: 'google/gemini-2.5-flash-image', label: 'Gemini 2.5 Flash Image', cost: '~$0.003' },
  { id: 'google/gemini-3-pro-image-preview', label: 'Gemini 3 Pro Image', cost: '~$0.01' },
  { id: 'google/gemini-3.1-flash-image-preview', label: 'Gemini 3.1 Flash Image', cost: '~$0.005' },
  { id: 'black-forest-labs/flux.2-pro', label: 'FLUX.2 Pro', cost: '~$0.05' },
  { id: 'black-forest-labs/flux.2-max', label: 'FLUX.2 Max', cost: '~$0.08' },
  { id: 'black-forest-labs/flux.2-flex', label: 'FLUX.2 Flex', cost: '~$0.03' },
  { id: 'black-forest-labs/flux.2-klein-4b', label: 'FLUX.2 Klein 4B', cost: '~$0.01' },
  { id: 'recraft/recraft-v4.1-pro', label: 'Recraft v4.1 Pro', cost: '~$0.04' },
  { id: 'recraft/recraft-v4.1', label: 'Recraft v4.1', cost: '~$0.02' },
  { id: 'bytedance-seed/seedream-4.5', label: 'SeedDream 4.5', cost: '~$0.02' },
  { id: 'sourceful/riverflow-v2.5-pro', label: 'Riverflow v2.5 Pro', cost: '~$0.04' },
  { id: 'x-ai/grok-imagine-image-quality', label: 'Grok Imagine (Quality)', cost: '~$0.01' },
  { id: 'microsoft/mai-image-2.5', label: 'MAI Image 2.5', cost: '~$0.03' },
] as const

export const TRANSLATE_MODELS = [
  // General purpose
  { id: 'deepseek/deepseek-chat-v3', label: 'DeepSeek V3', cost: '~$0.0005/page' },
  { id: 'deepseek/deepseek-v3.2', label: 'DeepSeek V3.2', cost: '~$0.0005/page' },
  { id: 'anthropic/claude-haiku-4-5', label: 'Claude Haiku 4.5', cost: '~$0.001/page' },
  { id: 'anthropic/claude-sonnet-4-5', label: 'Claude Sonnet 4.5', cost: '~$0.01/page' },
  { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', cost: '~$0.0002/page' },
  { id: 'openai/gpt-5-mini', label: 'GPT-5 Mini', cost: '~$0.005/page' },
  { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', cost: '~$0.0003/page' },
  { id: 'meta-llama/llama-4-maverick', label: 'Llama 4 Maverick', cost: '~$0.0005/page' },
  { id: 'mistralai/mistral-large-2512', label: 'Mistral Large', cost: '~$0.001/page' },
  // Uncensored / NSFW-friendly
  { id: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free', label: 'Dolphin Venice 24B (free, uncensored)', cost: 'free' },
  { id: 'nousresearch/hermes-3-llama-3.1-405b', label: 'Hermes 3 405B (uncensored)', cost: '~$0.002/page' },
  { id: 'anthracite-org/magnum-v4-72b', label: 'Magnum V4 72B (uncensored)', cost: '~$0.006/page' },
  { id: 'sao10k/l3.3-euryale-70b', label: 'Euryale 70B (uncensored, creative)', cost: '~$0.001/page' },
  { id: 'thedrummer/rocinante-12b', label: 'Rocinante 12B (uncensored)', cost: '~$0.0004/page' },
  { id: 'sao10k/l3.1-70b-hanami-x1', label: 'Hanami 70B (uncensored, RP)', cost: '~$0.006/page' },
] as const

export const TTS_MODELS = [
  { id: 'tts-1', label: 'TTS-1 (fast)', cost: '$0.015/1K chars' },
  { id: 'tts-1-hd', label: 'TTS-1 HD (quality)', cost: '$0.030/1K chars' },
] as const

export const TTS_VOICES = [
  { id: 'alloy', label: 'Alloy (neutral)' },
  { id: 'echo', label: 'Echo (warm male)' },
  { id: 'fable', label: 'Fable (British)' },
  { id: 'onyx', label: 'Onyx (deep male)' },
  { id: 'nova', label: 'Nova (friendly female)' },
  { id: 'shimmer', label: 'Shimmer (clear female)' },
] as const

export const picturebookQueries = {
  /**
   * Get settings for a book's picturebook
   */
  async getSettings(bookId: number): Promise<PicturebookSettings | null> {
    const { data, error } = await supabase
      .from('picturebook_settings')
      .select('*')
      .eq('book_id', bookId)
      .maybeSingle()

    if (error) throw error
    return data
  },

  /**
   * List all moments for a book
   */
  async listMoments(bookId: number): Promise<PicturebookMoment[]> {
    const { data, error } = await supabase
      .from('picturebook_moments')
      .select('*')
      .eq('book_id', bookId)
      .order('moment_index', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Get moments for a specific page
   */
  async getMomentsForPage(bookId: number, pageNum: number): Promise<PicturebookMoment[]> {
    const { data, error } = await supabase
      .from('picturebook_moments')
      .select('*')
      .eq('book_id', bookId)
      .eq('page_num', pageNum)
      .order('moment_index', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Get latest run for a book
   */
  async getLatestRun(bookId: number): Promise<PicturebookRun | null> {
    const { data, error } = await supabase
      .from('picturebook_runs')
      .select('*')
      .eq('book_id', bookId)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data
  },

  /**
   * Generate picturebook (calls Edge Function)
   */
  async generate(
    bookId: number,
    options: {
      preset?: PicturebookPreset
      imageStyle?: string
      contentFilter?: string
      analysisGuidance?: string
      negativePrompt?: string
      imageModel?: string
      analysisModel?: string // LLM for text analysis
      imagesPerThousandWords?: number
      theme?: string
      pageRange?: { start: number; end: number }
      regenerate?: boolean
      analyzeOnly?: boolean // skip image gen (for WebGPU client-side gen)
    } = {}
  ): Promise<{
    status: string
    runId?: number
    settingsId?: number
    totalMoments?: number
    completedImages?: number
    totalCost?: number
    bookId?: number
    moments?: any[]
  }> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const res = await fetch(`${FUNCTIONS_BASE}/generate-picturebook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ bookId, ...options }),
    })

    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed to generate picturebook')
    return json
  },

  /**
   * Delete all picturebook data for a book
   */
  async clear(bookId: number): Promise<void> {
    const { error: e1 } = await supabase
      .from('picturebook_moments')
      .delete()
      .eq('book_id', bookId)
    if (e1) throw e1

    const { error: e2 } = await supabase
      .from('picturebook_runs')
      .delete()
      .eq('book_id', bookId)
    if (e2) throw e2

    const { error: e3 } = await supabase
      .from('picturebook_settings')
      .delete()
      .eq('book_id', bookId)
    if (e3) throw e3
  },

  /**
   * Skip/unskip a moment (toggle between skipped and pending/completed)
   */
  async toggleSkip(momentId: number, currentStatus: string): Promise<void> {
    const newStatus = currentStatus === 'skipped' ? 'pending' : 'skipped'
    const { error } = await supabase
      .from('picturebook_moments')
      .update({ generation_status: newStatus })
      .eq('id', momentId)
    if (error) throw error
  },

  async retryFailed(bookId: number, options: { imageModel?: string; preset?: string } = {}) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')
    const res = await fetch(`${FUNCTIONS_BASE}/generate-picturebook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({ bookId, retryFailed: true, ...options }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Retry failed')
    return json
  },

  async cancel(bookId: number) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')
    const res = await fetch(`${FUNCTIONS_BASE}/generate-picturebook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({ bookId, cancel: true }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Cancel failed')
    return json
  },

  async getFailedCount(bookId: number): Promise<number> {
    const { count, error } = await supabase
      .from('picturebook_moments')
      .select('id', { count: 'exact', head: true })
      .eq('book_id', bookId)
      .in('generation_status', ['failed', 'pending'])
    if (error) throw error
    return count || 0
  },
}
