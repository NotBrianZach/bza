'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Book } from '@/types'
import { X, Loader2, ChevronDown, ChevronRight, BookOpen, Image } from 'lucide-react'
import { authedFetch } from '@/lib/authedFetch'
import { getModelChoice } from '@/lib/persona'
import { imageQueries } from '@/lib/queries/images'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

// ── Types ──

interface Problem {
  id: string
  title: string
  text: string
  pageNum: number
}

interface ProblemEdge {
  from: string
  to: string
  label: string
  type: string
}

interface NarrativeNode {
  id: string
  narrative: string
  imagePrompt: string
  imageUrl?: string
  choices: { targetId: string; text: string }[]
}

interface ProblemMapWidgetProps {
  book: Book
  getPageSource: (page: number) => string | null
  onClose: () => void
  onNavigate?: (page: number) => void
}

// ── Extraction regexes ──

const EXERCISE_HEADER_RE = /^(?:#{1,4}\s+)?(?:\*{0,2})?(?:EXERCISES?\b|PROBLEMS?\s*(?:SETS?)?\b|HOMEWORK|WORKSHEET|PRACTICE|ASSIGNMENT|DRILL)\b/i
const SECTION_BREAK_RE = /^(?:#{1,4}\s|\\(?:section|subsection|chapter)\*?\{|(?:\*{0,2})?(?:EXERCISES?|EXAMPLES?|PROBLEMS?\s|THEOREMS?|LEMMAS?|DEFINITIONS?|PROOFS?|SOLUTIONS?)\s+[\d\[])/i
// Strict: require "Exercise/Problem/Question" prefix for numbered items
const STRICT_PROBLEM_RE = /^(?:\*{0,2})?(?:Exercise|Problem|Question)\s+(\d+[\.\):]?[a-z]?)\s*(?:\*{0,2})?[.:]?\s*(.{8,})/i
// Chapter/section heading detection
const CHAPTER_RE = /^(?:#{1,4}\s+)?(?:\*{0,2})?(?:Chapter|CHAPTER)\s+(\d+)/i
const SECTION_RE = /^(?:#{1,4}\s+)?(?:\*{0,2})?(?:Section|SECTION|§)\s*(\d+)(?:[.\-–](\d+))?/i

/**
 * Extract problems from a page. For full-book scanning, this is strict:
 * - Only extract from pages that have exercise/problem headers
 * - Only match lines with explicit "Exercise/Problem/Question" prefixes
 * - Skip TOC, index, and other non-exercise content
 */
function extractProblemsStrict(source: string, pageNum: number): Problem[] {
  const lines = source.split('\n')

  // First check: does this page have exercise headers?
  let hasExerciseHeader = false
  const exerciseStarts: number[] = []
  const allBreaks: number[] = []

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (EXERCISE_HEADER_RE.test(trimmed)) {
      hasExerciseHeader = true
      exerciseStarts.push(i)
      allBreaks.push(i)
    } else if (SECTION_BREAK_RE.test(trimmed)) {
      allBreaks.push(i)
    }
  }

  // No exercise header on this page → skip entirely
  if (!hasExerciseHeader) return []

  // Extract exercise blocks (whole sections)
  if (exerciseStarts.length > 0) {
    const blocks: Problem[] = []
    for (const start of exerciseStarts) {
      const nextBreak = allBreaks.find(b => b > start) ?? lines.length
      const blockLines = lines.slice(start + 1, nextBreak) // skip the header itself

      // Extract individual numbered problems within the block
      let i = 0
      while (i < blockLines.length) {
        const line = blockLines[i].trim()
        const m = line.match(STRICT_PROBLEM_RE)
        if (m) {
          const textLines = [line]
          let j = i + 1
          while (j < blockLines.length && blockLines[j].trim() && !blockLines[j].trim().match(STRICT_PROBLEM_RE)) {
            textLines.push(blockLines[j].trim())
            j++
          }
          const text = textLines.join('\n')
          if (text.length > 15) {
            blocks.push({
              id: `map-${pageNum}-${start}-${i}`,
              title: m[1].replace(/[.:)]$/, '').trim(),
              text,
              pageNum,
            })
          }
          i = j
        } else {
          i++
        }
      }

      // If no individual problems found, add the whole block
      if (blocks.length === 0) {
        const text = lines.slice(start, nextBreak).join('\n').trim()
        if (text.length > 20) {
          const rawTitle = lines[start].trim().replace(/^#{1,4}\s+/, '').replace(/\*{1,2}/g, '').trim()
          const title = rawTitle.length > 45 ? rawTitle.slice(0, 45) + '…' : rawTitle
          blocks.push({ id: `map-blk-${pageNum}-${start}`, title, text, pageNum })
        }
      }
    }
    return blocks
  }

  return []
}

/** Detect chapter/section context from a page's source */
function detectContext(source: string): { chapter?: string; section?: string } {
  for (const line of source.split('\n')) {
    const trimmed = line.trim().replace(/^#{1,4}\s+/, '').replace(/\*{1,2}/g, '').trim()
    const cm = trimmed.match(CHAPTER_RE)
    if (cm) return { chapter: cm[1] }
    const sm = trimmed.match(SECTION_RE)
    if (sm) return { chapter: sm[1], section: sm[2] }
    // Exercise headers often have chapter.section numbers
    if (EXERCISE_HEADER_RE.test(trimmed)) {
      const numMatch = trimmed.match(/(\d+)(?:[.–-](\d+))?\s*$/)
      if (numMatch) return { chapter: numMatch[1], section: numMatch[2] }
    }
  }
  return {}
}

// ── Auto-group into chapter/section tree ──

interface TreeLabel {
  id: string
  name: string
  parentId: string | null
  children: TreeLabel[]
  problems: Problem[]
}

function buildTree(problems: Problem[], contextByPage: Map<number, { chapter?: string; section?: string }>): TreeLabel[] {
  const labels: TreeLabel[] = []
  const findLabel = (name: string, parentId: string | null) =>
    labels.find(l => l.name === name && l.parentId === parentId)

  // Group problems by page
  const byPage = new Map<number, Problem[]>()
  for (const p of problems) {
    if (!byPage.has(p.pageNum)) byPage.set(p.pageNum, [])
    byPage.get(p.pageNum)!.push(p)
  }

  // Track current chapter as we go through pages in order
  let currentChapter: string | null = null
  const sortedPages = [...byPage.keys()].sort((a, b) => a - b)

  for (const pageNum of sortedPages) {
    const pageProblems = byPage.get(pageNum)!
    const ctx = contextByPage.get(pageNum)

    // Update current chapter from page context
    if (ctx?.chapter) currentChapter = ctx.chapter
    const chapterNum = currentChapter
    const sectionNum = ctx?.section ?? null

    if (chapterNum) {
      const chapterName = `Chapter ${chapterNum}`
      let chapterLabel = findLabel(chapterName, null)
      if (!chapterLabel) {
        chapterLabel = { id: `tree-ch-${chapterNum}`, name: chapterName, parentId: null, children: [], problems: [] }
        labels.push(chapterLabel)
      }

      let target = chapterLabel
      if (sectionNum) {
        const secName = `§${chapterNum}.${sectionNum}`
        let secLabel = chapterLabel.children.find(c => c.name === secName)
        if (!secLabel) {
          secLabel = { id: `tree-sec-${chapterNum}-${sectionNum}`, name: secName, parentId: chapterLabel.id, children: [], problems: [] }
          chapterLabel.children.push(secLabel)
        }
        target = secLabel
      }

      for (const p of pageProblems) target.problems.push(p)
    } else {
      // No chapter context — group under "Uncategorized"
      let uncatLabel = findLabel('Uncategorized', null)
      if (!uncatLabel) {
        uncatLabel = { id: 'tree-uncat', name: 'Uncategorized', parentId: null, children: [], problems: [] }
        labels.push(uncatLabel)
      }
      for (const p of pageProblems) uncatLabel.problems.push(p)
    }
  }

  return labels
}

const MathContent = ({ children }: { children: string }) => {
  // Normalize \(...\) and \[...\] to $...$ / $$...$$ for remark-math
  const normalized = children
    .replace(/\\\((.+?)\\\)/g, '$$$1$$')
    .replace(/\\\[(.+?)\\\]/gs, '\n$$$$\n$1\n$$$$\n')
  return (
    <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}>
        {normalized}
      </ReactMarkdown>
    </div>
  )
}

// ── Provider / model selector ──

const TEXT_MODELS = [
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'openai' },
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'openai' },
  { id: 'anthropic/claude-haiku-4-5', label: 'Claude Haiku 4.5', provider: 'openrouter' },
  { id: 'anthropic/claude-sonnet-4-6', label: 'Claude Sonnet 4.6', provider: 'openrouter' },
]

