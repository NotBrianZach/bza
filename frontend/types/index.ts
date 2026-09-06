/**
 * TypeScript Type Definitions for BZA v2
 */

// User & Auth
export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  stripe_customer_id?: string
  tier: 'free' | 'pro' | 'enterprise'
  created_at: string
  updated_at: string
}

export interface Session {
  access_token: string
  refresh_token: string
  expires_at: number
  user: User
}

// Books
export interface Book {
  id: number
  user_id: string
  title: string
  file_path: string
  total_pages: number
  content_type?: 'fiction' | 'textbook' | 'academic_paper' | 'math_textbook' | 'wikipedia_article' | 'news_article' | 'forum_thread' | 'essay' | 'reference' | 'biography' | 'chat_book' | 'manga'
  char_page_length?: number
  summary?: string
  synopsis?: string
  narrator?: string
  source_url?: string
  wiki_revid?: string
  pinned?: boolean
  pinned_at?: string | null
  last_read_at?: string | null
  wiki_followed?: boolean
  wiki_news_revid?: string | null
  scores?: Record<string, number>
  deleted_at?: string | null
  language?: string | null
  search_text?: string | null
  cover_url?: string
  created_at: string
  updated_at: string
}

export interface ScoreBar {
  id: string
  label: string
  prompt: string
  leftLabel: string
  rightLabel: string
  enabled: boolean
}

export interface WikiUpdate {
  id: number
  book_id: number
  user_id: string
  from_revid: string
  to_revid: string
  diff_rows: { type: number; content: string }[]
  diff_url?: string
  checked_at: string
  dismissed: boolean
  dismissed_at?: string | null
  books?: { id: number; title: string; source_url?: string }
}

export interface QuizCard {
  id: number
  user_id: string
  book_id: number
  question: string
  options: string[]
  correct_index: number
  explanation?: string
  interval_days: number
  ease_factor: number
  repetitions: number
  next_review_at: string
  last_reviewed_at?: string | null
  created_at: string
}

export interface KnowledgeNode {
  id: number
  book_id: number
  user_id: string
  label: string
  description?: string
  page_refs: number[]
  mastered: boolean
  mastery_score: number
  interval_days: number
  ease_factor: number
  repetitions: number
  next_review_at: string
  last_reviewed_at?: string | null
  created_at: string
}

export interface KnowledgeEdge {
  id: number
  book_id: number
  from_node: number
  to_node: number
}

export interface Page {
  book_id: number
  page_num: number
  content: string
  word_count: number
  has_images: boolean
}

export interface ReadingProgress {
  book_id: number
  current_page: number
  total_pages: number
  progress_percentage: number
  last_read_at?: string
  reading_time_minutes: number
}

export interface Bookmark {
  id: number
  book_id: number
  page_number: number
  note?: string
  created_at: string
  updated_at?: string
}

export interface BookStats {
  character_count: number
  chat_message_count: number
  image_count: number
  bookmark_count: number
}

// Chat & Conversations
export interface Conversation {
  id: number
  user_id: string
  book_id: number
  title: string
  context_type: 'book' | 'page'
  page_num?: number
  message_count?: number
  created_at: string
  last_message_at?: string
}

export interface ChatMessage {
  id: number | string
  conversation_id?: number
  book_id?: number
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

export interface ChatResponse {
  user_message: ChatMessage
  assistant_message: ChatMessage
  usage: {
    input_tokens: number
    output_tokens: number
    charged_cost: number
  }
}

// Characters
export interface Character {
  id: number
  book_id: number
  name: string
  type?: 'person' | 'place' | 'organization' | 'other'
  role?: string
  description?: string
  first_appearance?: number
  first_page?: number
  last_page?: number
  mention_count: number
  aliases?: string[]
  created_at: string
}

export interface CharacterMention {
  page_num: number
  context: string
  created_at: string
}

// Images
export interface PageImage {
  id: number
  book_id: number
  page_number?: number
  page_num?: number
  prompt: string
  image_url: string
  model: string
  size: string
  created_at: string
}

export interface GeneratedImage {
  id: number
  book_id: number
  page_number?: number
  prompt: string
  image_url: string
  model?: string
  size?: string
  created_at: string
}

export interface ImageGenerationTask {
  task_id: string
  status: 'started' | 'processing' | 'completed' | 'failed'
  estimated_cost?: number
  result?: {
    image_id: number
    url: string
    cost: number
  }
  error?: string
}

// Billing
export interface APIUsage {
  id: number
  user_id: string
  timestamp: string
  api_provider: 'openai' | 'openrouter'
  model: string
  endpoint_type: 'chat' | 'image' | 'embedding'
  request_type: string
  input_tokens?: number
  output_tokens?: number
  total_tokens?: number
  num_images?: number
  base_cost: number
  markup_multiplier: number
  charged_cost: number
  book_id?: number
  page_num?: number
}

export interface UsageSummary {
  total_requests: number
  total_tokens: number
  total_images: number
  total_base_cost: number
  total_charged_cost: number
  by_model: {
    model: string
    requests: number
    tokens?: number
    images?: number
    charged_cost: number
  }[]
}

export interface Invoice {
  id: number
  user_id: string
  invoice_number: string
  stripe_invoice_id?: string
  period_start: string
  period_end: string
  total_api_calls: number
  api_cost: number
  total_base_cost: number
  markup_cost: number
  total_amount: number
  total_charged_cost: number
  status: 'draft' | 'pending' | 'paid' | 'failed' | 'void'
  pdf_url?: string
  paid_at?: string
  created_at: string
}

export interface InvoiceLineItem {
  id: number
  invoice_id: number
  description: string
  model_name?: string
  quantity: number
  base_cost: number
  markup_multiplier: number
  total_cost: number
  created_at: string
}

export interface Pricing {
  markup_multiplier: number
  text_models: {
    model: string
    base_input_per_1m: number
    base_output_per_1m: number
    charged_input_per_1m: number
    charged_output_per_1m: number
  }[]
  image_models: {
    model: string
    size: string
    base_cost: number
    charged_cost: number
  }[]
}

export interface PricingConfig {
  id: number
  type: 'text' | 'image'
  model_name: string
  provider: string
  input_cost: number
  output_cost: number
  image_size?: string
  created_at: string
}

export interface UsageStats {
  tokens_used: number
  tokens_limit: number
  tokens_percentage: number
  tokens_cost?: number
  images_used: number
  images_limit: number
  images_percentage: number
  images_cost?: number
  books_count: number
  books_limit: number
  api_cost: number
  markup_cost: number
  total_cost: number
  tier: string
  within_limits: boolean
}

export interface Quota {
  tier: string
  tokens_used: number
  tokens_limit: number
  tokens_remaining: number
  images_used: number
  images_limit: number
  images_remaining: number
  books_count: number
  books_limit: number
  within_limits: boolean
}

// Background Tasks
export interface BackgroundTask {
  task_id: string
  state?: 'PENDING' | 'PROGRESS' | 'SUCCESS' | 'FAILURE'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  current?: number
  total?: number
  progress?: number
  status_message?: string
  result?: any
  error?: string
}

// API Response Types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
  has_more: boolean
}
