// ===========================================
// Types
// ===========================================

export interface Book {
  id: number
  user_id: string
  file_path: string
  title: string
  article_type: string
  content_type?: 'fiction' | 'textbook' | 'academic_paper' | 'math_textbook' | 'wikipedia_article' | 'news_article' | 'forum_thread' | 'essay' | 'reference' | 'biography' | 'chat_book' | 'manga'
  summary?: string
  synopsis?: string
  narrator?: string
  source_url?: string
  wiki_revid?: string
  cover_url?: string
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
  typst_content?: string
  typst_title?: string
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

// ─── User Preferences ────────────────────────────────────────────────────────

export interface UserPrefs {
  show_classics_library: boolean
  show_daily_prompt: boolean
  sidebar_chat: boolean
  sidebar_bookmarks: boolean
  sidebar_images: boolean
  sidebar_quiz: boolean
  sidebar_graph: boolean
  auto_build_graph: boolean
  serendipity_enabled: boolean
  serendipity_sources: string[]
  serendipity_frequency: number
  serendipity_custom_urls: string[]
  /** Pinned RSS/4chan/Reddit feeds shown on the home page */
  pinned_feeds?: Array<{ id: string; label: string; url: string }>
  /** If true, feeds are stored per-device in localStorage and not synced to the cloud */
  feeds_per_device?: boolean
  /** Per-content-type sidebar tab visibility overrides. Keys are content_type values; values are arrays of enabled tab IDs ('chat','bookmarks','characters','images','quiz'). When absent, DEFAULT_TABS_BY_TYPE in PageSidebar applies. */
  sidebar_tabs_by_type?: Record<string, string[]>
  /** Global feed view mode: catalog grid or list */
  feed_catalog_view?: boolean
  /** Global feed image thumbnails toggle */
  feed_show_images?: boolean
}

export const PREFS_DEFAULTS: UserPrefs = {
  show_classics_library: true,
  show_daily_prompt: true,
  sidebar_chat: true,
  sidebar_bookmarks: true,
  sidebar_images: true,
  sidebar_quiz: true,
  sidebar_graph: true,
  auto_build_graph: false,
  serendipity_enabled: true,
  serendipity_sources: ['dog', 'cat', 'fox', 'shibe', 'bugs', 'plants', 'fungi', 'rocks', 'smbc', 'dilbert', 'nasa_apod', 'mars', 'xkcd', 'art'],
  serendipity_frequency: 5,
  serendipity_custom_urls: [],
  feeds_per_device: false,
}

export const SERENDIPITY_SOURCES = [
  { id: 'dog',      label: '🐶 Dogs',    description: 'Random dog photos' },
  { id: 'cat',      label: '🐱 Cats',    description: 'Random cat photos' },
  { id: 'fox',      label: '🦊 Foxes',   description: 'Random fox photos' },
  { id: 'shibe',    label: '🐕 Shibes',  description: 'Such random, very shibe' },
  { id: 'bugs',     label: '🪲 Bugs',    description: 'Research-grade insect photos (iNaturalist)' },
  { id: 'plants',   label: '🌿 Plants',  description: 'Research-grade plant photos (iNaturalist)' },
  { id: 'fungi',    label: '🍄 Fungi',   description: 'Research-grade mushroom photos (iNaturalist)' },
  { id: 'rocks',    label: '🪨 Rocks',   description: 'Mineral & crystal specimens (Wikimedia Commons)' },
  { id: 'dilbert',  label: '👔 Dilbert',  description: 'Dilbert comics 1989–2023 (via GoComics)' },
  { id: 'smbc',     label: '😅 SMBC',    description: 'Saturday Morning Breakfast Cereal comics' },
  { id: 'nasa_apod',label: '🔭 APOD',    description: 'NASA Astronomy Picture of the Day' },
  { id: 'mars',     label: '🔴 Mars',    description: 'NASA Curiosity rover photos' },
  { id: 'xkcd',    label: '🤓 xkcd',    description: 'Random xkcd comic' },
  { id: 'art',      label: '🎨 Art',     description: 'Art Institute of Chicago' },
] as const


export interface UserQuota {
  tier: string
  books_used: number
  books_limit: number
  spend_this_month: number
  spend_limit: number
  storage_bytes_used: number
  storage_limit_bytes: number
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

