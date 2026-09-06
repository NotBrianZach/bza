'use client'

import { useState, useEffect } from 'react'
import { KnowledgeNode, KnowledgeEdge, Book } from '@/types'
import { knowledgeGraphQueries, quizQueries, QuizQuestion } from '@/lib/queries'
import { Network, CheckCircle2, RefreshCw, Brain, AlertCircle, ChevronLeft, RotateCcw } from 'lucide-react'

interface Props {
  book: Book
  autoRebuild?: boolean
}

type ViewMode = 'loading' | 'empty' | 'building' | 'view' | 'node_quiz' | 'error'

// Node display state based on mastery + prereqs
type NodeState = 'locked' | 'available' | 'in_progress' | 'mastered' | 'due'

const STATE_COLORS: Record<NodeState, string> = {
  locked:      '#9ca3af',
  available:   '#3b82f6',
  in_progress: '#f59e0b',
  mastered:    '#10b981',
  due:         '#f97316',
}

const STATE_LABEL: Record<NodeState, string> = {
  locked:      'Locked',
  available:   'Available',
  in_progress: 'In Progress',
  mastered:    'Mastered',
  due:         'Due for Review',
}

function getNodeState(node: KnowledgeNode, edges: KnowledgeEdge[], allNodes: KnowledgeNode[]): NodeState {
  if (node.mastered) {
    return new Date(node.next_review_at) <= new Date() ? 'due' : 'mastered'
  }
  const prereqIds = edges.filter(e => e.to_node === node.id).map(e => e.from_node)
  if (prereqIds.length > 0) {
    const nodeMap = new Map(allNodes.map(n => [n.id, n]))
    const allMastered = prereqIds.every(pid => nodeMap.get(pid)?.mastered)
    if (!allMastered) return 'locked'
  }
  return node.mastery_score > 0 ? 'in_progress' : 'available'
}

// Topological layout: prerequisites flow top-to-bottom
function computeLayout(nodes: KnowledgeNode[], edges: KnowledgeEdge[]) {
  const layerMap = new Map<number, number>()
  nodes.forEach(n => layerMap.set(n.id, 0))

  // Propagate layers: to_node.layer = max(from_node.layer + 1)
  for (let iter = 0; iter < nodes.length; iter++) {
    let changed = false
    for (const e of edges) {
      const fl = layerMap.get(e.from_node) ?? 0
      const tl = layerMap.get(e.to_node) ?? 0
      if (fl + 1 > tl) { layerMap.set(e.to_node, fl + 1); changed = true }
    }
    if (!changed) break
  }

  // Group nodes by layer
  const layers = new Map<number, number[]>()
  for (const [nid, layer] of layerMap) {
    if (!layers.has(layer)) layers.set(layer, [])
    layers.get(layer)!.push(nid)
  }

  const maxLayer = Math.max(0, ...layerMap.values())
  const maxNodesInLayer = Math.max(...Array.from(layers.values()).map(l => l.length))

  const H_GAP = 100
  const V_GAP = 88
  const PAD_X = 44
  const PAD_Y = 40
  const NODE_R = 22

  const svgW = Math.max(280, maxNodesInLayer * H_GAP + PAD_X * 2)
  const svgH = (maxLayer + 1) * V_GAP + PAD_Y * 2

  const positions = new Map<number, { x: number; y: number }>()
  for (const [layer, nids] of layers) {
    const totalW = (nids.length - 1) * H_GAP
    const startX = svgW / 2 - totalW / 2
    nids.forEach((nid, i) => {
      positions.set(nid, { x: startX + i * H_GAP, y: PAD_Y + NODE_R + layer * V_GAP })
    })
  }

  return { positions, svgW, svgH, NODE_R }
}

// ─────────────────────────────────────────────────────────────────────────────

