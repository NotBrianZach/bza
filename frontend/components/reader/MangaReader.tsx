import { Loader2, BookOpen } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface MangaReaderProps {
  bookId: number
  currentPage: number
  mangaPageUrls: Record<number, string>
  mangaOcrLoading: boolean
  setMangaOcrLoading: (v: boolean) => void
  onOcrText: (text: string) => void
}

// Full-page manga image reader with an on-demand OCR button that pulls
// text out of the current page (for narration / search / a11y).
export function MangaReader({
  bookId, currentPage, mangaPageUrls,
  mangaOcrLoading, setMangaOcrLoading, onOcrText,
}: MangaReaderProps) {
  const runOcr = async () => {
    if (mangaOcrLoading) return
    setMangaOcrLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const FUNCTIONS_BASE = (process.env.NEXT_PUBLIC_FUNCTIONS_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) + '/functions/v1'
      const res = await fetch(`${FUNCTIONS_BASE}/manga-ocr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ bookId, pageNum: currentPage }),
      })
      if (!res.ok) throw new Error('OCR failed')
      const { text } = await res.json()
      if (text) onOcrText(text)
    } catch (err) {
      console.error('Manga OCR error:', err)
    } finally {
      setMangaOcrLoading(false)
    }
  }

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
      {mangaPageUrls[currentPage] ? (
        <img
          src={mangaPageUrls[currentPage]}
          alt={`Page ${currentPage}`}
          className="max-h-full max-w-full object-contain"
          style={{ userSelect: 'none' }}
        />
      ) : (
        <div className="text-center text-gray-400">
          <div className="spinner mx-auto mb-4" />
          <p className="text-sm">Loading page {currentPage}…</p>
        </div>
      )}
      <button
        onClick={runOcr}
        disabled={mangaOcrLoading}
        className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white text-xs rounded-lg backdrop-blur flex items-center gap-1.5"
        title="Extract text from this page (for narration, search, accessibility)"
      >
        {mangaOcrLoading ? <Loader2 size={12} className="animate-spin" /> : <BookOpen size={12} />}
        {mangaOcrLoading ? 'Reading…' : 'Read page'}
      </button>
    </div>
  )
}
