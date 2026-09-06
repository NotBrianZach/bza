import { supabase } from '../supabase'
import type { PageImage } from './types'

const FUNCTIONS_BASE =
  (process.env.NEXT_PUBLIC_FUNCTIONS_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) +
  '/functions/v1'

// ===========================================

/** Convert a Supabase Storage URL or bare path to our CDN-cached /api/img/ proxy URL. */
export function toImgProxyUrl(url: string): string {
  // Already a proxy URL or local static URL
  if (url.startsWith('/api/img/') || url.startsWith('/classics/')) return url

  // Full Supabase storage URL (public, signed, or authenticated) → extract the bare path
  const supabaseMatch = url.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/page-images\/([^?]+)/)
  if (supabaseMatch) return `/api/img/page-images/${supabaseMatch[1]}`

  // External URL (DALL-E, etc.) that isn't Supabase — pass through
  if (url.startsWith('http')) return url

  // Bare storage path (e.g. "user-uuid/123_page0_1234567890.png") — the edge function stores just the path
  return `/api/img/page-images/${url}`
}

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
    const images = data || []

    // Convert stored URLs to CDN-cached proxy URLs (bucket is private)
    for (const img of images) {
      if (img.image_url) img.image_url = toImgProxyUrl(img.image_url)
    }

    return images
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
      body: JSON.stringify({
        bookId,
        pageNum,
        prompt,
        customStylePrompt: (() => { try { const p = JSON.parse(localStorage.getItem('bza-custom-prompts') ?? '{}'); return p['image'] || undefined } catch { return undefined } })(),
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to generate image')
    }

    const result = await response.json()
    // Edge function wraps in { image, usage } — unwrap
    return result.image ?? result
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

    // Extract bare storage path and delete from storage
    const supabaseMatch = image.image_url.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/page-images\/([^?]+)/)
    const storagePath = supabaseMatch ? supabaseMatch[1] : (
      // Bare path (no URL prefix) — use directly
      !image.image_url.startsWith('http') && !image.image_url.startsWith('/') ? image.image_url : null
    )

    if (storagePath) {
      await supabase.storage.from('page-images').remove([storagePath])
    }
  },

  /** Fetch the cover image URL for a book (page_num = 0), or null if none. */
  async getCover(bookId: number): Promise<string | null> {
    const { data } = await supabase
      .from('page_images')
      .select('image_url, source')
      .eq('book_id', bookId)
      .eq('page_num', 0)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!data?.image_url) return null
    return toImgProxyUrl(data.image_url)
  },

  /** Build the default cover prompt for a book. */
  defaultCoverPrompt(title: string, summary?: string): string {
    return [
      'Book cover art for ' + JSON.stringify(title),
      summary ? summary.slice(0, 120) : '',
      'Cinematic, dramatic illustration, professional book cover design, rich colors.',
    ].filter(Boolean).join('. ')
  },

  /** Generate a cover image for a book (stored as page_num = 0). */
  async generateCover(bookId: number, title: string, summary?: string, customPrompt?: string): Promise<PageImage> {
    const prompt = customPrompt ?? this.defaultCoverPrompt(title, summary)
    return this.generate(bookId, 0, prompt)
  },
}

// ===========================================

export const AUTO_COVER_KEY = 'bza-auto-cover'

/** Fire-and-forget: generate cover art if auto-cover mode is enabled. */
export function maybeAutoCover(bookId: number, title: string, summary?: string): void {
  if (typeof window === 'undefined') return
  if (localStorage.getItem(AUTO_COVER_KEY) !== 'true') return
  imageQueries.generateCover(bookId, title, summary).catch(() => {})
}

// ===========================================