const IMAGE_PROVIDERS = [
  { id: 'default', label: 'Default (Edge Function)' },
]

// ── Widget ──

type Stage = 'idle' | 'scanning' | 'scanned' | 'graphing' | 'graphed' | 'narrating' | 'narrated' | 'imaging' | 'imaged'

export default function ProblemMapWidget({ book, getPageSource, onClose, onNavigate }: ProblemMapWidgetProps) {
  const [stage, setStage] = useState<Stage>('idle')
  const [problems, setProblems] = useState<Problem[]>([])
  const [tree, setTree] = useState<TreeLabel[]>([])
  const [edges, setEdges] = useState<ProblemEdge[]>([])
  const [narrative, setNarrative] = useState<NarrativeNode[]>([])
  const [activeNarrativeId, setActiveNarrativeId] = useState<string | null>(null)
  const [scanProgress, setScanProgress] = useState(0)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  // Options
  const [wantGraph, setWantGraph] = useState(true)
  const [wantNarrative, setWantNarrative] = useState(false)
  const [wantImages, setWantImages] = useState(false)
  const [narrativeStyle, setNarrativeStyle] = useState('fantasy adventure')
  const [showSettings, setShowSettings] = useState(false)
  const [textModel, setTextModel] = useState(() => {
    const choice = getModelChoice('problemSet')
    return TEXT_MODELS.find(m => m.id === choice.model) ? choice.model : 'gpt-4o-mini'
  })
  const [imageProvider] = useState('default')

  const textModelInfo = TEXT_MODELS.find(m => m.id === textModel) ?? TEXT_MODELS[0]

  const toggleCollapse = (id: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Stage 1: Scan ──

  const SCAN_CACHE_KEY = `bza-problemmap-${book.id}`

  // Try to restore a previous scan from localStorage on mount
  const [cacheChecked, setCacheChecked] = useState(false)
  if (!cacheChecked) {
    try {
      const cached = localStorage.getItem(SCAN_CACHE_KEY)
      if (cached) {
        const data = JSON.parse(cached) as { problems: Problem[]; tree?: TreeLabel[]; edges?: ProblemEdge[]; narrative?: NarrativeNode[] }
        if (data.problems?.length) {
          setProblems(data.problems)
          if (data.tree?.length) setTree(data.tree)
          if (data.edges?.length) setEdges(data.edges)
          if (data.narrative?.length) { setNarrative(data.narrative); setActiveNarrativeId(data.narrative[0].id) }
          setStage(data.narrative?.length ? 'narrated' : data.edges?.length ? 'graphed' : 'scanned')
        }
      }
    } catch {}
    setCacheChecked(true)
  }

  // Persist scan results to localStorage whenever they change
  const persistCache = useCallback((p: Problem[], t: TreeLabel[], e: ProblemEdge[], n: NarrativeNode[]) => {
    try {
      localStorage.setItem(SCAN_CACHE_KEY, JSON.stringify({
        problems: p.map(({ id, title, text, pageNum }) => ({ id, title, text, pageNum })),
        tree: t.length > 0 ? t : undefined,
        edges: e.length > 0 ? e : undefined,
        narrative: n.length > 0 ? n : undefined,
      }))
    } catch {}
  }, [SCAN_CACHE_KEY])

  const scan = useCallback(async () => {
    setStage('scanning')
    setScanProgress(0)
    const allProblems: Problem[] = []
    const total = book.total_pages ?? 1
    const fingerprints = new Set<string>()

    // Wait for BookReader content to load (it downloads the full book lazily)
    let waited = 0
    while (!getPageSource(1) && waited < 30000) {
      await new Promise(r => setTimeout(r, 500))
      waited += 500
    }
    if (!getPageSource(1)) {
      setStage('idle')
      return
    }

    // Two-pass scan:
    // Pass 1: detect chapter/section context on every page
    const contextByPage = new Map<number, { chapter?: string; section?: string }>()
    let lastChapter: string | undefined
    for (let page = 1; page <= total; page++) {
      const src = getPageSource(page)
      if (src) {
        const ctx = detectContext(src)
        if (ctx.chapter) lastChapter = ctx.chapter
        contextByPage.set(page, { chapter: ctx.chapter ?? lastChapter, section: ctx.section })
      }
      setScanProgress(Math.min(49, Math.round((page / total) * 50)))
      if (page % 50 === 0) await new Promise(r => setTimeout(r, 0))
    }

    // Pass 2: extract problems only from exercise pages
    for (let page = 1; page <= total; page++) {
      const src = getPageSource(page)
      if (src) {
        const extracted = extractProblemsStrict(src, page)
        for (const p of extracted) {
          const fp = p.text.trim().slice(0, 80)
          if (!fingerprints.has(fp)) {
            fingerprints.add(fp)
            allProblems.push(p)
          }
        }
      }
      setScanProgress(50 + Math.min(49, Math.round((page / total) * 50)))
      if (page % 20 === 0) await new Promise(r => setTimeout(r, 0))
    }

    setScanProgress(100)
    setProblems(allProblems)
    const builtTree = buildTree(allProblems, contextByPage)
    setTree(builtTree)
    setStage('scanned')
    persistCache(allProblems, builtTree, [], [])

    // Auto-continue to graph if toggled
    if (wantGraph && allProblems.length >= 2) {
      await generateGraph(allProblems)
    }
  }, [book, getPageSource, wantGraph, persistCache])

  // Auto-scan on mount if no cached data
  const autoScannedRef = useRef(false)
  useEffect(() => {
    if (stage === 'idle' && !autoScannedRef.current && problems.length === 0) {
      autoScannedRef.current = true
      scan()
    }
  }, [stage, problems.length, scan])

  // ── Stage 2: Graph ──

  const generateGraph = useCallback(async (probs?: Problem[]) => {
    const p = probs ?? problems
    if (p.length < 2) return
    setStage('graphing')
    try {
      const res = await authedFetch('/api/problem-set-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: '',
          mode: 'graph',
          bookTitle: book.title,
          problems: p.map(x => ({ id: x.id, title: x.title, text: x.text })),
          model: textModel,
          provider: textModelInfo.provider,
        }),
      })
      const data = await res.json()
      const newEdges = data.edges ?? []
      setEdges(newEdges)
      setStage('graphed')
      persistCache(p, tree, newEdges, [])

      if (wantNarrative && p.length >= 2) {
        await generateNarrative(p, newEdges)
      }
    } catch (e) {
      console.error('graph error', e)
      setStage('scanned')
    }
  }, [problems, book.title, textModel, textModelInfo.provider, wantNarrative, persistCache])

  // ── Stage 3: Narrative ──

  const generateNarrative = useCallback(async (probs?: Problem[], graphEdges?: ProblemEdge[]) => {
    const p = probs ?? problems
    const e = graphEdges ?? edges
    setStage('narrating')
    try {
      const res = await authedFetch('/api/problem-set-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: '',
          mode: 'narrative',
          bookTitle: book.title,
          problems: p.map(x => ({ id: x.id, title: x.title, text: x.text })),
          edges: e,
          narrativeStyle,
          model: textModel,
          provider: textModelInfo.provider,
        }),
      })
      const data = await res.json()
      const newNodes = data.nodes ?? []
      setNarrative(newNodes)
      if (newNodes.length) setActiveNarrativeId(newNodes[0].id)
      setStage('narrated')
      persistCache(p, tree, e, newNodes)

      if (wantImages && newNodes.length) {
        await generateImages(newNodes)
      }
    } catch (e) {
      console.error('narrative error', e)
      setStage(graphEdges?.length ? 'graphed' : 'scanned')
    }
  }, [problems, edges, book.title, narrativeStyle, textModel, textModelInfo.provider, wantImages, persistCache])

  // ── Stage 4: Images ──

  const generateImages = useCallback(async (nodes?: NarrativeNode[]) => {
    const n = nodes ?? narrative
    if (!n.length) return
    setStage('imaging')
    const updated = [...n]
    for (let i = 0; i < updated.length; i++) {
      if (updated[i].imageUrl) continue
      try {
        const node = updated[i]
        const problem = problems.find(p => p.id === node.id)
        const result = await imageQueries.generate(
          book.id,
          problem?.pageNum ?? 1,
          node.imagePrompt
        )
        updated[i] = { ...updated[i], imageUrl: result.image_url }
        setNarrative([...updated])
      } catch (e) {
        console.error('image gen error for node', updated[i].id, e)
      }
    }
    setStage('imaged')
  }, [narrative, problems, book.id])

  // ── Active narrative node ──
  const activeNode = narrative.find(n => n.id === activeNarrativeId)
  const activeProblem = activeNode ? problems.find(p => p.id === activeNode.id) : null

  const isRunning = ['scanning', 'graphing', 'narrating', 'imaging'].includes(stage)

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-gray-900">
      <div
        className="flex-1 flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30">
          <BookOpen size={20} className="text-violet-600 dark:text-violet-400" />
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Problem Map</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{book.title}</p>
          </div>
          <button onClick={() => setShowSettings(v => !v)} className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800 text-gray-400">
            <span className="text-sm">⚙</span>
          </button>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800 text-gray-400">
            <X size={16} />
          </button>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 space-y-3">
            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                <input type="checkbox" checked={wantGraph} onChange={e => setWantGraph(e.target.checked)} className="rounded" />
                Generate graph
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                <input type="checkbox" checked={wantNarrative} onChange={e => setWantNarrative(e.target.checked)} className="rounded" />
                CYOA narrative
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                <input type="checkbox" checked={wantImages} onChange={e => setWantImages(e.target.checked)} disabled={!wantNarrative} className="rounded disabled:opacity-40" />
                Generate images
              </label>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <label className="text-xs text-gray-500 dark:text-gray-400">
                Text model:
                <select
                  value={textModel}
                  onChange={e => setTextModel(e.target.value)}
                  className="ml-2 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1"
                >
                  {TEXT_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </label>
              <label className="text-xs text-gray-500 dark:text-gray-400">
                Image provider:
                <select
                  value={imageProvider}
                  disabled
                  className="ml-2 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 disabled:opacity-60"
                >
                  {IMAGE_PROVIDERS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </label>
            </div>
            {wantNarrative && (
              <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                Story style:
                <input
                  type="text"
                  value={narrativeStyle}
                  onChange={e => setNarrativeStyle(e.target.value)}
                  placeholder="fantasy adventure, sci-fi, noir detective..."
                  className="flex-1 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1"
                />
              </label>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">

          {/* Idle state */}
          {stage === 'idle' && (
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center gap-5">
              <BookOpen size={56} className="text-violet-300 dark:text-violet-700" />
              <div>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">Scan entire book for problems</p>
                <p className="text-sm text-gray-400 mt-2 max-w-md">
                  Parses all {book.total_pages} pages, builds a chapter/section tree
                  {wantGraph ? ', generates a semantic relationship graph' : ''}
                  {wantNarrative ? ', creates a Choose Your Own Adventure story' : ''}
                  {wantImages ? ' with illustrations' : ''}.
                </p>
              </div>
              <button
                onClick={scan}
                className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors text-sm font-medium"
              >
                ▶ Scan & Build
              </button>
            </div>
          )}

          {/* Scanning progress */}
          {stage === 'scanning' && (
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center gap-4">
              <Loader2 size={32} className="animate-spin text-violet-500" />
              <p className="text-sm text-gray-500">Scanning pages… {scanProgress}%</p>
              <div className="w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 transition-all" style={{ width: `${scanProgress}%` }} />
              </div>
              <p className="text-xs text-gray-400">{problems.length} problems found so far</p>
            </div>
          )}

          {/* Graphing / Narrating / Imaging progress */}
          {(stage === 'graphing' || stage === 'narrating' || stage === 'imaging') && (
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center gap-4">
              <Loader2 size={32} className="animate-spin text-violet-500" />
              <p className="text-sm text-gray-500">
                {stage === 'graphing' && 'Generating semantic graph…'}
                {stage === 'narrating' && 'Writing narrative…'}
                {stage === 'imaging' && `Generating images… (${narrative.filter(n => n.imageUrl).length}/${narrative.length})`}
              </p>
            </div>
          )}

          {/* Results */}
          {!isRunning && stage !== 'idle' && (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">

              {/* Stats bar */}
              <div className="px-5 py-3 flex items-center gap-4 flex-wrap text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/30">
                <span>{problems.length} problems</span>
                <span>{tree.length} chapters</span>
                {edges.length > 0 && <span>{edges.length} edges</span>}
                {narrative.length > 0 && <span>{narrative.length} story nodes</span>}
                {!wantGraph && edges.length === 0 && problems.length >= 2 && (
                  <button onClick={() => generateGraph()} className="text-violet-500 hover:underline flex items-center gap-1">
                    ✦ Generate graph
                  </button>
                )}
                {edges.length > 0 && narrative.length === 0 && (
                  <button onClick={() => generateNarrative()} className="text-violet-500 hover:underline flex items-center gap-1">
                    <BookOpen size={10} /> Generate narrative
                  </button>
                )}
                {narrative.length > 0 && !narrative.some(n => n.imageUrl) && (
                  <button onClick={() => generateImages()} className="text-violet-500 hover:underline flex items-center gap-1">
                    <Image size={10} /> Generate images
                  </button>
                )}
                <button onClick={() => { localStorage.removeItem(SCAN_CACHE_KEY); setProblems([]); setTree([]); setEdges([]); setNarrative([]); setStage('idle') }} className="text-gray-400 hover:text-red-500 hover:underline ml-auto">
                  Rescan
                </button>
              </div>

              {/* Tree view */}
              {!activeNode && (
                <div className="px-5 py-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Problem Tree</h3>
                  {tree.map(chapter => (
                    <div key={chapter.id} className="mb-2">
                      <button
                        onClick={() => toggleCollapse(chapter.id)}
                        className="flex items-center gap-2 w-full text-left py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-2 -mx-2"
                      >
                        {collapsed.has(chapter.id) ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{chapter.name}</span>
                        <span className="text-[10px] text-gray-400 ml-auto">{chapter.problems.length + chapter.children.reduce((s, c) => s + c.problems.length, 0)}</span>
                      </button>
                      {!collapsed.has(chapter.id) && (
                        <div className="ml-5">
                          {chapter.children.map(section => (
                            <div key={section.id} className="mb-1">
                              <button
                                onClick={() => toggleCollapse(section.id)}
                                className="flex items-center gap-2 w-full text-left py-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-2 -mx-2"
                              >
                                {collapsed.has(section.id) ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{section.name}</span>
                                <span className="text-[10px] text-gray-400 ml-auto">{section.problems.length}</span>
                              </button>
                              {!collapsed.has(section.id) && (
                                <div className="ml-5 flex flex-wrap gap-1 py-1">
                                  {section.problems.map(p => (
                                    <ProblemChip key={p.id} problem={p} edges={edges} onNavigate={onNavigate} onClickNarrative={narrative.length > 0 ? () => setActiveNarrativeId(p.id) : undefined} />
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                          {chapter.problems.length > 0 && (
                            <div className="flex flex-wrap gap-1 py-1">
                              {chapter.problems.map(p => (
                                <ProblemChip key={p.id} problem={p} edges={edges} onNavigate={onNavigate} onClickNarrative={narrative.length > 0 ? () => setActiveNarrativeId(p.id) : undefined} />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Graph edges */}
              {!activeNode && edges.length > 0 && (
                <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Semantic Graph ({edges.length} edges)</h3>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {edges.map((e, i) => {
                      const from = problems.find(p => p.id === e.from)
                      const to = problems.find(p => p.id === e.to)
                      if (!from || !to) return null
                      const typeColor: Record<string, string> = {
                        prerequisite: 'text-red-500', builds_on: 'text-blue-500',
                        same_technique: 'text-teal-500', alternative: 'text-amber-500',
                        harder_version: 'text-purple-500',
                      }
                      return (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                          <span className="font-medium truncate max-w-[120px]">{from.title}</span>
                          <span className={`text-[10px] ${typeColor[e.type] ?? 'text-gray-400'}`}>→ {e.type.replace('_', ' ')}</span>
                          <span className="font-medium truncate max-w-[120px]">{to.title}</span>
                          <span className="text-[10px] text-gray-400 hidden sm:inline">— {e.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Narrative CYOA view */}
              {activeNode && activeProblem && (
                <div className="px-5 py-4">
                  <button
                    onClick={() => setActiveNarrativeId(null)}
                    className="text-xs text-violet-500 hover:underline mb-3 flex items-center gap-1"
                  >
                    ← Back to tree
                  </button>

                  {/* Image */}
                  {activeNode.imageUrl && (
                    <div className="mb-4 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                      <img src={activeNode.imageUrl} alt="" className="w-full h-48 object-cover" />
                    </div>
                  )}

                  {/* Story text */}
                  <div className="prose prose-sm dark:prose-invert max-w-none mb-4">
                    <p className="text-gray-700 dark:text-gray-200 leading-relaxed italic">{activeNode.narrative}</p>
                  </div>

                  {/* The actual math problem */}
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4">
                    <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-2">{activeProblem.title} — p.{activeProblem.pageNum}</p>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <MathContent>{activeProblem.text}</MathContent>
                    </div>
                  </div>

                  {/* Choices */}
                  {activeNode.choices.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">What do you do?</p>
                      {activeNode.choices.map((choice, i) => {
                        const edge = edges.find(e => e.from === activeNode.id && e.to === choice.targetId)
                        return (
                          <button
                            key={i}
                            onClick={() => setActiveNarrativeId(choice.targetId)}
                            className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-violet-400 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 transition-colors group"
                          >
                            <span className="text-sm text-gray-700 dark:text-gray-200 group-hover:text-violet-700 dark:group-hover:text-violet-300">{choice.text}</span>
                            {edge && (
                              <span className="block text-[10px] text-gray-400 mt-0.5">{edge.type.replace('_', ' ')} — {edge.label}</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {activeNode.choices.length === 0 && (
                    <div className="text-center py-4 text-sm text-gray-400 italic">
                      The End. You solved it all.
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Problem chip subcomponent ──

function ProblemChip({ problem, edges, onNavigate, onClickNarrative }: {
  problem: Problem
  edges: ProblemEdge[]
  onNavigate?: (page: number) => void
  onClickNarrative?: () => void
}) {
  const outCount = edges.filter(e => e.from === problem.id).length
  const inCount = edges.filter(e => e.to === problem.id).length
  return (
    <button
      onClick={() => onClickNarrative ? onClickNarrative() : onNavigate?.(problem.pageNum)}
      className="px-2.5 py-1 text-xs rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-400 transition-colors flex items-center gap-1.5"
      title={`${problem.title} — p.${problem.pageNum}${outCount ? ` → ${outCount}` : ''}${inCount ? ` ← ${inCount}` : ''}`}
    >
      {problem.title.length > 25 ? problem.title.slice(0, 25) + '…' : problem.title}
      {(outCount > 0 || inCount > 0) && (
        <span className="text-[9px] text-violet-400">{outCount > 0 ? `→${outCount}` : ''}{inCount > 0 ? `←${inCount}` : ''}</span>
      )}
    </button>
  )
}
