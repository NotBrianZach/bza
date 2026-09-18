import { MutableRefObject } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import { X as XIcon, ChevronLeft, ChevronRight, Volume2, VolumeX, BookDown, Loader2 } from 'lucide-react'

type TranslateView = 'translated' | 'original' | 'split'

interface TranslationPanelProps {
  // translation state (from useReading)
  translationPrompt: string
  setTranslationPrompt: (v: string) => void
  translatedPages: Record<number, string>
  isTranslating: boolean
  translateView: TranslateView
  setTranslateView: (v: TranslateView) => void
  autoTranslate: boolean
  setAutoTranslate: (v: boolean) => void
  handleTranslate: () => void
  saveTranslatedBook: () => void
  savingTranslatedBook: boolean
  savedTranslatedBookId: number | null
  narratingTranslation: boolean
  narrateTranslation: (pageNum: number) => void
  stopNarration: () => void
  onClose: () => void
  // reader context
  currentPage: number
  totalPages: number
  goToPage: (n: number) => void
  contentCacheRef: MutableRefObject<string | null>
  pageBreaksRef: MutableRefObject<number[]>
  getSliceForPage: (n: number) => string
  preprocessContent: (s: string) => string
  showInlineImages: boolean
  mdComponents: any
}

// Side-panel (desktop) / full-overlay (mobile) translation UI.
// Extracted from BookReader's AuthPaginatedReader IIFE. Everything is
// driven by props — the panel is a pure presentation surface over the
// useReading state.
export function TranslationPanel(props: TranslationPanelProps) {
  const {
    translationPrompt, setTranslationPrompt, translatedPages, isTranslating,
    translateView, setTranslateView, autoTranslate, setAutoTranslate,
    handleTranslate, saveTranslatedBook, savingTranslatedBook, savedTranslatedBookId,
    narratingTranslation, narrateTranslation, stopNarration, onClose,
    currentPage, totalPages, goToPage,
    contentCacheRef, pageBreaksRef, getSliceForPage, preprocessContent,
    showInlineImages, mdComponents,
  } = props

  const hasTranslation = !!translatedPages[currentPage]
  const origContent = contentCacheRef.current && pageBreaksRef.current.length > 0
    ? preprocessContent(getSliceForPage(currentPage))
    : ''
  const translatedContent = translatedPages[currentPage] ?? ''
  const showOriginal = translateView === 'original' || translateView === 'split'
  const showTranslated = translateView === 'translated' || translateView === 'split'

  return (
    <div
      className="fixed inset-0 z-30 flex flex-col bg-white dark:bg-gray-800 lg:relative lg:inset-auto lg:z-auto"
      style={{ flex: 1, minWidth: 0, borderLeft: '1px solid var(--border-color, #e5e7eb)' }}
    >
      {/* Header bar */}
      <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-3 py-2 flex-shrink-0 space-y-2">
        {/* Prompt row */}
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="lg:hidden btn btn-secondary p-1.5 flex-shrink-0">
            <XIcon size={16} />
          </button>
          <input
            type="text"
            value={translationPrompt}
            onChange={e => setTranslationPrompt(e.target.value)}
            placeholder="e.g. translate to Spanish, summarize, explain simply…"
            className="input flex-1 min-w-0 text-sm py-2"
            onKeyDown={e => { if (e.key === 'Enter') handleTranslate() }}
          />
          <button
            onClick={() => handleTranslate()}
            disabled={!translationPrompt || isTranslating}
            className="btn btn-primary text-sm px-3 py-2 disabled:opacity-40 whitespace-nowrap flex-shrink-0"
          >
            {isTranslating ? '…' : 'Go'}
          </button>
        </div>
        {/* Controls row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1} className="btn btn-secondary p-1 disabled:opacity-30" title="Previous page">
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-mono text-gray-500 min-w-[3ch] text-center">{currentPage}</span>
          <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages} className="btn btn-secondary p-1 disabled:opacity-30" title="Next page">
            <ChevronRight size={14} />
          </button>
          <label className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 cursor-pointer select-none ml-1">
            <input type="checkbox" checked={autoTranslate} onChange={e => setAutoTranslate(e.target.checked)} className="rounded" />
            Auto
          </label>
          <div className="flex rounded-md overflow-hidden border border-gray-200 dark:border-gray-600 text-[10px] ml-auto">
            {(['translated', 'split', 'original'] as const).map(v => (
              <button
                key={v}
                onClick={() => setTranslateView(v)}
                className={`px-2 py-1 transition-colors ${translateView === v ? 'bg-violet-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
              >
                {v === 'translated' ? 'Result' : v === 'original' ? 'Original' : 'Split'}
              </button>
            ))}
          </div>
          {hasTranslation && (
            <>
              <button
                onClick={() => narratingTranslation ? stopNarration() : narrateTranslation(currentPage)}
                className={`btn btn-secondary p-1 flex-shrink-0 ${narratingTranslation ? 'bg-green-50 dark:bg-green-900/30 border-green-300 text-green-600' : ''}`}
              >
                {narratingTranslation ? <VolumeX size={12} /> : <Volume2 size={12} />}
              </button>
              {savedTranslatedBookId ? (
                <a href={`/books/${savedTranslatedBookId}`} className="btn btn-secondary text-[10px] px-1.5 py-1 text-blue-600">Open →</a>
              ) : (
                <button onClick={saveTranslatedBook} disabled={savingTranslatedBook} className="btn btn-secondary p-1 disabled:opacity-40" title="Save as book">
                  {savingTranslatedBook ? <Loader2 size={12} className="animate-spin" /> : <BookDown size={12} />}
                </button>
              )}
            </>
          )}
        </div>
      </div>
      {/* Content area */}
      <div className={`flex-1 overflow-hidden flex ${translateView === 'split' ? 'flex-col landscape:flex-row' : ''}`}>
        {showOriginal && (
          <div className={`overflow-y-auto ${translateView === 'split' ? 'flex-1 border-b landscape:border-b-0 landscape:border-r border-gray-200 dark:border-gray-700' : 'flex-1'}`}>
            <div className={`max-w-prose mx-auto px-5 pt-6 pb-10 prose prose-base font-serif text-gray-900 dark:text-gray-100 text-justify hyphens-auto bza-reader-text${!showInlineImages ? ' bza-hide-images' : ''}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeRaw, [rehypeKatex, { throwOnError: false, output: 'htmlAndMathml' }]]} components={mdComponents}>
                {origContent}
              </ReactMarkdown>
            </div>
          </div>
        )}
        {showTranslated && (
          <div className="overflow-y-auto flex-1">
            {translatedContent ? (
              <div className={`max-w-prose mx-auto px-5 pt-6 pb-10 prose prose-base font-serif text-gray-900 dark:text-gray-100 text-justify hyphens-auto bza-reader-text${!showInlineImages ? ' bza-hide-images' : ''}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeRaw, [rehypeKatex, { throwOnError: false, output: 'htmlAndMathml' }]]} components={mdComponents}>
                  {translatedContent}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-400 dark:text-gray-500 p-8 text-center">
                {isTranslating ? <><Loader2 size={16} className="animate-spin mr-2" /> Translating…</> : 'Click Go to translate this page'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
