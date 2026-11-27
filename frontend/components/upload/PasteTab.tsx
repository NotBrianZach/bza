'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardType, Loader2 } from 'lucide-react'
import { importMarkdownAsBook } from './importMarkdown'
import { CONTENT_TYPE_OPTIONS, type ContentType } from './types'

/**
 * Paste a block of text and read it.
 *
 * The gap this fills is odd in hindsight: every other tab turns something
 * REMOTE into a book — a file, a URL, a feed, an email, a chat you just had —
 * and there was no way to hand over text you already have. An excerpt in the
 * clipboard had to be saved to a .md file first and uploaded, which is three
 * steps of ceremony around a paste.
 *
 * ── THE TITLE IS OFFERED, NOT DEMANDED ────────────────────────────────────
 *
 * `importMarkdownAsBook` throws without one, and asking for a title before
 * the paste is the kind of small friction that makes a quick capture not
 * worth doing. So the first non-empty line is proposed as soon as there is
 * text, and anything the author types wins from then on — `titleTouched`
 * exists only to stop the suggestion overwriting a deliberate choice on the
 * next keystroke.
 *
 * A markdown heading is stripped from the suggestion because `# Chapter one`
 * is a heading, not a title, and it would be the only book in the library
 * whose name started with a hash.
 */
export function PasteTab({
  useLocalStorage,
  onError,
  onSuccess,
}: {
  useLocalStorage: boolean
  onError: (message: string | null) => void
  onSuccess?: () => void
}) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [titleTouched, setTitleTouched] = useState(false)
  const [contentType, setContentType] = useState<ContentType>('essay')
  const [saving, setSaving] = useState(false)

  const suggestTitle = (body: string) => {
    const first = body.split('\n').map(l => l.trim()).find(Boolean) ?? ''
    return first.replace(/^#+\s*/, '').slice(0, 80)
  }

  /*
   * A floor, because a book of four words is a mistake rather than a
   * decision. Fifty characters is the same threshold /api/extension/import
   * applies to a scraped page, and using the same number means a passage
   * accepted by one route is accepted by the other.
   */
  const tooShort = text.trim().length > 0 && text.trim().length < 50

  const save = async () => {
    if (saving || !text.trim() || tooShort) return
    onError(null)
    setSaving(true)
    try {
      const { id } = await importMarkdownAsBook({
        markdown: text,
        title: title.trim() || suggestTitle(text) || 'Pasted text',
        contentType,
        useLocalStorage,
        source: 'paste',
      })
      onSuccess ? onSuccess() : (router.push(`/books/${id}`), router.refresh())
    } catch (err: any) {
      onError(err?.message || 'Could not save that text')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Text <span className="font-normal text-gray-400 dark:text-gray-500">(markdown is kept)</span>
        </label>
        <textarea
          value={text}
          onChange={e => {
            setText(e.target.value)
            if (!titleTouched) setTitle(suggestTitle(e.target.value))
          }}
          rows={12}
          disabled={saving}
          placeholder="Paste or write anything — an excerpt, your notes, a transcript…"
          aria-label="The text to add to your library"
          className="w-full resize-y text-sm font-mono border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
        />
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          {text.trim().length.toLocaleString()} characters
          {tooShort && <span className="text-amber-500"> — a little more is needed to make a book</span>}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={e => { setTitle(e.target.value); setTitleTouched(true) }}
          disabled={saving}
          placeholder="Taken from the first line if you leave this"
          className="input w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kind</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {/* Manga is excluded: it is a page-image format and this tab only
              ever produces text, so offering it would promise a reader that
              cannot be built from what was pasted. */}
          {CONTENT_TYPE_OPTIONS.filter(o => o.value !== 'manga').map(({ value, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => setContentType(value)}
              disabled={saving}
              className={`text-left px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
                contentType === value
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="font-medium text-gray-800 dark:text-gray-100">{label}</div>
              <div className="text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={save}
        disabled={saving || !text.trim() || tooShort}
        className="btn btn-primary px-4 disabled:opacity-50 flex items-center gap-1.5"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <ClipboardType size={14} />}
        {saving ? 'Adding…' : 'Add to library'}
      </button>
    </div>
  )
}
