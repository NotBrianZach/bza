'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Book as BookType, ScoreBar } from '@/types'
import { imageQueries, toImgProxyUrl } from '@/lib/queries'
import { BookOpen, Trash2, Calendar, FileText, Sparkles, Loader2, Pin, PinOff, Pencil, Check, X, ExternalLink, Bell, BellOff, Download, Tag, Languages, Volume2, BookImage, ChevronUp, ChevronDown } from 'lucide-react'
import { PICTUREBOOK_PRESETS, PicturebookPreset, OPENROUTER_IMAGE_MODELS, TRANSLATE_MODELS, TTS_MODELS, TTS_VOICES } from '@/lib/supabase-queries'
import { booksQueries } from '@/lib/queries'
import { authedFetch } from '@/lib/authedFetch'
import { wikiNewsQueries } from '@/lib/queries'
import { timeAgo } from '@/lib/timeAgo'
import { getScoreBars } from '@/lib/queries/scores'
import { usePicturebook } from '@/lib/usePicturebook'

type ContentType = BookType['content_type']

const TYPE_CONFIG: Record<string, { label: string; pill: string }> = {
  fiction:           { label: 'Fiction',    pill: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-300' },
  textbook:          { label: 'Textbook',   pill: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300' },
  academic_paper:    { label: 'Academic',   pill: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300' },
  math_textbook:     { label: 'Math',       pill: 'text-teal-600 bg-teal-50 dark:bg-teal-900/30 dark:text-teal-300' },
  wikipedia_article: { label: 'Wikipedia',  pill: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-300' },
  news_article:      { label: 'News',       pill: 'text-sky-600 bg-sky-50 dark:bg-sky-900/30 dark:text-sky-300' },
  forum_thread:      { label: 'Forum',      pill: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-300' },
  essay:             { label: 'Essay',      pill: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-300' },
  reference:         { label: 'Reference',  pill: 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300' },
  biography:         { label: 'Biography',  pill: 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-300' },
  manga:             { label: 'Manga',      pill: 'text-pink-600 bg-pink-50 dark:bg-pink-900/30 dark:text-pink-300' },
}
const TYPE_LIST: ContentType[] = ['fiction', 'biography', 'textbook', 'math_textbook', 'academic_paper', 'wikipedia_article', 'news_article', 'forum_thread', 'essay', 'reference', 'manga']

interface BookCardProps {
  book: BookType
  onDelete?: (bookId: number) => void
  onPinToggled?: (bookId: number, pinned: boolean) => void
  onRenamed?: (bookId: number, title: string) => void
  onReclassified?: (bookId: number, type: ContentType) => void
  size?: 'small' | 'medium' | 'large'
}

const SIZE_STYLES = {
  small:  { cover: 'w-14', gap: 'gap-3 p-3', title: 'text-sm', summary: 'text-xs line-clamp-2', icon: 11 },
  medium: { cover: 'w-20', gap: 'gap-4 p-4', title: 'text-base', summary: 'text-sm line-clamp-3', icon: 13 },
  large:  { cover: 'w-28', gap: 'gap-5 p-5', title: 'text-lg', summary: 'text-sm line-clamp-4', icon: 14 },
} as const

export default function BookCard({ book, onDelete, onPinToggled, onRenamed, onReclassified, size = 'medium' }: BookCardProps) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPromptEditor, setShowPromptEditor] = useState(false)
  const [coverPrompt, setCoverPrompt] = useState('')
  const [pinned, setPinned] = useState(!!book.pinned)
  const [followed, setFollowed] = useState(!!book.wiki_followed)
  const [displayTitle, setDisplayTitle] = useState(book.title)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [scoreBars, setScoreBars] = useState<ScoreBar[]>([])
  const [displayType, setDisplayType] = useState<ContentType>(book.content_type)
  const [showTypeMenu, setShowTypeMenu] = useState(false)
  const [showConvertMenu, setShowConvertMenu] = useState(false)
  const [converting, setConverting] = useState<'translate' | 'audiobook' | 'picturebook' | null>(null)
  const [convertPrompt, setConvertPrompt] = useState('')
  const [convertResult, setConvertResult] = useState<string | null>(null)
  const [convertProgress, setConvertProgress] = useState<{ done: number; total: number } | null>(null)
  const [translateModel, setTranslateModel] = useState('deepseek/deepseek-chat-v3')
  const [ttsModel, setTtsModel] = useState(TTS_MODELS[0].id)
  const [ttsVoice, setTtsVoice] = useState(TTS_VOICES[4].id) // nova
  const [ttsSpeed, setTtsSpeed] = useState(1.0)
  const pb = usePicturebook(book.id)

  useEffect(() => {
    imageQueries.getCover(book.id).then(url => setCoverUrl(url)).catch(() => {})
    setScoreBars(getScoreBars().filter(b => b.enabled))
  }, [book.id])

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDelete?.(book.id)
  }

  const handleTogglePin = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const next = !pinned
    setPinned(next)
    try {
      await booksQueries.togglePin(book.id, next)
      onPinToggled?.(book.id, next)
    } catch {
      setPinned(!next) // revert on error
    }
  }

  const openPromptEditor = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCoverPrompt(imageQueries.defaultCoverPrompt(book.title, book.summary))
    setShowPromptEditor(true)
  }

  const handleGenerateCover = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowPromptEditor(false)
    setIsGenerating(true)
    try {
      const img = await imageQueries.generateCover(book.id, book.title, book.summary, coverPrompt || undefined)
      // Use the returned image URL directly — avoids race if DB write is slow
      if (img?.image_url) {
        setCoverUrl(toImgProxyUrl(img.image_url))
      } else {
        const url = await imageQueries.getCover(book.id)
        setCoverUrl(url)
      }
    } catch (err: any) {
      alert(err.message || 'Failed to generate cover')
    } finally {
      setIsGenerating(false)
    }
  }

  const startEditing = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditTitle(displayTitle)
    setEditing(true)
  }

  const commitRename = async () => {
    const trimmed = editTitle.trim()
    if (!trimmed || trimmed === displayTitle) { setEditing(false); return }
    const prevTitle = displayTitle
    setDisplayTitle(trimmed)
    setEditing(false)
    try {
      await booksQueries.update(book.id, { title: trimmed } as any)
      onRenamed?.(book.id, trimmed)
    } catch {
      setDisplayTitle(prevTitle)
    }
  }

  const handleRenameKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); commitRename() }
    if (e.key === 'Escape') { setEditing(false) }
  }

  const handleReclassify = async (type: ContentType) => {
    setShowTypeMenu(false)
    if (type === displayType) return
    const prev = displayType
    setDisplayType(type)
    try {
      await booksQueries.update(book.id, { content_type: type } as any)
      onReclassified?.(book.id, type)
    } catch {
      setDisplayType(prev)
    }
  }

  const startPicturebook = async () => {
    setConverting('picturebook')
    setConvertResult(null)
    const genFn = pb.provider === 'webgpu' ? pb.generateWebGPU : pb.generate
    const { result, reload } = await genFn()
    setConverting(null)
    if (result) setConvertResult(result)
    if (reload) setTimeout(() => window.location.reload(), 1500)
  }

  const startConvert = async (mode: 'translate' | 'audiobook') => {
    setConverting(mode)
    setConvertProgress(null)
    setConvertResult(null)
    try {
      const persona = (() => { try { const p = JSON.parse(localStorage.getItem('bza-persona') ?? '{}'); return p.id !== 'none' ? p.id : undefined } catch { return undefined } })()
      const body: any = { book_id: book.id, mode, persona_id: persona }
      if (mode === 'translate') { body.prompt = convertPrompt; body.translate_model = translateModel }
      if (mode === 'audiobook') { body.tts_model = ttsModel; body.tts_voice = ttsVoice; body.tts_speed = ttsSpeed }
      const res = await authedFetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const { job_id, error } = await res.json()
      if (error || !job_id) { setConvertResult(`Failed to start conversion: ${error || 'No job ID returned. The conversion worker may not be configured — check WORKER_URL and WORKER_SECRET.'}`); setConverting(null); return }

      // Poll for progress
      const poll = async () => {
        const statusRes = await authedFetch(`/api/convert?jobId=${job_id}`)
        const status = await statusRes.json()
        if (status.progress || status.total) setConvertProgress({ done: status.progress ?? 0, total: status.total ?? 0 })
        if (status.status === 'done') {
          setConverting(null)
          setConvertProgress(null)
          if (status.result?.book_id) {
            const label = mode === 'translate' ? 'Translation' : mode === 'audiobook' ? 'Audiobook' : 'Conversion'
            setConvertResult(`${label} complete! New book added to library.`)
            if (mode === 'audiobook' && status.result?.download_url) {
              window.open(status.result.download_url, '_blank')
            }
            setTimeout(() => window.location.reload(), 1500)
          } else {
            setConvertResult('Done')
          }
          return
        }
        if (status.status === 'error') {
          setConverting(null); setConvertProgress(null)
          setConvertResult(`Error during conversion: ${status.error ?? 'Unknown error — check server logs for details.'}`)
          return
        }
        setTimeout(poll, 3000) // poll every 3s
      }
      setTimeout(poll, 2000) // first poll after 2s
    } catch (err: any) { setConvertResult(`Error: ${err?.message || 'Network error — could not reach conversion service.'}`); setConverting(null) }
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const content = await booksQueries.getContent(book.file_path)
      const slug = book.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 60)
      const blob = new Blob([content], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `${slug}.md`; a.click()
      URL.revokeObjectURL(url)
    } catch { /* silent */ }
  }

  return (<>
    <Link href={`/books/${book.id}`}>
      <div className={`book-card card hover:shadow-lg transition-all duration-200 flex ${SIZE_STYLES[size].gap} group relative`}>
        {/* Cover thumbnail */}
        <div className={`relative flex-shrink-0 ${SIZE_STYLES[size].cover} rounded overflow-hidden`} style={{ aspectRatio: '2/3' }}>
          {coverUrl ? (
            <img src={coverUrl} alt={`Cover for ${book.title}`} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
              <BookOpen size={20} className="text-primary-600" />
            </div>
          )}

          {/* Generate / regenerate cover */}
          {!isGenerating && !showPromptEditor && (
            <button
              onClick={openPromptEditor}
              title={coverUrl ? 'Regenerate cover' : 'Generate cover'}
              className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity"
            >
              {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            </button>
          )}
          {isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
              <Loader2 size={12} className="animate-spin" />
            </div>
          )}

        </div>

        {/* Prompt editor popout — floats over the card, larger than the thumbnail */}
        {showPromptEditor && (
          <div
            className="absolute left-0 top-0 z-30 w-full bg-gray-900 rounded-xl shadow-2xl border border-gray-700 p-3 flex flex-col gap-2"
            onClick={e => { e.preventDefault(); e.stopPropagation() }}
          >
            <p className="text-[11px] text-gray-400 font-medium">Cover prompt</p>
            <textarea
              autoFocus
              value={coverPrompt}
              onChange={e => setCoverPrompt(e.target.value)}
              rows={4}
              className="w-full text-xs rounded-lg p-2 bg-gray-800 text-white border border-gray-600 resize-none focus:outline-none focus:border-amber-400"
            />
            <div className="flex gap-2">
              <button onClick={handleGenerateCover} className="flex-1 text-xs py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white font-semibold">Generate</button>
              <button onClick={e => { e.preventDefault(); e.stopPropagation(); setShowPromptEditor(false) }} className="px-3 text-xs py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300">Cancel</button>
            </div>
          </div>
        )}

        {/* Book info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            {editing ? (
              <div className="flex items-center gap-1 mb-1" onClick={e => { e.preventDefault(); e.stopPropagation() }}>
                <input
                  autoFocus
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onKeyDown={handleRenameKey}
                  onBlur={commitRename}
                  className="input text-xs py-0.5 flex-1 min-w-0"
                />
                <button onClick={e => { e.preventDefault(); commitRename() }} className="p-0.5 text-green-600"><Check size={13} /></button>
                <button onClick={e => { e.preventDefault(); setEditing(false) }} className="p-0.5 text-gray-400"><X size={13} /></button>
              </div>
            ) : (
              <div className="flex items-start gap-1 group/title mb-0.5">
                <h3 className={`${SIZE_STYLES[size].title} font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 flex-1 leading-snug`}>
                  {displayTitle}
                </h3>
                <button
                  onClick={startEditing}
                  title="Rename"
                  className="p-1 text-gray-300 hover:text-gray-500 flex-shrink-0 opacity-0 group-hover/title:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity"
                >
                  <Pencil size={11} />
                </button>
              </div>
            )}

            {book.summary && (
              <p className={`${SIZE_STYLES[size].summary} text-gray-500 dark:text-gray-400 leading-relaxed`}>
                {book.summary}
              </p>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-400">
            {book.total_pages > 0 && (
              <span className="flex items-center gap-0.5">
                <FileText size={11} />{book.total_pages}p
              </span>
            )}
            <span className="flex items-center gap-0.5">
              <Calendar size={11} />{timeAgo(new Date(book.created_at))}
            </span>
            {book.source_url && (
              <span className="flex items-center gap-0.5 min-w-0" onClick={e => e.preventDefault()}>
                <ExternalLink size={11} className="shrink-0" />
                <a href={book.source_url} target="_blank" rel="noopener noreferrer" className="truncate text-blue-500 hover:underline" title={book.source_url}>
                  {(() => { try { return new URL(book.source_url).hostname.replace(/^www\./, '') } catch { return book.source_url } })()}
                </a>
              </span>
            )}
            {displayType === 'wikipedia_article' && (
              <span onClick={e => e.preventDefault()}>
                <button
                  onClick={async () => { const next = !followed; setFollowed(next); await wikiNewsQueries.toggleFollow(book.id, next).catch(() => setFollowed(!next)) }}
                  title={followed ? 'Unfollow updates' : 'Follow for news updates'}
                  className={`flex items-center gap-0.5 transition-colors ${followed ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 hover:text-amber-500'}`}
                >
                  {followed ? <Bell size={11} /> : <BellOff size={11} />}
                  {followed ? 'Following' : 'Follow'}
                </button>
              </span>
            )}
          </div>

          {onDelete && (
            <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <button onClick={handleTogglePin} title={pinned ? 'Unpin' : 'Pin to top'} className={`flex items-center gap-0.5 text-xs transition-colors ${pinned ? 'text-purple-600' : 'text-gray-300 hover:text-gray-500'}`}>
                  {pinned ? <Pin size={11} /> : <PinOff size={11} />}
                </button>
                <button onClick={handleDownload} title="Download as markdown" className="text-gray-300 hover:text-blue-500 transition-colors">
                  <Download size={11} />
                </button>
              </div>
              {/* Language tag */}
              {book.language && book.language !== 'en' && (
                <span className="rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-300 uppercase">
                  {book.language}
                </span>
              )}
              {/* Content type badge — click to reclassify */}
              <span className="relative" onClick={e => { e.preventDefault(); e.stopPropagation() }}>
                <button
                  onClick={e => { e.preventDefault(); e.stopPropagation(); if (onReclassified) setShowTypeMenu(v => !v) }}
                  title={onReclassified ? 'Change type' : (displayType ? TYPE_CONFIG[displayType]?.label : undefined)}
                  className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium transition-opacity ${
                    displayType && TYPE_CONFIG[displayType] ? TYPE_CONFIG[displayType].pill : 'text-gray-400 bg-gray-100 dark:bg-gray-700'
                  } ${onReclassified ? 'cursor-pointer hover:opacity-70' : 'cursor-default'}`}
                >
                  <Tag size={9} />
                  {displayType ? TYPE_CONFIG[displayType]?.label ?? displayType : '—'}
                </button>
                {showTypeMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={e => { e.preventDefault(); e.stopPropagation(); setShowTypeMenu(false) }} />
                    <div
                      className="absolute right-0 bottom-full mb-1 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-[148px]"
                      onClick={e => { e.preventDefault(); e.stopPropagation() }}
                    >
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 px-3 pt-1 pb-1 font-semibold uppercase tracking-wide">Set type</p>
                      {TYPE_LIST.map(t => (
                        <button
                          key={t}
                          onClick={() => handleReclassify(t)}
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-700/60 flex items-center gap-2 transition-colors"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t && TYPE_CONFIG[t] ? TYPE_CONFIG[t].pill.split(' ')[0].replace('text', 'bg') : ''}`} />
                          <span className={displayType === t ? 'font-semibold text-gray-900 dark:text-gray-100' : ''}>
                            {TYPE_CONFIG[t!]?.label}
                          </span>
                          {displayType === t && <Check size={10} className="ml-auto text-gray-500" />}
                        </button>
                      ))}
                      {displayType && (
                        <button
                          onClick={() => handleReclassify(undefined as any)}
                          className="w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors"
                        >
                          Clear type
                        </button>
                      )}
                    </div>
                  </>
                )}
              </span>
              <button onClick={handleDelete} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-0.5 transition-colors">
                <Trash2 size={11} />Trash
              </button>
            </div>
          )}

          {/* Transform button — own line, prominent */}
          {onDelete && (
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); setShowConvertMenu(true) }}
              className={`mt-1.5 w-full flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all ${
                converting
                  ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 animate-pulse'
                  : 'bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-900/20 dark:to-fuchsia-900/20 text-violet-600 dark:text-violet-300 hover:from-violet-100 hover:to-fuchsia-100 dark:hover:from-violet-900/40 dark:hover:to-fuchsia-900/40 border border-violet-200/60 dark:border-violet-700/40'
              }`}
            >
              {converting ? <Loader2 size={13} className="animate-spin" /> : <Languages size={13} />}
              {converting ? 'Transforming…' : 'Transform'}
            </button>
          )}

          {/* Picturebook progress / unfinished status */}
          {pb.runStatus && (
            <div className="mt-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-700" onClick={e => { e.preventDefault(); e.stopPropagation() }}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  {(pb.runStatus.status === 'analyzing' || pb.runStatus.status === 'generating') ? (
                    <Loader2 size={10} className="animate-spin text-amber-500" />
                  ) : pb.runStatus.status === 'failed' || pb.runStatus.error ? (
                    <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                  ) : null}
                  <span className={`text-[10px] font-medium ${pb.runStatus.status === 'failed' ? 'text-red-500' : 'text-amber-600 dark:text-amber-400'}`}>
                    {pb.runStatus.status === 'analyzing' ? 'Analyzing text...'
                      : pb.runStatus.status === 'generating' ? `Generating ${pb.runStatus.done}/${pb.runStatus.total}`
                      : pb.runStatus.status === 'failed' ? `Failed (${pb.runStatus.done}/${pb.runStatus.total} done)`
                      : `Unfinished (${pb.runStatus.done}/${pb.runStatus.total})`}
                  </span>
                </div>
                <div className="flex gap-1">
                  {(pb.runStatus.status === 'failed' || (pb.runStatus.status === 'completed' && pb.runStatus.done < pb.runStatus.total)) && (
                    <button
                      onClick={async () => {
                        setConverting('picturebook')
                        await pb.retryFailed()
                        setConverting(null)
                        window.location.reload()
                      }}
                      className="text-[10px] text-amber-600 hover:text-amber-700 font-medium"
                    >
                      Retry
                    </button>
                  )}
                  {(pb.runStatus.status === 'analyzing' || pb.runStatus.status === 'generating') && (
                    <button
                      onClick={async () => {
                        await pb.cancel()
                        setConverting(null)
                        setConvertResult('Cancelled')
                      }}
                      className="text-[10px] text-red-500 hover:text-red-600 font-medium"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
              {pb.runStatus.total > 0 && (
                <div className="w-full bg-amber-100 dark:bg-amber-900/30 rounded-full h-1">
                  <div className={`h-1 rounded-full transition-all ${pb.runStatus.status === 'failed' ? 'bg-red-400' : 'bg-amber-500'}`} style={{ width: `${(pb.runStatus.done / pb.runStatus.total * 100)}%` }} />
                </div>
              )}
            </div>
          )}

          {/* AI Score Bars */}
          {scoreBars.length > 0 && book.scores && Object.keys(book.scores).length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 space-y-1.5">
              {scoreBars.filter(bar => book.scores![bar.label] !== undefined).map(bar => (
                <div key={bar.id}>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{bar.label}</span>
                    <span className="text-[10px] text-gray-400">{book.scores![bar.label]}/100</span>
                  </div>
                  {(bar.leftLabel || bar.rightLabel) && (
                    <div className="flex justify-between text-[9px] text-gray-400 mb-0.5">
                      <span>{bar.leftLabel}</span>
                      <span>{bar.rightLabel}</span>
                    </div>
                  )}
                  <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-amber-400 transition-all duration-500"
                      style={{ width: `${book.scores![bar.label]}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>

    {/* Convert modal — renders outside Link to avoid click-through */}
    {showConvertMenu && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50" onClick={() => setShowConvertMenu(false)}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-5 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Languages size={16} className="text-violet-500" />
              Convert "{displayTitle}"
            </h3>
            <button onClick={() => setShowConvertMenu(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X size={16} />
            </button>
          </div>

          {/* In-progress banner */}
          {converting && (
            <div className="mb-4 p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
              <div className="flex items-center gap-2 mb-1">
                <Loader2 size={14} className="animate-spin text-violet-600 dark:text-violet-400" />
                <span className="text-sm font-semibold text-violet-800 dark:text-violet-200">
                  {converting === 'translate' ? 'Translating' : converting === 'audiobook' ? 'Converting to audiobook' : 'Generating picturebook'}
                </span>
              </div>
              <p className="text-xs text-violet-600 dark:text-violet-300 truncate">{displayTitle}</p>
              {convertProgress && (
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] text-violet-500 dark:text-violet-400 mb-1">
                    <span>{converting === 'audiobook' ? 'Audio' : 'Page'} {convertProgress.done} of {convertProgress.total}</span>
                    <span>{convertProgress.total > 0 ? Math.round(convertProgress.done / convertProgress.total * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-violet-200 dark:bg-violet-800 rounded-full h-1.5">
                    <div className="bg-violet-500 h-1.5 rounded-full transition-all" style={{ width: `${convertProgress.total > 0 ? (convertProgress.done / convertProgress.total * 100) : 0}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            {/* Translate section */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Translate / Transform</p>
                <span className="text-[10px] text-gray-400">{book.total_pages}p &middot; est. ${(book.total_pages * parseFloat((TRANSLATE_MODELS.find(m => m.id === translateModel)?.cost || '~$0.001').replace(/[^0-9.]/g, '')) * 2).toFixed(2)}</span>
              </div>
              <input
                type="text"
                value={convertPrompt}
                onChange={e => setConvertPrompt(e.target.value)}
                placeholder="translate to Spanish, simplify for children, modernize language…"
                className="input w-full text-sm py-2 mb-2"
              />
              <select value={translateModel} onChange={e => setTranslateModel(e.target.value)} className="input text-xs w-full mb-2">
                {TRANSLATE_MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.label} ({m.cost})</option>
                ))}
              </select>
              <button
                onClick={() => startConvert('translate')}
                disabled={!!converting || !convertPrompt.trim()}
                className="w-full flex items-center justify-center gap-2 text-sm px-4 py-2.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 transition-colors"
              >
                {converting === 'translate' ? <Loader2 size={14} className="animate-spin" /> : <Languages size={14} />}
                {converting === 'translate' ? (convertProgress ? `Translating page ${convertProgress.done}/${convertProgress.total}…` : 'Starting…') : 'Translate whole book'}
              </button>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700" />

            {/* Audiobook section */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Audiobook</p>
                <span className="text-[10px] text-gray-400">{book.total_pages}p &middot; est. ${(book.total_pages * (book.char_page_length || 420) / 1000 * (ttsModel === 'tts-1-hd' ? 0.030 : 0.015) * 2).toFixed(2)}</span>
              </div>
              {/* Voice selector — grid for easy comparison */}
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">Voice</p>
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {TTS_VOICES.map(v => (
                  <button key={v.id} onClick={() => setTtsVoice(v.id)}
                    className={`text-left text-[10px] px-2 py-1.5 rounded border transition-colors ${
                      ttsVoice === v.id ? 'border-green-400 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 font-medium'
                      : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-green-300'}`}>
                    {v.label}
                  </button>
                ))}
              </div>
              {/* Model & speed */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">Quality</p>
                  <select value={ttsModel} onChange={e => setTtsModel(e.target.value)} className="input text-xs w-full">
                    {TTS_MODELS.map(m => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">Speed ({ttsSpeed}x)</p>
                  <input
                    type="range" min="0.5" max="2.0" step="0.1" value={ttsSpeed}
                    onChange={e => setTtsSpeed(parseFloat(e.target.value))}
                    className="w-full accent-green-500"
                  />
                </div>
              </div>
              <button
                onClick={() => startConvert('audiobook')}
                disabled={!!converting}
                className="w-full flex items-center justify-center gap-2 text-sm px-4 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 transition-colors"
              >
                {converting === 'audiobook' ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={14} />}
                {converting === 'audiobook' ? (convertProgress ? `Page ${convertProgress.done}/${convertProgress.total}…` : 'Starting…') : 'Convert to audiobook'}
              </button>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700" />

            {/* Picturebook section */}
            <div>
              {(() => {
                const wordsPerPage = 60 // ~420 chars / ~7 chars per word
                const totalWords = book.total_pages * wordsPerPage
                const numImages = Math.max(1, Math.round(totalWords / 1000 * 3))
                const selectedModel = OPENROUTER_IMAGE_MODELS.find(m => m.id === pb.imageModel)
                const perImageCost = parseFloat((selectedModel?.cost || '~$0.04').replace(/[^0-9.]/g, '')) || 0.04
                const imgCost = pb.provider === 'openrouter' ? numImages * perImageCost * 2 : 0
                const analysisCost = 0.01
                const totalEst = imgCost + analysisCost
                return (
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Picturebook</p>
                    <span className="text-[10px] text-gray-400">
                      {book.total_pages}p &middot; ~{numImages} images &middot; {pb.provider === 'openrouter' ? `est. $${totalEst.toFixed(2)}` : 'free (local)'}
                    </span>
                  </div>
                )
              })()}
              <p className="text-[10px] text-gray-400 mb-2">AI analyzes text and generates illustrations at key moments.</p>

              {/* Preset grid */}
              <div className="grid grid-cols-2 gap-1.5 mb-2">
                {(Object.entries(PICTUREBOOK_PRESETS) as [PicturebookPreset, typeof PICTUREBOOK_PRESETS[PicturebookPreset]][]).map(([key, p]) => (
                  <button key={key} onClick={() => { pb.setPreset(key); pb.setContentFilter(p.contentFilter); if (key === 'custom') pb.setShowAdvanced(true) }}
                    className={`text-left text-[10px] px-2 py-1.5 rounded border transition-colors ${
                      pb.preset === key ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
                      : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:border-amber-300'}`}>
                    <span className="font-medium">{p.label}</span>
                    {key === 'custom' && <span className="block text-gray-400 dark:text-gray-500">{p.description}</span>}
                  </button>
                ))}
              </div>

              {/* Custom guidance */}
              <textarea
                value={pb.guidance}
                onChange={e => pb.setGuidance(e.target.value)}
                placeholder="Custom instructions (optional): e.g. 'focus on landscapes', 'anime-style characters', 'include the dog in every scene'..."
                className="input text-xs w-full resize-none mb-2"
                rows={2}
              />

              {/* Customize toggle — auto-open for Custom preset */}
              {pb.preset !== 'custom' && (
                <button onClick={() => pb.setShowAdvanced(!pb.showAdvanced)} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-2">
                  {pb.showAdvanced ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  {pb.showAdvanced ? 'Hide' : 'Customize'} models &amp; provider
                </button>
              )}

              {(pb.showAdvanced || pb.preset === 'custom') && (
                <div className="space-y-2 mb-2 pl-2 border-l-2 border-gray-200 dark:border-gray-600">
                  {/* Analysis LLM */}
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">Analysis LLM (finds illustration points)</p>
                    <select value={pb.analysisModel} onChange={e => pb.setAnalysisModel(e.target.value)} className="input text-xs w-full">
                      {TRANSLATE_MODELS.map(m => (
                        <option key={m.id} value={m.id}>{m.label} ({m.cost})</option>
                      ))}
                    </select>
                  </div>

                  {/* Image provider */}
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">Image provider</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {([['openrouter', 'Cloud (paid)'], ['webgpu', 'Browser (free)']] as [PicturebookProvider, string][]).map(([prov, label]) => (
                        <button key={prov} onClick={() => pb.setProvider(prov)}
                          className={`text-[10px] px-2 py-1.5 rounded border transition-colors ${
                            pb.provider === prov ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 font-medium'
                            : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-amber-300'}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Image model selector */}
                  {pb.provider === 'openrouter' && (
                    <div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">Image model</p>
                      <select value={pb.imageModel} onChange={e => pb.setImageModel(e.target.value)} className="input text-xs w-full">
                        {OPENROUTER_IMAGE_MODELS.map(m => (
                          <option key={m.id} value={m.id}>{m.label} ({m.cost})</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {pb.provider === 'webgpu' && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400">SD Turbo in browser via WebGPU. Free, no data leaves your machine.</p>
                  )}
                  {/* Content filter */}
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">Content filter</p>
                    <select value={pb.contentFilter} onChange={e => pb.setContentFilter(e.target.value)} className="input text-xs w-full">
                      <option value="strict">Strict (family-friendly)</option>
                      <option value="moderate">Moderate</option>
                      <option value="permissive">Permissive (sensual, violence OK)</option>
                      <option value="none">None (uncensored)</option>
                    </select>
                  </div>
                  {/* Image style override */}
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">Image style (overrides preset)</p>
                    <input
                      value={pb.guidance.includes('style:') ? pb.guidance.split('style:')[1]?.split('\n')[0]?.trim() || '' : ''}
                      onChange={e => {
                        const base = pb.guidance.replace(/style:.*?(\n|$)/g, '').trim()
                        pb.setGuidance(e.target.value ? `${base}\nstyle: ${e.target.value}`.trim() : base)
                      }}
                      placeholder="e.g. watercolor, oil painting, manga, pixel art..."
                      className="input text-xs w-full"
                    />
                  </div>
                  {/* Negative prompt */}
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">Negative prompt (what to avoid)</p>
                    <input
                      value={pb.guidance.includes('avoid:') ? pb.guidance.split('avoid:')[1]?.split('\n')[0]?.trim() || '' : ''}
                      onChange={e => {
                        const base = pb.guidance.replace(/avoid:.*?(\n|$)/g, '').trim()
                        pb.setGuidance(e.target.value ? `${base}\navoid: ${e.target.value}`.trim() : base)
                      }}
                      placeholder="e.g. text, watermarks, blurry, extra fingers..."
                      className="input text-xs w-full"
                    />
                  </div>
                </div>
              )}


              <button
                onClick={startPicturebook}
                disabled={!!converting}
                className="w-full flex items-center justify-center gap-2 text-sm px-4 py-2.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-40 transition-colors"
              >
                {converting === 'picturebook' ? <Loader2 size={14} className="animate-spin" /> : <BookImage size={14} />}
                {converting === 'picturebook' ? 'Generating…' : 'Generate picturebook'}
              </button>
            </div>
          </div>

          {convertResult && (
            <div className={`mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs p-2.5 rounded-lg ${
              convertResult.toLowerCase().includes('error') || convertResult.toLowerCase().includes('failed') || convertResult.toLowerCase().includes('not configured')
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
            }`}>
              <p className="font-medium mb-0.5">{convertResult.toLowerCase().includes('error') || convertResult.toLowerCase().includes('failed') ? 'Conversion failed' : 'Success'}</p>
              <p className="text-[10px] opacity-80 break-words">{convertResult}</p>
            </div>
          )}
        </div>
      </div>
    )}
    </>
  )
}