export default function KnowledgeGraph({ book, autoRebuild = false }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('loading')
  const [nodes, setNodes] = useState<KnowledgeNode[]>([])
  const [edges, setEdges] = useState<KnowledgeEdge[]>([])
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { loadGraph() }, [book.id])

  const loadGraph = async () => {
    setViewMode('loading')
    try {
      const result = await knowledgeGraphQueries.get(book.id)
      if (result.nodes.length === 0) {
        if (autoRebuild) {
          buildGraph()
        } else {
          setViewMode('empty')
        }
      } else {
        setNodes(result.nodes)
        setEdges(result.edges)
        setViewMode('view')
      }
    } catch {
      setViewMode('error')
    }
  }

  const buildGraph = async () => {
    setViewMode('building')
    setError(null)
    try {
      const result = await knowledgeGraphQueries.build(book.id)
      setNodes(result.nodes)
      setEdges(result.edges)
      setViewMode('view')
    } catch (err: any) {
      setError(err.message || 'Failed to build knowledge graph')
      setViewMode('empty')
    }
  }

  const handleNodeClick = (node: KnowledgeNode) => {
    const state = getNodeState(node, edges, nodes)
    if (state === 'locked') return
    setSelectedNode(node)
    setViewMode('node_quiz')
  }

  const handleQuizComplete = async (nodeId: number, correctCount: number, totalCount: number) => {
    try {
      const node = nodes.find(n => n.id === nodeId)
      if (node) await knowledgeGraphQueries.updateMastery(nodeId, node, correctCount, totalCount)
      const result = await knowledgeGraphQueries.get(book.id)
      setNodes(result.nodes)
      setEdges(result.edges)
    } catch {}
    setSelectedNode(null)
    setViewMode('view')
  }

  const masteredCount = nodes.filter(n => n.mastered).length
  const dueCount = nodes.filter(n => n.mastered && new Date(n.next_review_at) <= new Date()).length

  const hoveredNode = hoveredNodeId != null ? nodes.find(n => n.id === hoveredNodeId) ?? null : null

  // ── Loading ──
  if (viewMode === 'loading') {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="spinner" />
      </div>
    )
  }

  // ── Building ──
  if (viewMode === 'building') {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-6">
        <div className="spinner" />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Analyzing your text…</p>
        <p className="text-xs text-gray-400">Extracting concepts and building dependency graph</p>
      </div>
    )
  }

  // ── Empty / first-time ──
  if (viewMode === 'empty') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-4 py-10">
        <Network size={40} className="text-gray-300" />
        <div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Knowledge Graph</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Extract key concepts and their relationships from this text. Work through nodes to build mastery.
          </p>
        </div>
        {error && (
          <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
            <AlertCircle size={14} className="flex-shrink-0" />
            {error}
          </div>
        )}
        <button onClick={buildGraph} className="btn btn-primary text-sm">
          <Brain size={15} className="mr-1.5" />
          Build Knowledge Graph
        </button>
        <p className="text-xs text-gray-400">Uses ~2,000 tokens from your AI quota</p>
      </div>
    )
  }

  // ── Error ──
  if (viewMode === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3 text-center px-6">
        <AlertCircle size={28} className="text-red-400" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Failed to load knowledge graph</p>
        <button onClick={loadGraph} className="btn btn-secondary text-xs">Retry</button>
      </div>
    )
  }

  // ── Node quiz ──
  if (viewMode === 'node_quiz' && selectedNode) {
    return (
      <NodeQuizView
        book={book}
        node={selectedNode}
        onComplete={handleQuizComplete}
        onBack={() => { setSelectedNode(null); setViewMode('view') }}
      />
    )
  }

  // ── Graph view ──
  const { positions, svgW, svgH, NODE_R } = computeLayout(nodes, edges)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {masteredCount}/{nodes.length} mastered
          </span>
          {dueCount > 0 && (
            <span className="text-xs font-semibold text-orange-600 bg-orange-50 rounded-full px-2 py-0.5">
              {dueCount} due
            </span>
          )}
        </div>
        <button
          onClick={buildGraph}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Rebuild graph"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* SVG graph — scrollable */}
      <div className="flex-1 overflow-auto">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          width={svgW}
          height={svgH}
          className="block mx-auto"
          style={{ minWidth: '100%' }}
        >
          <defs>
            <marker id="kg-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
              <path d="M0,0 L0,7 L7,3.5 z" fill="#cbd5e1" />
            </marker>
          </defs>

          {/* Edges */}
          {edges.map(e => {
            const from = positions.get(e.from_node)
            const to = positions.get(e.to_node)
            if (!from || !to) return null
            const dx = to.x - from.x
            const dy = to.y - from.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist === 0) return null
            const x2 = to.x - (dx / dist) * (NODE_R + 6)
            const y2 = to.y - (dy / dist) * (NODE_R + 6)
            return (
              <line
                key={e.id}
                x1={from.x} y1={from.y}
                x2={x2} y2={y2}
                stroke="#cbd5e1"
                strokeWidth={1.5}
                markerEnd="url(#kg-arrow)"
              />
            )
          })}

          {/* Nodes */}
          {nodes.map(node => {
            const pos = positions.get(node.id)
            if (!pos) return null
            const state = getNodeState(node, edges, nodes)
            const color = STATE_COLORS[state]
            const isLocked = state === 'locked'
            const isHovered = hoveredNodeId === node.id
            const label = node.label.length > 14 ? node.label.slice(0, 13) + '…' : node.label

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x},${pos.y})`}
                onClick={() => handleNodeClick(node)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}
              >
                {/* Glow ring on hover */}
                {isHovered && !isLocked && (
                  <circle r={NODE_R + 5} fill={color} opacity={0.15} />
                )}

                {/* Main circle */}
                <circle
                  r={NODE_R}
                  fill={color}
                  opacity={isLocked ? 0.45 : 1}
                />

                {/* Mastery progress arc if in_progress */}
                {state === 'in_progress' && node.mastery_score > 0 && (
                  <circle
                    r={NODE_R - 4}
                    fill="none"
                    stroke="white"
                    strokeWidth={3}
                    strokeDasharray={`${node.mastery_score * 2 * Math.PI * (NODE_R - 4)} ${2 * Math.PI * (NODE_R - 4)}`}
                    strokeDashoffset={0}
                    strokeLinecap="round"
                    transform={`rotate(-90)`}
                    opacity={0.6}
                  />
                )}

                {/* Icon */}
                {isLocked ? (
                  <text textAnchor="middle" dominantBaseline="central" fontSize={12} fill="white" opacity={0.8}>
                    🔒
                  </text>
                ) : state === 'mastered' ? (
                  <text textAnchor="middle" dominantBaseline="central" fontSize={13} fill="white">
                    ✓
                  </text>
                ) : state === 'due' ? (
                  <text textAnchor="middle" dominantBaseline="central" fontSize={11} fill="white">
                    ↺
                  </text>
                ) : null}

                {/* Label below */}
                <text
                  y={NODE_R + 13}
                  textAnchor="middle"
                  fontSize={9.5}
                  fill="currentColor"
                  className="fill-gray-700 dark:fill-gray-300"
                >
                  {label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-700 px-3 py-2">
        {/* Hovered node details */}
        {hoveredNode ? (
          <div className="mb-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{hoveredNode.label}</p>
            {hoveredNode.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{hoveredNode.description}</p>
            )}
            <p className="text-xs mt-1" style={{ color: STATE_COLORS[getNodeState(hoveredNode, edges, nodes)] }}>
              {STATE_LABEL[getNodeState(hoveredNode, edges, nodes)]}
              {hoveredNode.mastery_score > 0 && ` · ${Math.round(hoveredNode.mastery_score * 100)}%`}
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-x-3 gap-y-1 mb-1">
            {(Object.entries(STATE_COLORS) as [NodeState, string][]).map(([state, color]) => (
              <div key={state} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-xs text-gray-500 dark:text-gray-400">{STATE_LABEL[state]}</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-400">Click a node to take a quiz</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Node Quiz View
// ─────────────────────────────────────────────────────────────────────────────

type QuizState = 'loading' | 'question' | 'answered' | 'complete' | 'error'

function NodeQuizView({
  book,
  node,
  onComplete,
  onBack,
}: {
  book: Book
  node: KnowledgeNode
  onComplete: (nodeId: number, correct: number, total: number) => void
  onBack: () => void
}) {
  const [quizState, setQuizState] = useState<QuizState>('loading')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadQuestions()
  }, [node.id])

  const loadQuestions = async () => {
    setQuizState('loading')
    setError(null)
    try {
      const qs = await quizQueries.generate(book.id, 1, { type: 'node' as any, value: node.label })
      if (qs.length === 0) throw new Error('No questions generated')
      setQuestions(qs)
      setCurrentIdx(0)
      setSelected(null)
      setCorrectCount(0)
      setQuizState('question')
    } catch (err: any) {
      setError(err.message || 'Failed to load quiz')
      setQuizState('error')
    }
  }

  const handleAnswer = (idx: number) => {
    if (quizState !== 'question') return
    setSelected(idx)
    if (idx === questions[currentIdx].correct) {
      setCorrectCount(c => c + 1)
    }
    setQuizState('answered')
  }

  const handleNext = () => {
    const nextIdx = currentIdx + 1
    if (nextIdx >= questions.length) {
      setQuizState('complete')
    } else {
      setCurrentIdx(nextIdx)
      setSelected(null)
      setQuizState('question')
    }
  }

  const q = questions[currentIdx]
  if (quizState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <div className="spinner" />
        <p className="text-sm text-gray-500">Generating quiz for <strong>{node.label}</strong>…</p>
      </div>
    )
  }

  if (quizState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3 px-6 text-center">
        <AlertCircle size={28} className="text-red-400" />
        <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
        <div className="flex gap-2">
          <button onClick={loadQuestions} className="btn btn-secondary text-xs">Retry</button>
          <button onClick={onBack} className="btn btn-secondary text-xs">Back</button>
        </div>
      </div>
    )
  }

  if (quizState === 'complete') {
    const score = correctCount / questions.length
    const pct = Math.round(score * 100)
    const passed = score >= 0.6
    return (
      <div className="flex flex-col h-full">
        {/* Back */}
        <button onClick={onBack} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 p-3 pb-0">
          <ChevronLeft size={14} /> Back to graph
        </button>

        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4 text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
            style={{ backgroundColor: passed ? '#10b981' : '#f59e0b' }}
          >
            {pct}%
          </div>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
              {correctCount}/{questions.length} correct
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {passed
                ? node.mastered
                  ? 'Mastery maintained! Next review scheduled.'
                  : 'Concept mastered!'
                : 'Keep studying — you need 60% to master this node.'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onComplete(node.id, correctCount, questions.length)}
              className="btn btn-primary text-sm"
            >
              <CheckCircle2 size={15} className="mr-1.5" />
              Save & continue
            </button>
            <button onClick={loadQuestions} className="btn btn-secondary text-sm">
              <RotateCcw size={14} className="mr-1.5" />
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  // question / answered states
  if (!q) return null
  const optionColors = ['bg-blue-50 border-blue-200', 'bg-purple-50 border-purple-200', 'bg-green-50 border-green-200', 'bg-orange-50 border-orange-200']
  const optionColorsDark = ['dark:bg-blue-900/20 dark:border-blue-700', 'dark:bg-purple-900/20 dark:border-purple-700', 'dark:bg-green-900/20 dark:border-green-700', 'dark:bg-orange-900/20 dark:border-orange-700']

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{node.label}</p>
          <p className="text-xs text-gray-400">Question {currentIdx + 1} of {questions.length}</p>
        </div>
        {/* Progress dots */}
        <div className="flex gap-1 flex-shrink-0">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i < currentIdx ? 'bg-green-500' : i === currentIdx ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug">{q.question}</p>

        <div className="space-y-2">
          {q.options.map((opt, i) => {
            let cls = `w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${optionColors[i]} ${optionColorsDark[i]}`
            if (quizState === 'answered') {
              if (i === q.correct) cls += ' ring-2 ring-green-500 font-medium'
              else if (i === selected && i !== q.correct) cls += ' ring-2 ring-red-400 opacity-60'
              else cls += ' opacity-50'
            } else {
              cls += ' hover:opacity-80 cursor-pointer'
            }
            return (
              <button key={i} onClick={() => handleAnswer(i)} disabled={quizState === 'answered'} className={cls}>
                <span className="font-semibold mr-2">{String.fromCharCode(65 + i)}.</span>
                {opt}
              </button>
            )
          })}
        </div>

        {/* Explanation */}
        {quizState === 'answered' && q.explanation && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg px-3 py-2 text-xs text-blue-800 dark:text-blue-300 leading-snug">
            <span className="font-semibold">Explanation: </span>{q.explanation}
          </div>
        )}
      </div>

      {/* Next button */}
      {quizState === 'answered' && (
        <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-700 p-3">
          <button onClick={handleNext} className="btn btn-primary w-full text-sm">
            {currentIdx + 1 >= questions.length ? 'See Results' : 'Next Question'}
          </button>
        </div>
      )}
    </div>
  )
}
