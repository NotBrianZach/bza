import { supabase } from '../supabase'
import { fileToTextWithPageMap, processDocumentViaJina, processDocumentViaCloudRun, processDocumentViaMathpix } from '../pdfToMarkdown'
import { dispatchWebhook } from '../webhookDispatch'
import { scanDocument } from '../structureScanner'
import type { Book, PageImage, UserQuota } from './types'

// Books Queries
// ===========================================

const BOOKS_CACHE_KEY = 'bza-books-cache'
const BOOKS_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCachedBooks(): Book[] | null {
  try {
    const raw = localStorage.getItem(BOOKS_CACHE_KEY)
    if (!raw) return null
    const { books, ts } = JSON.parse(raw) as { books: Book[]; ts: number }
    if (Date.now() - ts > BOOKS_CACHE_TTL) return null
    return books
  } catch { return null }
}

function setCachedBooks(books: Book[]) {
  try {
    localStorage.setItem(BOOKS_CACHE_KEY, JSON.stringify({ books, ts: Date.now() }))
  } catch {}
}

export const booksQueries = {
  /**
   * List all books for current user.
   * Returns cached data instantly if available, fetches fresh in background.
   */
  async list(): Promise<Book[]> {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .is('deleted_at', null)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error
    const books = data || []
    setCachedBooks(books)
    return books
  },

  /** Return cached book list if available (synchronous, no network) */
  listCached(): Book[] | null {
    return getCachedBooks()
  },

  /** Invalidate the books cache (call after upload, delete, etc.) */
  invalidateCache() {
    try { localStorage.removeItem(BOOKS_CACHE_KEY) } catch {}
  },

  async togglePin(bookId: number, pinned: boolean): Promise<void> {
    const { error } = await supabase
      .from('books')
      .update({ pinned, pinned_at: pinned ? new Date().toISOString() : null })
      .eq('id', bookId)
    if (error) throw error
  },

  async markRead(bookId: number): Promise<void> {
    await supabase
      .from('books')
      .update({ last_read_at: new Date().toISOString() })
      .eq('id', bookId)
    // non-fatal — ignore errors
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
    wikiRevid?: string
    sourceUrl?: string
    processingMethod?: 'jina' | 'nougat' | 'mathpix'
    onStatus?: (status: string) => void
    onProgress?: (pct: number) => void
  }): Promise<Book> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Check storage quota before uploading
    const { data: quotaRows } = await supabase.rpc('get_user_quota', { user_uuid: user.id })
    const quota = quotaRows?.[0] as UserQuota | undefined
    if (quota && quota.storage_limit_bytes > 0 &&
        quota.storage_bytes_used >= quota.storage_limit_bytes) {
      throw new Error('Storage quota exceeded. Add more storage at /billing.')
    }

    const charPageLength = metadata.charPageLength || 420
    const timestamp = Date.now()
    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-]/g, '_')
    const isPdf = file.name.toLowerCase().endsWith('.pdf')

    let rawText: string
    let pageMap: number[]
    let usedJina = false

    if (isPdf) {
      const method = metadata.processingMethod ?? 'jina'
      if (method === 'nougat') {
        rawText = await processDocumentViaCloudRun(file, user.id, 'default', metadata.onStatus, metadata.onProgress)
      } else if (method === 'mathpix') {
        rawText = await processDocumentViaMathpix(file, user.id, metadata.onStatus, metadata.onProgress)
        usedJina = true // no client-side image extraction
      } else {
        rawText = await processDocumentViaJina(file, user.id, metadata.onStatus)
        usedJina = true
      }
      pageMap = []
    } else {
      const result = await fileToTextWithPageMap(file)
      rawText = result.text
      pageMap = result.pageMap
    }

    // Client-side image extraction: only for PDFs processed by pdfjs (not Jina).
    // Jina strips images; loading the PDF a second time into the browser would OOM on large files.
    let finalMarkdown = rawText
    const pendingImages: Array<{ virtualPage: number; url: string; label: string }> = []

    if (isPdf && !usedJina) {
      try {
        const { extractImagesFromPdf } = await import('../pdfImageExtractor')
        const extracted = await extractImagesFromPdf(file)

        for (const img of extracted) {
          const imgPath = `${user.id}/${timestamp}_${baseName}_fig${pendingImages.length + 1}.jpg`
          const { error: imgUploadErr } = await supabase.storage
            .from('page-images')
            .upload(imgPath, img.blob, { contentType: 'image/jpeg' })

          if (imgUploadErr) continue

          const { data: { publicUrl } } = supabase.storage
            .from('page-images')
            .getPublicUrl(imgPath)

          let virtualPage: number
          if (pageMap.length > 0) {
            const sectionIdx = pageMap.indexOf(img.pdfPage)
            if (sectionIdx === -1) continue
            const PAGE_SEP = '\n\n---\n\n'
            const sections = rawText.split(PAGE_SEP)
            const charsBefore = sections.slice(0, sectionIdx).join(PAGE_SEP).length +
              (sectionIdx > 0 ? PAGE_SEP.length : 0)
            virtualPage = Math.floor(charsBefore / charPageLength) + 1
          } else {
            virtualPage = 1
          }

          pendingImages.push({ virtualPage, url: publicUrl, label: img.label })
        }
      } catch (imgErr) {
        console.error('PDF image extraction failed (non-fatal):', imgErr)
      }
    }

    // Scan document structure at upload time
    const profile = scanDocument(finalMarkdown)
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
        language: profile.language !== 'en' ? profile.language : null,
        search_text: finalMarkdown.replace(/[#*_~`>|$\\{}[\]]/g, '').slice(0, 10000),
        ...(metadata.wikiRevid ? { wiki_revid: metadata.wikiRevid } : {}),
        ...(metadata.sourceUrl ? { source_url: metadata.sourceUrl } : {}),
      })
      .select()
      .single()

    if (error) {
      await supabase.storage.from('books').remove([filePath])
      throw error
    }

    // Store detected headings as book_structure for instant TOC
    if (profile.headings.length > 0) {
      const structureRows = profile.headings.slice(0, 200).map(h => ({
        user_id: user.id,
        book_id: data.id,
        title: h.title,
        section_type: h.level === 1 ? 'chapter' : h.level === 2 ? 'section' : 'subsection',
        page_num: Math.max(1, Math.floor(h.offset / charPageLength) + 1),
        summary: null,
      }))
      await supabase.from('book_structure').insert(structureRows).then(({ error: e }) => {
        if (e) console.error('Failed to store structure:', e)
      })
    }

    // For Wikipedia articles: extract inline images from markdown and add to page_images
    if (metadata.wikiRevid) {
      const imgRe = /!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g
      let m: RegExpExecArray | null
      while ((m = imgRe.exec(finalMarkdown)) !== null) {
        const url = m[2]
        if (/\.(webm|ogv|ogg|mp4|mp3|wav|flac)(\?|$)/i.test(url)) continue
        const caption = m[1].trim() || 'Wikipedia image'
        const approxPage = Math.max(1, Math.floor(m.index / charPageLength) + 1)
        pendingImages.push({ virtualPage: approxPage, url, label: caption })
      }
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

    setCachedBooks([]) // invalidate cache after upload
    dispatchWebhook('book.uploaded', {
      book_id: data.id,
      title: data.title,
      content_type: data.content_type ?? data.article_type,
      total_pages: data.total_pages,
      source_url: data.source_url ?? null,
    })
    return data
  },

  /**
   * Replace a Wikipedia book's content after a "Update to latest" action.
   * Overwrites the existing storage file and updates wiki_revid + total_pages.
   */
  async updateWikiContent(bookId: number, filePath: string, markdown: string, wikiRevid: string, charPageLength = 420): Promise<void> {
    const { error: uploadError } = await supabase.storage
      .from('books')
      .upload(filePath, new Blob([markdown], { type: 'text/markdown' }), { upsert: true })
    if (uploadError) throw uploadError
    const totalPages = Math.ceil(markdown.length / charPageLength)
    const { error } = await supabase
      .from('books')
      .update({ wiki_revid: wikiRevid, total_pages: totalPages })
      .eq('id', bookId)
    if (error) throw error

    // Replace page_images: delete old wikipedia images and re-insert from updated markdown
    await supabase.from('page_images').delete().eq('book_id', bookId).eq('model', 'extracted')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const imgRe = /!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g
    const newImages: { user_id: string; book_id: number; page_num: number; prompt: string; image_url: string; model: string; size: string; source: string }[] = []
    let m: RegExpExecArray | null
    while ((m = imgRe.exec(markdown)) !== null) {
      if (/\.(webm|ogv|ogg|mp4|mp3|wav|flac)(\?|$)/i.test(m[2])) continue
      newImages.push({
        user_id: user.id, book_id: bookId,
        page_num: Math.max(1, Math.floor(m.index / charPageLength) + 1),
        prompt: m[1].trim() || 'Wikipedia image',
        image_url: m[2], model: 'extracted', size: 'extracted', source: 'extracted',
      })
    }
    if (newImages.length > 0) {
      await supabase.from('page_images').insert(newImages).then(({ error: e }) => {
        if (e) console.error('Failed to update wiki image records:', e)
      })
    }
  },

  /**
   * Move a book to trash (soft delete)
   */
  async trash(bookId: number): Promise<void> {
    const { error } = await supabase
      .from('books')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', bookId)
    if (error) throw error
    dispatchWebhook('book.deleted', { book_id: bookId })
  },

  /**
   * Restore a book from trash
   */
  async restore(bookId: number): Promise<void> {
    const { error } = await supabase
      .from('books')
      .update({ deleted_at: null })
      .eq('id', bookId)
    if (error) throw error
  },

  /**
   * List trashed books
   */
  async listTrashed(): Promise<Book[]> {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  /**
   * Permanently delete all trashed books (hard delete)
   */
  async emptyTrash(): Promise<void> {
    const trashed = await this.listTrashed()
    if (trashed.length === 0) return

    // Hard delete from DB
    const { error } = await supabase
      .from('books')
      .delete()
      .not('deleted_at', 'is', null)
    if (error) throw error

    // Remove storage files (non-fatal)
    const paths = trashed.map(b => b.file_path).filter(Boolean)
    if (paths.length > 0) {
      await supabase.storage.from('books').remove(paths).catch(e =>
        console.error('Failed to remove storage files:', e)
      )
    }
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
   * Create a new chat book (empty markdown file, content_type: chat_book)
   */
  async createChatBook(title: string): Promise<Book> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const timestamp = Date.now()
    const slug = title.replace(/[^a-zA-Z0-9-]/g, '_').slice(0, 50)
    const filePath = `${user.id}/${timestamp}_${slug}.md`
    const seed = `# ${title}\n\n`

    const { error: uploadError } = await supabase.storage
      .from('books')
      .upload(filePath, new Blob([seed], { type: 'text/markdown' }))
    if (uploadError) throw uploadError

    const charPageLength = 2000
    const { data, error } = await supabase
      .from('books')
      .insert({
        user_id: user.id,
        title,
        file_path: filePath,
        total_pages: 1,
        char_page_length: charPageLength,
        content_type: 'chat_book',
        article_type: 'chat_book',
      })
      .select()
      .single()
    if (error) throw error
    return data as Book
  },

  /**
   * Upload a manga (CBZ/ZIP of images). Extracts images, stores each as a page.
   * Returns the book record.
   */
  async uploadManga(file: File, title: string): Promise<Book> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { default: JSZip } = await import('jszip')
    const zip = await JSZip.loadAsync(file)

    // Collect image entries sorted by name
    const imageEntries = Object.entries(zip.files)
      .filter(([name, f]) => !f.dir && /\.(jpe?g|png|webp|gif)$/i.test(name))
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))

    if (imageEntries.length === 0) throw new Error('No images found in archive')

    const timestamp = Date.now()
    const slug = title.replace(/[^a-zA-Z0-9-]/g, '_').slice(0, 40)
    const filePath = `${user.id}/${timestamp}_${slug}_manga.md`

    // Create a placeholder markdown file (will be filled by OCR later)
    const placeholderMd = `# ${title}\n\n*${imageEntries.length} pages*\n`
    await supabase.storage.from('books').upload(filePath, new Blob([placeholderMd], { type: 'text/markdown' }))

    // Create the book record
    const { data: book, error } = await supabase
      .from('books')
      .insert({
        user_id: user.id,
        title,
        file_path: filePath,
        total_pages: imageEntries.length,
        char_page_length: 2000,
        content_type: 'manga',
        article_type: 'manga',
      })
      .select()
      .single()
    if (error) throw error

    // Upload each image and create page_images records
    const pageImages: any[] = []
    for (let i = 0; i < imageEntries.length; i++) {
      const [name, entry] = imageEntries[i]
      const blob = await entry.async('blob')
      const ext = name.split('.').pop()?.toLowerCase() || 'jpg'
      const storagePath = `${user.id}/manga_${book.id}_p${i + 1}.${ext}`

      await supabase.storage.from('page-images').upload(storagePath, blob, {
        contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        upsert: true,
      })

      pageImages.push({
        user_id: user.id,
        book_id: book.id,
        page_num: i + 1,
        prompt: `Page ${i + 1}`,
        image_url: storagePath,
        model: 'manga',
        size: 'full',
        source: 'extracted',
      })
    }

    if (pageImages.length > 0) {
      await supabase.from('page_images').insert(pageImages)
    }

    // Set first page as cover
    if (pageImages.length > 0) {
      await supabase.from('page_images').insert({
        user_id: user.id,
        book_id: book.id,
        page_num: 0,
        prompt: 'Manga cover',
        image_url: pageImages[0].image_url,
        model: 'manga',
        size: 'full',
        source: 'extracted',
      })
    }

    return book as Book
  },

  /**
   * Append markdown content to an existing book (used by chat books).
   * Returns the updated content string so the reader can update in-place.
   */
  async appendContent(bookId: number, filePath: string, newMarkdown: string, charPageLength = 2000): Promise<string> {
    const existing = await this.getContent(filePath)
    const updated = existing + newMarkdown

    const { error: uploadError } = await supabase.storage
      .from('books')
      .upload(filePath, new Blob([updated], { type: 'text/markdown' }), { upsert: true })
    if (uploadError) throw uploadError

    const totalPages = Math.ceil(updated.length / charPageLength)
    await supabase.from('books').update({ total_pages: totalPages }).eq('id', bookId)

    return updated
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
   * Update reading progress (simple upsert — reliable across devices)
   */
  async updateProgress(bookId: number, pageNum: number): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return  // not signed in — skip silently
    await supabase
      .from('reading_progress')
      .upsert({ user_id: session.user.id, book_id: bookId, current_page: pageNum, updated_at: new Date().toISOString() })
  },

  /**
   * Get reading progress (reads from dedicated progress table, falls back to sessions)
   */
  async getProgress(bookId: number): Promise<{
    currentPage: number
    totalPages: number
    progressPercent: number
    timeSpentMinutes: number
  }> {
    const [progressResult, rpcResult] = await Promise.all([
      supabase
        .from('reading_progress')
        .select('current_page')
        .eq('book_id', bookId)
        .maybeSingle(),
      supabase.rpc('get_reading_progress', { book_uuid: bookId }).maybeSingle(),
    ])

    const currentPage = progressResult.data?.current_page ?? 0

    const rpcRow = rpcResult.data as { total_pages: number; progress_percent: number; time_spent_minutes: number } | null
    return {
      currentPage,
      totalPages: rpcRow?.total_pages ?? 0,
      progressPercent: rpcRow?.progress_percent ?? 0,
      timeSpentMinutes: rpcRow?.time_spent_minutes ?? 0,
    }
  }
}
