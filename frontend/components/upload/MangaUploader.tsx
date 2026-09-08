'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, AlertCircle, FileText, Loader2, Save } from 'lucide-react'
import { booksQueries } from '@/lib/queries'
import { supabase } from '@/lib/supabase'
import { saveLocalBook, saveBookContent } from '@/lib/localStorage'

interface MangaPage {
  file: File
  preview: string
  pageNum: number
  status: 'pending' | 'processing' | 'done' | 'error'
  panels?: any[]
  pageDescription?: string
  error?: string
}

export function MangaUploader({
  useLocalStorage, title, onTitleChange, onSuccess
}: {
  useLocalStorage: boolean
  title: string
  onTitleChange: (t: string) => void
  onSuccess?: () => void
}) {
  const router = useRouter()
  const [pages, setPages] = useState<MangaPage[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processedCount, setProcessedCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter(f => f.type.startsWith('image/'))
    if (!imageFiles.length) {
      setError('Please select image files (PNG, JPG, WEBP)')
      return
    }

    const sorted = imageFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    const newPages: MangaPage[] = sorted.map((f, i) => ({
      file: f,
      preview: URL.createObjectURL(f),
      pageNum: pages.length + i + 1,
      status: 'pending' as const,
    }))

    setPages(prev => [...prev, ...newPages])
    setError(null)

    if (!title && sorted.length > 0) {
      const name = sorted[0].name.replace(/[-_]\d+\.\w+$/, '').replace(/[_-]/g, ' ')
      onTitleChange(name || 'Manga')
    }
  }

  const removePage = (idx: number) => {
    setPages(prev => {
      const next = prev.filter((_, i) => i !== idx)
      return next.map((p, i) => ({ ...p, pageNum: i + 1 }))
    })
  }

  const processPages = async () => {
    setIsProcessing(true)
    setProcessedCount(0)
    setError(null)

    const { data: { session } } = await supabase.auth.getSession()

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      if (page.status === 'done') { setProcessedCount(i + 1); continue }

      setPages(prev => prev.map((p, j) => j === i ? { ...p, status: 'processing' } : p))

      try {
        // Convert image to base64
        const base64 = await fileToBase64(page.file)

        const res = await fetch('/api/manga-parse', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            imageBase64: base64,
            pageNum: page.pageNum,
            bookTitle: title,
          }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Parse failed' }))
          throw new Error(err.error || `Error ${res.status}`)
        }

        const data = await res.json()
        setPages(prev => prev.map((p, j) => j === i ? {
          ...p, status: 'done', panels: data.panels || [], pageDescription: data.pageDescription,
        } : p))
      } catch (err: any) {
        setPages(prev => prev.map((p, j) => j === i ? {
          ...p, status: 'error', error: err.message,
        } : p))
      }

      setProcessedCount(i + 1)
    }

    setIsProcessing(false)
  }

  const saveAsBook = async () => {
    const processed = pages.filter(p => p.status === 'done')
    if (!processed.length) return

    setIsSaving(true)
    setError(null)

    try {
      const bookTitle = title || 'Manga'
      let markdown = `# ${bookTitle}\n\n`

      for (const page of pages) {
        markdown += `\n---\n\n## Page ${page.pageNum}\n\n`

        if (page.pageDescription) {
          markdown += `*${page.pageDescription}*\n\n`
        }

        if (page.panels?.length) {
          for (const panel of page.panels) {
            markdown += `### Panel ${panel.index}\n\n`
            markdown += `**Scene:** ${panel.description}\n\n`
            if (panel.dialogue) markdown += `**Dialogue:** ${panel.dialogue}\n\n`
            if (panel.sound_effects) markdown += `**SFX:** ${panel.sound_effects}\n\n`
            if (panel.mood) markdown += `**Mood:** ${panel.mood}`
            if (panel.characters?.length) markdown += ` · **Characters:** ${panel.characters.join(', ')}`
            markdown += '\n\n'
            // Panel prompt — ready for image generation
            markdown += `<details><summary>🎨 Remix prompt</summary>\n\n\`\`\`\n${panel.description}${panel.mood ? `. Mood: ${panel.mood}` : ''}\n\`\`\`\n\n</details>\n\n`
          }
        } else if (page.status === 'error') {
          markdown += `> ⚠️ Could not parse this page: ${page.error}\n\n`
        } else {
          markdown += `> Page not yet processed\n\n`
        }
      }

      const blob = new Blob([markdown], { type: 'text/markdown' })
      const file = new File([blob], 'manga.md', { type: 'text/markdown' })

      if (useLocalStorage) {
        const { fileToText } = await import('@/lib/pdfToMarkdown')
        const text = await fileToText(file)
        const nb = saveLocalBook({
          user_id: '', title: bookTitle, file_path: 'local',
          total_pages: Math.ceil(text.length / 2000), summary: '',
        })
        saveBookContent(nb.id, text)
        onSuccess?.()
        router.push(`/books/${nb.id}`)
      } else {
        // Upload original images to storage too
        const book = await booksQueries.upload(file, { title: bookTitle, articleType: 'manga' })

        // Upload page images for the Images tab
        for (const page of pages) {
          try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) break
            const imgPath = `${user.id}/manga_${book.id}_p${page.pageNum}_${Date.now()}.${page.file.name.split('.').pop()}`
            await supabase.storage.from('page-images').upload(imgPath, page.file, { contentType: page.file.type })
            await supabase.from('page_images').insert({
              book_id: book.id, user_id: user.id, page_num: page.pageNum,
              image_url: imgPath, image_model: 'original', prompt: page.pageDescription || `Page ${page.pageNum}`,
              generation_status: 'completed',
            })
          } catch { /* non-fatal */ }
        }

        onSuccess?.()
        router.push(`/books/${book.id}`)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const doneCount = pages.filter(p => p.status === 'done').length

  return (
    <div className="space-y-4 mb-4">
      <div className="p-3 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-lg text-xs text-pink-700 dark:text-pink-300">
        <p className="font-medium mb-1">Manga / Comic upload</p>
        <p>Select page images in order. AI will analyze each page panel-by-panel, extracting descriptions, dialogue, and scene details. Each panel gets a remix prompt you can use to regenerate it in any style.</p>
      </div>

      {/* Multi-file image picker */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          onChange={handleFiles}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-pink-400 dark:hover:border-pink-500 transition-colors disabled:opacity-40"
        >
          <Upload size={24} className="mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
            {pages.length ? 'Add more pages' : 'Select manga page images'}
          </p>
          <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP · Select multiple files · Sorted by filename</p>
        </button>
      </div>

      {/* Page thumbnails */}
      {pages.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {pages.map((page, i) => (
            <div key={i} className="relative group">
              <img
                src={page.preview}
                alt={`Page ${page.pageNum}`}
                className={`w-full aspect-[2/3] object-cover rounded border ${
                  page.status === 'done' ? 'border-green-400' :
                  page.status === 'processing' ? 'border-yellow-400 animate-pulse' :
                  page.status === 'error' ? 'border-red-400' :
                  'border-gray-200 dark:border-gray-600'
                }`}
              />
              <span className="absolute bottom-0.5 left-0.5 text-[9px] bg-black/60 text-white px-1 rounded">
                {page.pageNum}
              </span>
              {page.status === 'done' && (
                <span className="absolute top-0.5 right-0.5 text-[9px] bg-green-500 text-white px-1 rounded">
                  {page.panels?.length || 0}p
                </span>
              )}
              {page.status === 'processing' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded">
                  <Loader2 size={16} className="text-white animate-spin" />
                </div>
              )}
              {!isProcessing && (
                <button
                  onClick={() => removePage(i)}
                  className="absolute top-0.5 left-0.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}

      {/* Progress */}
      {isProcessing && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Analyzing pages…</span>
            <span>{processedCount}/{pages.length}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-pink-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${pages.length ? (processedCount / pages.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      {pages.length > 0 && (
        <div className="flex gap-2">
          {doneCount < pages.length && (
            <button
              onClick={processPages}
              disabled={isProcessing || pages.length === 0}
              className="btn btn-secondary flex-1 flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              {isProcessing ? `Analyzing ${processedCount}/${pages.length}…` : `Analyze ${pages.length} pages`}
            </button>
          )}
          <button
            onClick={saveAsBook}
            disabled={doneCount === 0 || isSaving || isProcessing}
            className="btn btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isSaving ? 'Saving…' : `Save as book (${doneCount} pages)`}
          </button>
        </div>
      )}
    </div>
  )
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
