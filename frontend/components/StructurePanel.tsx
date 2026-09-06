'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Book } from '@/types'
import { supabase } from '@/lib/supabase'
import { BookOpen, Loader2, AlertCircle, ChevronDown, ChevronUp, Zap, ZapOff, Play, Hash, FileText, MessageCircle, Clock, Image as ImageIcon } from 'lucide-react'

const EXERCISE_KEYWORDS = /\b(exercise|exercises|problem|problems|homework|practice|drill|worksheet|assignment|question|questions|solution|solutions|example|examples|worked example)\b/i

interface StructurePanelProps {
  book: Book
  currentPage: number
  onCorrect?: (prefill: string) => void
  onGenerateImage?: (prompt: string) => void
  onNavigate?: (page: number) => void
}

interface Section {
  id: number
  title: string
  section_type: string
  level: number
  page_num: number
  last_page?: number
  summary?: string
}

interface Concept {
  id: number
  term: string
  concept_type: string
  explanation?: string
  first_page: number
  last_page?: number
}

const CONCEPT_TYPE_COLORS: Record<string, string> = {
  theorem: 'bg-purple-100 text-purple-700',
  lemma: 'bg-purple-100 text-purple-700',
  definition: 'bg-blue-100 text-blue-700',
  equation: 'bg-orange-100 text-orange-700',
  algorithm: 'bg-green-100 text-green-700',
  figure: 'bg-gray-100 text-gray-600',
  table: 'bg-gray-100 text-gray-600',
  citation: 'bg-yellow-100 text-yellow-700',
  concept: 'bg-indigo-100 text-indigo-700',
  example: 'bg-teal-100 text-teal-700',
}

async function fetchStructure(bookId: number, currentPage: number, forceRestart = false) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const functionsBase = (process.env.NEXT_PUBLIC_FUNCTIONS_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) + '/functions/v1'
  const res = await fetch(`${functionsBase}/analyze-structure`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ bookId, currentPage, forceRestart }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to analyze structure')
  }
  return res.json()
}

