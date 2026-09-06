'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Book } from '@/types'
import { characterQueries } from '@/lib/queries'
import { Users, Play, Loader2, AlertCircle, ChevronDown, ChevronUp, RefreshCw, Clock, Image as ImageIcon, Merge, Pencil, Trash2, Plus, Check, X, Sparkles, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { MergeSuggestion } from '@/lib/queries/characters'

interface CharacterPanelProps {
  book: Book
  currentPage: number
  onCorrect?: (prefill: string) => void
  onGenerateImage?: (prompt: string) => void
}

interface Mention {
  id?: number
  page_num: number
  evidence?: string
}

interface Character {
  id: number
  name: string
  type: string
  summary?: string
  reasoning?: string
  first_page?: number
  last_page?: number
  last_analyzed_page?: number
  character_mentions?: Mention[]
}

export default function CharacterPanel({ book, currentPage, onCorrect, onGenerateImage }: CharacterPanelProps) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeProgress, setAnalyzeProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [timelineId, setTimelineId] = useState<number | null>(null)
  const [timelines, setTimelines] = useState<Record<number, any[]>>({})
  const [merging, setMerging] = useState(false)
  const [mergeMode, setMergeMode] = useState(false)
  const [mergeSelected, setMergeSelected] = useState<Set<number>>(new Set())
  const [mergePrimaryId, setMergePrimaryId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editSummary, setEditSummary] = useState('')
  const [addMentionId, setAddMentionId] = useState<number | null>(null)
  const [newMentionPage, setNewMentionPage] = useState('')
  const [newMentionEvidence, setNewMentionEvidence] = useState('')
  const [lastAnalyzedPage, setLastAnalyzedPage] = useState(0)
  const [mergeSuggestions, setMergeSuggestions] = useState<MergeSuggestion[]>([])
  const [showMergeSuggestions, setShowMergeSuggestions] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [pageFilter, setPageFilter] = useState('')  // e.g. "5" or "10-25"
  const lastAnalyzedPageRef = useRef(0)

  useEffect(() => {
    loadCharacters()
  }, [book.id])


  const loadCharacters = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await characterQueries.list(book.id) as Character[]
      setCharacters(data)
      // Track highest analyzed page from existing data
      const maxAnalyzed = data.reduce((max, c) => Math.max(max, c.last_analyzed_page ?? 0), 0)
      lastAnalyzedPageRef.current = maxAnalyzed
      setLastAnalyzedPage(maxAnalyzed)
    } catch (err: any) {
      setError('Failed to load characters')
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

      const result = await (characterQueries.analyze as any)(book.id, undefined, currentPage, forceRestart)
      setCharacters(result.characters || [])
      const maxAnalyzed = (result.characters as Character[]).reduce(
        (max, c) => Math.max(max, c.last_analyzed_page ?? 0), 0
      )
      lastAnalyzedPageRef.current = maxAnalyzed
      setLastAnalyzedPage(maxAnalyzed)
      setAnalyzeProgress(null)
    } catch (err: any) {
      setError(err.message || 'Failed to analyze characters')
    } finally {
      setIsAnalyzing(false)
    }
  }, [book.id, currentPage, isAnalyzing])

  const toggleTimeline = async (characterId: number) => {
    if (timelineId === characterId) { setTimelineId(null); return }
    setTimelineId(characterId)
    if (!timelines[characterId]) {
      const { data } = await supabase
        .from('character_summary_history')
        .select('page_num, summary')
        .eq('character_id', characterId)
        .order('page_num', { ascending: true })
      setTimelines(prev => ({ ...prev, [characterId]: data || [] }))
    }
  }

  const handleMergeConfirm = async () => {
    if (!mergePrimaryId || mergeSelected.size < 2) return
    const primary = characters.find(c => c.id === mergePrimaryId)
    const secondaries = [...mergeSelected].filter(id => id !== mergePrimaryId)
    if (!primary || secondaries.length === 0) return
    const names = secondaries.map(id => characters.find(c => c.id === id)?.name).filter(Boolean)
    if (!confirm(`Merge ${names.join(', ')} into "${primary.name}"?`)) return
    setMerging(true)
    try {
      for (const secId of secondaries) {
        await characterQueries.merge(mergePrimaryId, secId)
      }
      await loadCharacters()
      setMergeMode(false)
      setMergeSelected(new Set())
      setMergePrimaryId(null)
    } catch (err: any) {
      setError(err.message || 'Failed to merge characters')
    } finally {
      setMerging(false)
    }
  }

  const fetchMergeSuggestions = async () => {
    setLoadingSuggestions(true)
    try {
      const result = await characterQueries.suggestMerges(book.id)
      setMergeSuggestions(result.suggestions || [])
      setShowMergeSuggestions(true)
    } catch (err: any) {
      setError(err.message || 'Failed to get merge suggestions')
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const applyMergeSuggestion = async (suggestion: MergeSuggestion) => {
    if (!confirm(`Merge ${suggestion.merge_names.join(', ')} into "${suggestion.primary_name}"?`)) return
    setMerging(true)
    try {
      for (const secId of suggestion.merge_ids) {
        await characterQueries.merge(suggestion.primary_id, secId)
      }
      await loadCharacters()
      setMergeSuggestions(prev => prev.filter(s => s.primary_id !== suggestion.primary_id))
    } catch (err: any) {
      setError(err.message || 'Failed to merge characters')
    } finally {
      setMerging(false)
    }
  }

  // Parse page filter: supports single page "5" or range "10-25"
  const parsePageFilter = (): { start: number; end: number } | null => {
    if (!pageFilter.trim()) return null
    const rangeMatch = pageFilter.match(/^(\d+)\s*[-–]\s*(\d+)$/)
    if (rangeMatch) return { start: parseInt(rangeMatch[1]), end: parseInt(rangeMatch[2]) }
    const single = parseInt(pageFilter)
    if (!isNaN(single)) return { start: single, end: single }
    return null
  }

  // Characters visible to the reader (introduced on or before currentPage)
  const pageRange = parsePageFilter()
  const visibleCharacters = characters
    .filter(c => (c.first_page ?? 1) <= currentPage)
    .filter(c => {
      if (!pageRange) return true
      // Show character if they have any mention within the page range
      const mentions = c.character_mentions || []
      const mentionPages = mentions.map(m => m.page_num)
      // Also check first/last page range overlap
      const charStart = c.first_page ?? 1
      const charEnd = c.last_page ?? currentPage
      const hasOverlap = charStart <= pageRange.end && charEnd >= pageRange.start
      const hasMentionInRange = mentionPages.some(p => p >= pageRange.start && p <= pageRange.end)
      return hasMentionInRange || (mentions.length === 0 && hasOverlap)
    })

  if (isLoading) {
    return <div className="flex items-center justify-center h-48"><div className="spinner" /></div>
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-purple-600" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Characters</h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Analyze */}
            <button
              onClick={() => runAnalysis(false)}
              disabled={isAnalyzing || lastAnalyzedPage >= currentPage}
              title={lastAnalyzedPage >= currentPage ? 'Already analyzed to current page' : `Analyze pages ${lastAnalyzedPage + 1}–${Math.min(lastAnalyzedPage + 50, currentPage)}`}
              className="btn btn-sm btn-primary"
            >
              {isAnalyzing
                ? <Loader2 size={14} className="animate-spin" />
                : <Play size={14} className="mr-1" />}
              {isAnalyzing ? '' : lastAnalyzedPage >= currentPage ? 'Up to date' : `→ p.${Math.min(lastAnalyzedPage + 50, currentPage)}`}
            </button>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Analyzed: p.1–{lastAnalyzedPage || 0}</span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span>Reading: p.{currentPage}</span>
          {lastAnalyzedPage < currentPage && !isAnalyzing && (
            <span className="text-amber-600 dark:text-amber-400">({currentPage - lastAnalyzedPage} pages behind)</span>
          )}
        </div>

        {/* Page filter */}
        <div className="flex items-center gap-2">
          <Filter size={12} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={pageFilter}
            onChange={e => setPageFilter(e.target.value)}
            placeholder="Filter pages (e.g. 5 or 10-25)"
            className="flex-1 text-xs border border-gray-200 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 placeholder-gray-400"
          />
          {pageFilter && (
            <button onClick={() => setPageFilter('')} className="text-gray-400 hover:text-gray-600">
              <X size={12} />
            </button>
          )}
        </div>

        {isAnalyzing && analyzeProgress && (
          <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-xs text-purple-700 dark:text-purple-300">
            <Loader2 size={12} className="animate-spin flex-shrink-0" />
            {analyzeProgress}
          </div>
        )}


        {error && (
          <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}
      </div>

      {/* Character list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {visibleCharacters.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 text-gray-500 dark:text-gray-400">
            <Users size={40} className="mb-3 text-gray-300" />
            <p className="text-sm font-medium">{pageFilter ? 'No characters on these pages' : 'No characters yet'}</p>
            <p className="text-xs mt-1 text-gray-400">
              {pageFilter
                ? `No characters found for pages ${pageFilter}. Try a different range.`
                : isAnalyzing ? (analyzeProgress || 'Analyzing…') : 'Click Analyze to detect characters up to your current page'}
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {merging && (
              <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-xs text-purple-700 dark:text-purple-300">
                <Loader2 size={12} className="animate-spin" /> Merging characters…
              </div>
            )}

            {/* Merge toolbar */}
            {!mergeMode ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMergeMode(true)}
                  className="text-[10px] text-gray-400 dark:text-gray-500 px-1 flex items-center gap-1 hover:text-purple-600 transition-colors"
                >
                  <Merge size={10} /> Merge duplicates
                </button>
                <button
                  onClick={fetchMergeSuggestions}
                  disabled={loadingSuggestions || characters.length < 2}
                  className="text-[10px] text-gray-400 dark:text-gray-500 px-1 flex items-center gap-1 hover:text-purple-600 transition-colors disabled:opacity-40"
                  title="AI suggests which characters might be duplicates"
                >
                  {loadingSuggestions ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                  AI suggest merges
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-xs text-purple-700 dark:text-purple-300 flex-1">
                  Select characters to merge. <strong>Radio = keep this name.</strong>
                </p>
                <button
                  onClick={handleMergeConfirm}
                  disabled={merging || mergeSelected.size < 2 || !mergePrimaryId}
                  className="text-xs px-2.5 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-40"
                >
                  Merge ({mergeSelected.size})
                </button>
                <button
                  onClick={() => { setMergeMode(false); setMergeSelected(new Set()); setMergePrimaryId(null) }}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* AI Merge Suggestions Dialog */}
            {showMergeSuggestions && mergeSuggestions.length > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-200 flex items-center gap-1">
                    <Sparkles size={12} /> AI Merge Suggestions
                  </p>
                  <button
                    onClick={() => setShowMergeSuggestions(false)}
                    className="text-amber-600 hover:text-amber-800 dark:text-amber-400"
                  >
                    <X size={14} />
                  </button>
                </div>
                {mergeSuggestions.map((suggestion, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-amber-100 dark:border-gray-700">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                        Keep: <strong>{suggestion.primary_name}</strong>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Merge in: {suggestion.merge_names.join(', ')}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 italic">
                        {suggestion.reason}
                      </p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded mt-1 inline-block ${
                        suggestion.confidence === 'high'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                      }`}>
                        {suggestion.confidence} confidence
                      </span>
                    </div>
                    <button
                      onClick={() => applyMergeSuggestion(suggestion)}
                      disabled={merging}
                      className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-40 flex-shrink-0"
                    >
                      {merging ? <Loader2 size={11} className="animate-spin" /> : 'Merge'}
                    </button>
                  </div>
                ))}
              </div>
            )}
            {showMergeSuggestions && mergeSuggestions.length === 0 && !loadingSuggestions && (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic px-1">No duplicate characters detected.</p>
            )}

            {visibleCharacters.map((character) => {
              const mentions = character.character_mentions || []
              const isExpanded = expandedId === character.id
              const mentionPages = [...new Set(mentions.map(m => m.page_num))].sort((a, b) => a - b)

              return (
                <div
                  key={character.id}
                  className={`border rounded-lg overflow-hidden bg-white dark:bg-gray-800 transition-all ${
                    mergeSelected.has(character.id) ? 'border-purple-400 dark:border-purple-500 ring-1 ring-purple-200' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {/* Character header */}
                  <div className="flex items-start gap-2 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    {/* Merge controls */}
                    {mergeMode && (
                      <div className="flex flex-col items-center gap-1 pt-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={mergeSelected.has(character.id)}
                          onChange={e => {
                            const next = new Set(mergeSelected)
                            if (e.target.checked) { next.add(character.id) } else { next.delete(character.id); if (mergePrimaryId === character.id) setMergePrimaryId(null) }
                            setMergeSelected(next)
                          }}
                          className="rounded"
                          title="Select for merge"
                        />
                        {mergeSelected.has(character.id) && (
                          <input
                            type="radio"
                            name="merge-primary"
                            checked={mergePrimaryId === character.id}
                            onChange={() => setMergePrimaryId(character.id)}
                            className="text-purple-600"
                            title="Keep this name"
                          />
                        )}
                      </div>
                    )}
                    <button
                      className="flex-1 text-left min-w-0"
                      onClick={() => setExpandedId(isExpanded ? null : character.id)}
                    >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{character.name}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                            {character.type}
                          </span>
                          {character.first_page && (
                            <span className="text-xs text-gray-400">first: p.{character.first_page}</span>
                          )}
                        </div>

                        {/* Summary */}
                        {character.summary && (
                          <p className={`text-xs text-gray-600 dark:text-gray-300 mt-1 ${isExpanded ? '' : 'line-clamp-2'}`}>
                            {character.summary}
                          </p>
                        )}
                      </div>
                      {isExpanded ? <ChevronUp size={14} className="text-gray-400 flex-shrink-0 mt-0.5" /> : <ChevronDown size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />}
                    </div>

                    {/* Timeline bar */}
                    {mentionPages.length > 0 && (
                      <div className="mt-2">
                        <Timeline pages={mentionPages} currentPage={currentPage} totalPages={book.total_pages} />
                      </div>
                    )}
                    </button>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-3 bg-gray-50 dark:bg-gray-900/50">
                      {/* Reasoning */}
                      {character.reasoning && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Reasoning</p>
                          <p className="text-xs text-gray-600 dark:text-gray-300 italic">{character.reasoning}</p>
                        </div>
                      )}

                      {/* Editable summary */}
                      {editingId === character.id ? (
                        <div className="space-y-2" onClick={e => e.stopPropagation()}>
                          <textarea
                            value={editSummary}
                            onChange={e => setEditSummary(e.target.value)}
                            className="w-full text-xs border border-gray-200 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 resize-none"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={async () => { await characterQueries.update(character.id, { summary: editSummary }); setEditingId(null); loadCharacters() }}
                              className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-1"
                            ><Check size={11} /> Save</button>
                            <button onClick={() => setEditingId(null)} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"><X size={11} /> Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingId(character.id); setEditSummary(character.summary || '') }}
                          className="text-[10px] text-gray-400 hover:text-purple-600 flex items-center gap-1"
                        >
                          <Pencil size={9} /> Edit summary
                        </button>
                      )}

                      {/* Appearance timeline with evidence — editable */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Appearances</p>
                          <button
                            onClick={(e) => { e.stopPropagation(); setAddMentionId(addMentionId === character.id ? null : character.id); setNewMentionPage(String(currentPage)); setNewMentionEvidence('') }}
                            className="text-[10px] text-purple-600 hover:text-purple-700 flex items-center gap-0.5"
                          >
                            <Plus size={10} /> Add
                          </button>
                        </div>
                        {addMentionId === character.id && (
                          <div className="flex gap-1.5 mb-2" onClick={e => e.stopPropagation()}>
                            <input type="number" value={newMentionPage} onChange={e => setNewMentionPage(e.target.value)} className="w-14 text-xs input py-1" placeholder="Page" />
                            <input type="text" value={newMentionEvidence} onChange={e => setNewMentionEvidence(e.target.value)} className="flex-1 text-xs input py-1" placeholder="Evidence quote (optional)" />
                            <button
                              onClick={async () => { if (!newMentionPage) return; await characterQueries.addMention(character.id, parseInt(newMentionPage), newMentionEvidence || undefined); setAddMentionId(null); loadCharacters() }}
                              className="text-xs px-2 py-1 bg-purple-600 text-white rounded"
                            ><Check size={11} /></button>
                          </div>
                        )}
                        {mentions.length > 0 && (
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {mentions
                              .filter(m => m.page_num <= currentPage)
                              .sort((a, b) => a.page_num - b.page_num)
                              .map((mention, i) => (
                                <div key={mention.id ?? i} className="flex gap-2 text-xs group items-start">
                                  <span className="flex-shrink-0 font-mono text-purple-600 w-10">p.{mention.page_num}</span>
                                  <span className="text-gray-600 dark:text-gray-300 italic flex-1">{mention.evidence ? `"${mention.evidence}"` : '—'}</span>
                                  {mention.id && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); if (confirm('Remove this mention?')) { characterQueries.deleteMention(mention.id!).then(loadCharacters) } }}
                                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 flex-shrink-0"
                                      title="Remove mention"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  )}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>

                      {/* Summary history timeline */}
                      <div>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleTimeline(character.id) }}
                          className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300"
                        >
                          <Clock size={11} />
                          {timelineId === character.id ? 'Hide history' : 'Show summary history'}
                        </button>
                        {timelineId === character.id && (
                          <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                            {(timelines[character.id] || []).length === 0 ? (
                              <p className="text-xs text-gray-400 italic">No history recorded yet</p>
                            ) : (
                              (timelines[character.id] || []).map((snap: any, i: number) => (
                                <div key={i} className="flex gap-2 text-xs border-l-2 border-purple-200 pl-2">
                                  <span className="flex-shrink-0 font-mono text-purple-600 w-10">p.{snap.page_num}</span>
                                  <span className="text-gray-600 dark:text-gray-300">{snap.summary}</span>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {/* Re-analyze button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); runAnalysis(true) }}
                          disabled={isAnalyzing}
                          className="btn btn-sm btn-secondary flex items-center justify-center gap-1"
                        >
                          <RefreshCw size={12} />
                          Re-analyze
                        </button>

                        {/* Delete character */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm(`Delete "${character.name}" and all their mentions?`)) {
                              characterQueries.deleteCharacter(character.id).then(loadCharacters).catch(err => setError(err.message))
                            }
                          }}
                          className="btn btn-sm btn-secondary flex items-center justify-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>

                        {/* Generate image */}
                        {onGenerateImage && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onGenerateImage(`${character.name}: ${character.summary || character.type}`)
                            }}
                            className="btn btn-sm btn-secondary flex items-center justify-center gap-1 text-purple-600 hover:text-purple-700"
                          >
                            <ImageIcon size={12} />
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
        )}
      </div>
    </div>
  )
}

// Visual timeline showing which pages a character appears on
function Timeline({ pages, currentPage, totalPages }: { pages: number[]; currentPage: number; totalPages: number }) {
  const pageSet = new Set(pages)
  // Render a mini bar with dots at mention positions
  return (
    <div className="relative h-1.5 bg-gray-200 rounded-full overflow-hidden">
      {pages.map(p => (
        <div
          key={p}
          className={`absolute top-0 h-full w-1 rounded-full ${p <= currentPage ? 'bg-purple-500' : 'bg-gray-300'}`}
          style={{ left: `${((p - 1) / Math.max(totalPages - 1, 1)) * 100}%` }}
          title={`Page ${p}`}
        />
      ))}
      {/* Reader position marker */}
      <div
        className="absolute top-0 h-full w-0.5 bg-blue-400"
        style={{ left: `${((currentPage - 1) / Math.max(totalPages - 1, 1)) * 100}%` }}
        title={`Current page ${currentPage}`}
      />
    </div>
  )
}
