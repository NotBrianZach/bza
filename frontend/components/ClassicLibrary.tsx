'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Book } from '@/types'
import { CLASSICS, stripGutenberg } from '@/lib/classics'
import { booksQueries } from '@/lib/queries'
import { supabase } from '@/lib/supabase'
import { saveLocalBook, saveBookContent } from '@/lib/localStorage'
import { ChevronDown, ChevronUp } from 'lucide-react'

const HIDDEN_KEY = 'bza-classics-hidden'
const classicIdKey = (slug: string) => `bza-classic-book-id-${slug}`
const importTitle = (c: typeof CLASSICS[number]) => `${c.title} — ${c.subtitle}`

function getStoredId(slug: string): number | null {
  if (typeof window === 'undefined') return null
  const v = localStorage.getItem(classicIdKey(slug))
  return v ? parseInt(v, 10) : null
}

function storeId(slug: string, id: number) {
  localStorage.setItem(classicIdKey(slug), String(id))
}

export default function ClassicLibrary({
  books,
  isAuthenticated,
  onBookAdded,
}: {
  books: Book[]
  isAuthenticated: boolean
  onBookAdded: (book?: Book) => void
}) {
  const [adding, setAdding] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [bookIds, setBookIds] = useState<Record<string, number>>({})
  const [collapsed, setCollapsed] = useState(false)

  // Load collapsed preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCollapsed(localStorage.getItem(HIDDEN_KEY) === '1')
    }
  }, [])

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem(HIDDEN_KEY, next ? '1' : '0')
  }

  // Resolve stored IDs against the current books list (also catches title matches
  // from other devices where localStorage was cleared)
  useEffect(() => {
    const ids: Record<string, number> = {}
    for (const c of CLASSICS) {
      const storedId = getStoredId(c.slug)
      if (storedId && books.some(b => b.id === storedId)) {
        ids[c.slug] = storedId
        continue
      }
      const match = books.find(b => b.title === importTitle(c))
      if (match) {
        storeId(c.slug, match.id)
        ids[c.slug] = match.id
      }
    }
    setBookIds(ids)
  }, [books])

  const doAdd = async (slug: string) => {
    const classic = CLASSICS.find(c => c.slug === slug)!
    setAdding(slug)
    setErrors(prev => ({ ...prev, [slug]: '' }))

    try {
      // Try pre-fetched copy in Supabase Storage first (fast, reliable)
      let markdown = ''
      const storageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/classics/${slug}.md`
      try {
        const cached = await fetch(storageUrl)
        if (cached.ok) {
          const text = await cached.text()
          if (text.length >= 500) markdown = text
        }
      } catch { /* fall through to Gutenberg */ }

      // Fall back: local static file or remote fetch via proxy
      if (!markdown) {
        if (classic.gutenbergUrl.startsWith('/')) {
          // Local static file (e.g. /classics/bible-septuagint.txt)
          const localRes = await fetch(classic.gutenbergUrl)
          if (localRes.ok) {
            const raw = await localRes.text()
            markdown = stripGutenberg(raw)
          }
        }
        if (!markdown) {
          const res = await fetch('/api/fetch-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: classic.gutenbergUrl }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error ?? 'Failed to fetch text')
          const raw: string = data.markdown ?? data.text ?? ''
          markdown = stripGutenberg(raw)
        }
      }

      if (markdown.length < 500) throw new Error('Fetched content was too short — please try again')

      const title = importTitle(classic)
      const blob = new Blob([markdown], { type: 'text/markdown' })
      const file = new File([blob], `${slug}.md`, { type: 'text/markdown' })

      let bookId: number
      let addedBook: Book | undefined
      if (isAuthenticated) {
        const book = await booksQueries.upload(file, { title, articleType: classic.articleType })
        bookId = book.id
        addedBook = book

        // Insert the pre-made default cover — no AI generation cost per user
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('page_images').insert({
            user_id: user.id,
            book_id: bookId,
            page_num: 0,
            prompt: `Default cover for ${classic.title}`,
            image_url: classic.defaultCoverUrl,
            model: 'static',
            size: 'static',
          })
        }
      } else {
        const { fileToText } = await import('@/lib/pdfToMarkdown')
        const text = await fileToText(file)
        const newBook = saveLocalBook({
          user_id: '',
          title,
          file_path: 'local',
          total_pages: Math.ceil(text.length / 2000),
          summary: classic.description,
          cover_url: classic.defaultCoverUrl,
        })
        await saveBookContent(newBook.id, text)
        bookId = newBook.id
      }

      storeId(slug, bookId)
      setBookIds(prev => ({ ...prev, [slug]: bookId }))
      onBookAdded(addedBook)
    } catch (err: any) {
      const msg: string = err.message || 'Failed to add'
      setErrors(prev => ({
        ...prev,
        [slug]: msg.includes('too large') || msg.includes('storage')
          ? 'Unable to save locally. Try again or create a free account for cloud storage.'
          : msg,
      }))
    } finally {
      setAdding(null)
    }
  }

  return (
    <div className="mt-12">
      {/* Section header with toggle */}
      <button
        onClick={toggleCollapsed}
        className="flex items-center gap-2 w-full text-left group mb-1"
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Classic Library <span className="text-gray-400 dark:text-gray-500 font-normal">(Quickstart)</span></h2>
        {collapsed
          ? <ChevronDown size={18} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
          : <ChevronUp size={18} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
        }
      </button>

      {!collapsed && (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Timeless public domain texts — add any to your library.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {CLASSICS.map(classic => {
              const added = classic.slug in bookIds
              const loading = adding === classic.slug
              const err = errors[classic.slug]
              const bookId = bookIds[classic.slug]

              return (
                <div
                  key={classic.slug}
                  className="card flex flex-col gap-2.5 border border-gray-200 dark:border-gray-700 p-0 overflow-hidden"
                >
                  {/* Default cover thumbnail */}
                  <div className="aspect-[3/2] w-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                    <img
                      src={classic.defaultCoverUrl}
                      alt={`Cover for ${classic.title}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  <div className="px-3 pb-3 flex flex-col gap-2 flex-1">
                    <div>
                      <span className={`text-xs font-semibold uppercase tracking-wide ${classic.colorClass}`}>
                        {classic.tradition}
                      </span>
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-snug mt-0.5">
                        {classic.title}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{classic.subtitle}</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex-1 leading-relaxed">
                      {classic.description}
                    </p>
                    {err && <p className="text-xs text-red-500 leading-snug">{err}</p>}
                    {added && bookId ? (
                      <Link href={`/books/${bookId}`} className="btn btn-sm btn-secondary text-center text-xs">
                        Open →
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => doAdd(classic.slug)}
                        disabled={loading || adding !== null}
                        className="btn btn-sm btn-primary disabled:opacity-50 text-xs"
                      >
                        {loading ? (
                          <><span className="spinner mr-1.5 w-3 h-3" />Adding…</>
                        ) : (
                          'Add to Library'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