export default function StructurePanel({ book, currentPage, onCorrect, onGenerateImage, onNavigate }: StructurePanelProps) {
  const [structure, setStructure] = useState<Section[]>([])
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [pageContext, setPageContext] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeProgress, setAnalyzeProgress] = useState<string | null>(null)
  const [autoAnalyze, setAutoAnalyze] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'toc' | 'concepts' | 'exercises'>('toc')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [conceptTimelineId, setConceptTimelineId] = useState<number | null>(null)
  const [conceptTimelines, setConceptTimelines] = useState<Record<number, any[]>>({})
  const lastAnalyzedPageRef = useRef(0)
  const analyzingPageRef = useRef(0)
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const toggleConceptTimeline = async (conceptId: number) => {
    if (conceptTimelineId === conceptId) { setConceptTimelineId(null); return }
    setConceptTimelineId(conceptId)
    if (!conceptTimelines[conceptId]) {
      const { data } = await supabase
        .from('concept_explanation_history')
        .select('page_num, explanation')
        .eq('concept_id', conceptId)
        .order('page_num', { ascending: true })
      setConceptTimelines(prev => ({ ...prev, [conceptId]: data || [] }))
    }
  }

  useEffect(() => {
    loadFromDb()
  }, [book.id])

  useEffect(() => {
    if (!autoAnalyze) return
    if (currentPage <= lastAnalyzedPageRef.current) return
    if (analyzingPageRef.current === currentPage) return

    if (autoTimerRef.current) clearTimeout(autoTimerRef.current)
    autoTimerRef.current = setTimeout(() => {
      analyzingPageRef.current = currentPage
      runAnalysis()
    }, 2000)

    return () => { if (autoTimerRef.current) clearTimeout(autoTimerRef.current) }
  }, [currentPage, autoAnalyze])

  const loadFromDb = async () => {
    try {
      setIsLoading(true)
      const { data: s } = await supabase
        .from('book_structure')
        .select('*')
        .eq('book_id', book.id)
        .lte('page_num', currentPage)
        .order('page_num', { ascending: true })
      const { data: c } = await supabase
        .from('key_concepts')
        .select('*')
        .eq('book_id', book.id)
        .lte('first_page', currentPage)
        .order('first_page', { ascending: true })
      setStructure(s || [])
      setConcepts(c || [])
      const maxPage = (s || []).reduce((m: number, x: any) => Math.max(m, x.last_analyzed_page || 0), 0)
      lastAnalyzedPageRef.current = maxPage
    } catch (err: any) {
      setError('Failed to load structure')
    } finally {
      setIsLoading(false)
    }
  }

  const runAnalysis = useCallback(async (forceRestart = false) => {
    if (isAnalyzing) return
    try {
      setIsAnalyzing(true)
      setError(null)
      setAnalyzeProgress(`Analyzing up to page ${currentPage}…`)
      const result = await fetchStructure(book.id, currentPage, forceRestart)
      setStructure(result.structure || [])
      setConcepts(result.concepts || [])
      if (result.pageContext) setPageContext(result.pageContext)
      const maxPage = (result.structure || []).reduce((m: number, x: any) => Math.max(m, x.last_analyzed_page || 0), 0)
      lastAnalyzedPageRef.current = maxPage
      setAnalyzeProgress(null)
    } catch (err: any) {
      setError(err.message || 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }, [book.id, currentPage, isAnalyzing])

  // Find which section the current page belongs to
  const currentSection = [...structure].reverse().find(s => s.page_num <= currentPage)

  const contentTypeLabel = book.content_type === 'academic_paper' ? 'Paper' : 'Textbook'

  if (isLoading) {
    return <div className="flex items-center justify-center h-48"><div className="spinner" /></div>
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-indigo-600" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Structure</h3>
            <span className="text-xs text-gray-400">{contentTypeLabel} · p.{currentPage}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoAnalyze(v => !v)}
              title={autoAnalyze ? 'Auto-analysis on' : 'Auto-analysis off'}
              className={`p-1.5 rounded-lg transition-colors ${autoAnalyze ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 hover:bg-gray-100'}`}
            >
              {autoAnalyze ? <Zap size={16} /> : <ZapOff size={16} />}
            </button>
            <button
              onClick={() => runAnalysis(false)}
              disabled={isAnalyzing}
              className="btn btn-sm btn-primary"
            >
              {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} className="mr-1" />}
              {isAnalyzing ? '' : 'Analyze'}
            </button>
          </div>
        </div>

        {isAnalyzing && analyzeProgress && (
          <div className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg text-xs text-indigo-700">
            <Loader2 size={12} className="animate-spin flex-shrink-0" />
            {analyzeProgress}
          </div>
        )}

        {/* Where you are now */}
        {pageContext && (
          <div className="p-2.5 bg-indigo-50 rounded-lg border border-indigo-100">
            <p className="text-xs font-medium text-indigo-700 mb-1">Where you are now</p>
            <p className="text-xs text-indigo-900 leading-relaxed">{pageContext}</p>
          </div>
        )}

        {currentSection && !pageContext && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Currently in: <span className="font-medium text-gray-700 dark:text-gray-300">{currentSection.title}</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}
      </div>

      {/* Tab switcher */}
      {(() => {
        const exerciseSections = structure.filter(s => EXERCISE_KEYWORDS.test(s.title))
        return (
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('toc')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'toc' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText size={13} />
              Contents ({structure.length})
            </button>
            <button
              onClick={() => setActiveTab('exercises')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'exercises' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Play size={13} />
              Exercises {exerciseSections.length > 0 ? `(${exerciseSections.length})` : ''}
            </button>
            <button
              onClick={() => setActiveTab('concepts')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'concepts' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Hash size={13} />
              Concepts ({concepts.length})
            </button>
          </div>
        )
      })()}

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'toc' ? (
          structure.length === 0 ? (
            <EmptyState isAnalyzing={isAnalyzing} analyzeProgress={analyzeProgress} onAnalyze={() => runAnalysis()} label="table of contents" />
          ) : (
            <div className="p-3 space-y-1">
              {structure.map((section) => {
                const isCurrent = currentSection?.id === section.id
                const isExpanded = expandedId === section.id
                return (
                  <div
                    key={section.id}
                    className={`rounded-lg border transition-colors ${isCurrent ? 'border-indigo-200 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'}`}
                  >
                    <div className="flex items-start">
                      <button
                        className="flex-1 text-left p-2.5"
                        onClick={() => onNavigate ? onNavigate(section.page_num) : setExpandedId(isExpanded ? null : section.id)}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0" style={{ paddingLeft: `${(section.level - 1) * 12}px` }}>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs font-medium ${isCurrent ? 'text-indigo-700' : 'text-gray-800 dark:text-gray-200'}`}>
                                {section.title}
                              </span>
                              {isCurrent && (
                                <span className="text-xs px-1.5 py-0.5 rounded-full bg-indigo-200 text-indigo-700">here</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-400">{section.section_type} · p.{section.page_num}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                      {section.summary && (
                        <button onClick={() => setExpandedId(isExpanded ? null : section.id)} className="p-2.5 text-gray-400 hover:text-gray-600 flex-shrink-0">
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      )}
                    </div>
                    {isExpanded && section.summary && (
                      <div className="px-2.5 pb-2.5 pt-0">
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{section.summary}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        ) : activeTab === 'exercises' ? (
          (() => {
            const exerciseSections = structure.filter(s => EXERCISE_KEYWORDS.test(s.title))
            if (structure.length === 0) {
              return <EmptyState isAnalyzing={isAnalyzing} analyzeProgress={analyzeProgress} onAnalyze={() => runAnalysis()} label="exercise sections" />
            }
            if (exerciseSections.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-8 gap-2">
                  <Play size={32} className="text-gray-300 mb-1" />
                  <p className="text-sm font-medium text-gray-500">No exercise sections found</p>
                  <p className="text-xs">No exercise or problem headings were detected in the structure analysis.</p>
                </div>
              )
            }
            return (
              <div className="p-3 space-y-1.5">
                <p className="text-xs text-gray-400 mb-2">{exerciseSections.length} section{exerciseSections.length !== 1 ? 's' : ''} — click to jump</p>
                {exerciseSections.map(section => {
                  const isCurrent = currentSection?.id === section.id
                  return (
                    <button
                      key={section.id}
                      onClick={() => onNavigate?.(section.page_num)}
                      className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
                        isCurrent
                          ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                          : 'border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/50 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium flex-1 min-w-0 truncate">{section.title}</span>
                        <span className="text-xs text-indigo-500 flex-shrink-0 font-mono">p.{section.page_num}</span>
                      </div>
                      {section.summary && <p className="text-xs text-gray-400 mt-0.5 truncate">{section.summary}</p>}
                    </button>
                  )
                })}
              </div>
            )
          })()
        ) : (
          concepts.length === 0 ? (
            <EmptyState isAnalyzing={isAnalyzing} analyzeProgress={analyzeProgress} onAnalyze={() => runAnalysis()} label="key concepts" />
          ) : (
            <div className="p-3 space-y-2">
              {concepts.map((concept) => {
                const isExpanded = expandedId === concept.id
                const colorClass = CONCEPT_TYPE_COLORS[concept.concept_type] || 'bg-gray-100 text-gray-600'
                return (
                  <div key={concept.id} className="border border-gray-100 rounded-lg overflow-hidden">
                    <button
                      className="w-full text-left p-2.5 hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : concept.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{concept.term}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${colorClass}`}>
                              {concept.concept_type}
                            </span>
                            <span className="text-xs text-gray-400">p.{concept.first_page}</span>
                          </div>
                          {concept.explanation && !isExpanded && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{concept.explanation}</p>
                          )}
                        </div>
                        {concept.explanation && (
                          isExpanded
                            ? <ChevronUp size={13} className="text-gray-400 flex-shrink-0" />
                            : <ChevronDown size={13} className="text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-2.5 pb-2.5 pt-0 border-t border-gray-100 bg-gray-50 dark:bg-gray-900">
                        {concept.explanation && (
                          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed mt-2 mb-2">{concept.explanation}</p>
                        )}

                        {/* Explanation history timeline */}
                        <div className="mb-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleConceptTimeline(concept.id) }}
                            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300"
                          >
                            <Clock size={11} />
                            {conceptTimelineId === concept.id ? 'Hide history' : 'Show explanation history'}
                          </button>
                          {conceptTimelineId === concept.id && (
                            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                              {(conceptTimelines[concept.id] || []).length === 0 ? (
                                <p className="text-xs text-gray-400 italic">No history recorded yet</p>
                              ) : (
                                (conceptTimelines[concept.id] || []).map((snap: any, i: number) => (
                                  <div key={i} className="flex gap-2 text-xs border-l-2 border-indigo-200 pl-2">
                                    <span className="flex-shrink-0 font-mono text-indigo-600 w-10">p.{snap.page_num}</span>
                                    <span className="text-gray-600 dark:text-gray-300">{snap.explanation}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {onCorrect && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onCorrect(`The ${concept.concept_type} "${concept.term}" is explained as: ${concept.explanation || '(no explanation)'}. Please correct this — `)
                              }}
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                            >
                              <MessageCircle size={11} />
                              Correct in chat
                            </button>
                          )}
                          {onGenerateImage && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onGenerateImage(`${concept.term} (${concept.concept_type}): ${concept.explanation || ''}`)
                              }}
                              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
                            >
                              <ImageIcon size={11} />
                              Image
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>
    </div>
  )
}

function EmptyState({ isAnalyzing, analyzeProgress, onAnalyze, label }: {
  isAnalyzing: boolean; analyzeProgress: string | null; onAnalyze: () => void; label: string
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 text-gray-500 dark:text-gray-400">
      <BookOpen size={40} className="mb-3 text-gray-300" />
      <p className="text-sm font-medium">No {label} yet</p>
      <p className="text-xs mt-1 text-gray-400">
        {isAnalyzing ? (analyzeProgress || 'Analyzing…') : `Click Analyze to build the ${label}`}
      </p>
      {!isAnalyzing && (
        <button onClick={onAnalyze} className="btn btn-sm btn-primary mt-3">
          <Play size={13} className="mr-1" />
          Analyze now
        </button>
      )}
    </div>
  )
}
