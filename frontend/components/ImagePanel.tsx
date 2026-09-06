'use client'

import { useState, useEffect } from 'react'
import { Book } from '@/types'
import { imageQueries, booksQueries, characterQueries, PageImage } from '@/lib/queries'
import { supabase } from '@/lib/supabase'
import { Image as ImageIcon, Plus, Trash2, Loader2, AlertCircle, Download, FileText, ExternalLink, X } from 'lucide-react'
import type { InlineImage } from '@/components/BookReader'
import { timeAgo } from '@/lib/timeAgo'

interface SuggestedPrompt {
  label: string
  prompt: string
}

interface ImagePanelProps {
  book: Book
  currentPage: number
  prefill?: string | null
  onPrefillConsumed?: () => void
  inlineImages?: InlineImage[]
  onNavigate?: (page: number) => void
  getPageSource?: (page: number) => string | null
}

export default function ImagePanel({ book, currentPage, prefill, onPrefillConsumed, inlineImages = [], onNavigate, getPageSource }: ImagePanelProps) {
  const [images, setImages] = useState<PageImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showGenerateForm, setShowGenerateForm] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAllPages, setShowAllPages] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    prompt: '',
    style: 'vivid',
    size: '1024x1024'
  })
  const [error, setError] = useState<string | null>(null)
  const [suggestedPrompts, setSuggestedPrompts] = useState<SuggestedPrompt[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  useEffect(() => {
    loadImages()
  }, [book.id])

  // When the page changes, reset the form so fresh suggestions are loaded on next open
  useEffect(() => {
    setShowGenerateForm(false)
    setFormData({ prompt: '', style: 'vivid', size: '1024x1024' })
    setSuggestedPrompts([])
  }, [currentPage])

  // When a prefill prompt arrives (from character/concept "Image" button), open the form with it
  useEffect(() => {
    if (prefill && !isLoading) {
      setFormData(prev => ({ ...prev, prompt: prefill }))
      setShowGenerateForm(true)
      onPrefillConsumed?.()
    }
  }, [prefill, isLoading])

  const loadImages = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await imageQueries.list(book.id)
      setImages(data)
    } catch (err: any) {
      console.error('Error loading images:', err)
      setError('Failed to load images')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenForm = async () => {
    setShowGenerateForm(true)
    setSuggestedPrompts([])
    setLoadingSuggestions(true)

    const isFiction = !book.content_type || book.content_type === 'fiction'
    const isAcademic = book.content_type === 'academic_paper'

    try {
      // Broad prompt needs no page text
      const broadPrompt = isFiction
        ? `A vivid illustration from "${book.title}", page ${currentPage}`
        : isAcademic
          ? `A scientific diagram from "${book.title}", page ${currentPage}`
          : `An educational illustration from "${book.title}", page ${currentPage}`

      // Text-based prompt — use reader's page source if available, else fetch
      let textPrompt = ''
      try {
        const content = getPageSource?.(currentPage) ?? await booksQueries.getPage(book.id, currentPage)
        const snippet = content.replace(/\s+/g, ' ').trim().slice(0, 200)
        if (isFiction) {
          textPrompt = `A vivid illustration of the scene in "${book.title}" on page ${currentPage}: ${snippet}`
        } else if (isAcademic) {
          textPrompt = `A scientific diagram illustrating content from "${book.title}" page ${currentPage}: ${snippet}`
        } else {
          textPrompt = `An educational illustration from "${book.title}" page ${currentPage}: ${snippet}`
        }
      } catch {
        // Fall back to broad prompt if page fetch fails
      }

      // Pre-fill textarea with text-based prompt (or broad if text unavailable)
      if (!formData.prompt) {
        setFormData(prev => ({ ...prev, prompt: textPrompt || broadPrompt }))
      }

      // Build suggestions list
      const suggestions: SuggestedPrompt[] = [
        { label: 'Page scene (broad)', prompt: broadPrompt },
        ...(textPrompt ? [{ label: 'Page scene (from text)', prompt: textPrompt }] : []),
      ]

      if (isFiction) {
        const chars = await characterQueries.list(book.id) as any[]
        const onPage = chars.filter(c =>
          (c.character_mentions || []).some((m: any) => m.page_num === currentPage)
        )
        for (const char of onPage.slice(0, 6)) {
          const mention = (char.character_mentions || []).find((m: any) => m.page_num === currentPage)
          const context = mention?.evidence
            ? `"${mention.evidence}"`
            : char.summary?.slice(0, 100) || ''
          suggestions.push({
            label: `${char.name}${char.type ? ` · ${char.type}` : ''}`,
            prompt: `A detailed portrait of ${char.name}${char.type ? ` (${char.type})` : ''} from "${book.title}"${context ? `, page ${currentPage}: ` + context : ''}`,
          })
        }
      } else {
        // Concepts on or before current page, most recent first
        const { data: concepts } = await supabase
          .from('key_concepts')
          .select('id, term, concept_type, explanation, first_page')
          .eq('book_id', book.id)
          .lte('first_page', currentPage)
          .order('first_page', { ascending: false })
          .limit(6)
        for (const concept of (concepts || [])) {
          const explanation = concept.explanation?.slice(0, 120) || ''
          suggestions.push({
            label: `${concept.term} · ${concept.concept_type}`,
            prompt: isAcademic
              ? `A scientific visualization of ${concept.concept_type} "${concept.term}" from "${book.title}"${explanation ? ': ' + explanation : ''}`
              : `An educational diagram of "${concept.term}" (${concept.concept_type}) from "${book.title}"${explanation ? ': ' + explanation : ''}`,
          })
        }
      }

      setSuggestedPrompts(suggestions)
    } catch {
      // Suggestions are best-effort
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setError(null)
      setIsGenerating(true)
      const image = await imageQueries.generate(book.id, currentPage, formData.prompt)
      setImages(prev => [image, ...prev])
      setShowGenerateForm(false)
      setFormData({ prompt: '', style: 'vivid', size: '1024x1024' })
      setSuggestedPrompts([])
    } catch (err: any) {
      console.error('Error generating image:', err)
      if (err.message?.includes('quota')) {
        setError('Image quota exceeded. Free tier: 10/month, Pro: 100/month')
      } else {
        setError(err.message || 'Failed to generate image')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Delete this image?')) return

    try {
      await imageQueries.delete(imageId)
      setImages(prev => prev.filter(img => img.id !== imageId))
    } catch (err: any) {
      alert(err.message || 'Failed to delete image')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ImageIcon size={20} className="text-green-600" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Images</h3>
          </div>

          <button
            onClick={() => showGenerateForm ? setShowGenerateForm(false) : handleOpenForm()}
            className="btn btn-sm btn-primary"
            disabled={isGenerating}
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Generate Form */}
        {showGenerateForm && !isGenerating && (
          <form onSubmit={handleGenerateImage} className="mt-3 space-y-2">
            <textarea
              placeholder="Describe the image you want to generate..."
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              className="input w-full text-sm resize-none"
              rows={3}
              required
            />

            {/* Suggested prompts from characters / concepts */}
            {loadingSuggestions && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Loader2 size={12} className="animate-spin" />
                Loading suggestions…
              </div>
            )}
            {!loadingSuggestions && suggestedPrompts.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {!book.content_type || book.content_type === 'fiction'
                    ? 'Suggestions (page & characters):'
                    : 'Suggestions (page & concepts):'}
                </p>
                <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                  {suggestedPrompts.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, prompt: s.prompt }))}
                      className="text-left text-xs px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-600 text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <select
                value={formData.style}
                onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                className="input text-sm"
              >
                <option value="vivid">Vivid</option>
                <option value="natural">Natural</option>
              </select>

              <select
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="input text-sm"
              >
                <option value="1024x1024">Square (1024x1024)</option>
                <option value="1792x1024">Landscape (1792x1024)</option>
                <option value="1024x1792">Portrait (1024x1792)</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn btn-sm btn-primary flex-1">
                Generate Image
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowGenerateForm(false)
                  setFormData({ prompt: '', style: 'vivid', size: '1024x1024' })
                  setSuggestedPrompts([])
                }}
                className="btn btn-sm btn-secondary"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Cost: ~$0.08 per image (2x API cost markup)
            </p>
          </form>
        )}

        {/* Generation Progress */}
        {isGenerating && (
          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-900 dark:text-green-300">
                Generating image...
              </span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start">
            <AlertCircle size={16} className="text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}
      </div>

      {/* Images Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {images.length === 0 && inlineImages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center px-4">
            <div className="text-gray-500 dark:text-gray-400">
              <ImageIcon size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No images generated yet</p>
              <p className="text-xs mt-1">
                {isGenerating
                  ? 'Generating your first image...'
                  : 'Click + to generate images for this book'}
              </p>
            </div>
          </div>
        ) : (() => {
          const currentPageImages = images.filter(img => img.page_num === currentPage)
          const otherImages = images.filter(img => img.page_num !== currentPage)
          const visibleImages = showAllPages ? images : currentPageImages

          const renderImage = (image: PageImage) => (
            <div key={image.id} className="card overflow-hidden">
              <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 cursor-pointer" onClick={() => setLightboxUrl(image.image_url)}>
                <img src={image.image_url} alt={image.prompt} className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
              </div>
              <div className="p-3">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">{image.prompt}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    {image.source === 'extracted'
                      ? <><FileText size={11} className="text-blue-500" /> Extracted from PDF</>
                      : image.created_at
                        ? timeAgo(new Date(image.created_at))
                        : 'Just now'
                    }
                  </span>
                  <div className="flex gap-2">
                    <a href={image.image_url} download target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700" title="Download">
                      <Download size={14} />
                    </a>
                    <button onClick={() => handleDeleteImage(image.id)} className="text-red-600 hover:text-red-700" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {image.page_num && image.page_num !== currentPage && (
                  <button
                    onClick={() => onNavigate?.(image.page_num)}
                    className={`mt-2 text-xs ${onNavigate ? 'text-blue-500 hover:text-blue-700 hover:underline cursor-pointer' : 'text-gray-400 dark:text-gray-500'}`}
                  >
                    Page {image.page_num} →
                  </button>
                )}
              </div>
            </div>
          )

          return (
            <div className="p-4 space-y-4">
              {/* Inline images from content */}
              {inlineImages.length > 0 && (
                <>
                  {(images.length > 0 || !showAllPages) && (
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">From Content</p>
                  )}
                  {inlineImages.map((img, i) => (
                    <figure key={`inline-${i}`}>
                      <img src={img.url} alt={img.alt} referrerPolicy="no-referrer" className="w-full rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setLightboxUrl(img.url)} />
                      <figcaption className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between gap-2">
                        {img.alt && <span className="truncate italic">{img.alt}</span>}
                        <div className="flex items-center gap-2 shrink-0 ml-auto">
                          {img.page > 0 && (
                            <button onClick={() => onNavigate?.(img.page)} className={onNavigate ? 'text-blue-500 hover:underline' : ''}>p.{img.page}</button>
                          )}
                          <a href={img.url} target="_blank" rel="noopener noreferrer" title="Open image" className="text-blue-500 hover:text-blue-700">
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      </figcaption>
                    </figure>
                  ))}
                </>
              )}

              {/* Page filter toggle */}
              {images.length > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    {showAllPages ? 'All Images' : `Page ${currentPage}`}
                  </p>
                  {otherImages.length > 0 && (
                    <button
                      onClick={() => setShowAllPages(v => !v)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {showAllPages ? `Page ${currentPage} only` : `Show all (${images.length})`}
                    </button>
                  )}
                </div>
              )}

              {/* Images for current page (or all) */}
              {visibleImages.length > 0
                ? visibleImages.map(renderImage)
                : (
                  <div className="text-center py-6 text-gray-400 dark:text-gray-500">
                    <p className="text-sm">No images for page {currentPage}</p>
                    <p className="text-xs mt-1">Click + to generate one, or
                      {otherImages.length > 0 && (
                        <button onClick={() => setShowAllPages(true)} className="text-blue-500 hover:underline ml-1">
                          show all {images.length} images
                        </button>
                      )}
                    </p>
                  </div>
                )
              }
            </div>
          )
        })()}
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt=""
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/40 rounded-full p-2"
          >
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  )
}
