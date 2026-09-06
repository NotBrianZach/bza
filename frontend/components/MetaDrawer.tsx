'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Book } from '@/types'
import { supabase } from '@/lib/supabase'
import {
  X, Search, BookOpen, Network, GraduationCap, BarChart2,
  Loader2, ChevronRight, Hash, Clock, Layers, MessageSquare, Send,
  LayersIcon, Download, ChevronDown, RotateCcw, Maximize2, Minimize2, ClipboardList
} from 'lucide-react'
import Link from 'next/link'
import PersonaAvatar from './PersonaAvatar'
// WikiUpdate import removed — Updates section deleted
import type { Flashcard } from '@/lib/queries/flashcards'
import { authedFetch } from '@/lib/authedFetch'

interface MetaDrawerProps {
  books: Book[]
  isOpen: boolean
  onClose: () => void
  dueCardCount: number
}

type Tab = 'knowledge' | 'quiz' | 'insights' | 'chat' | 'problems' | 'history'

interface ChatMessage { role: 'user' | 'assistant'; content: string }

interface Concept {
  id: number
  book_id: number
  term: string
  concept_type: string
  explanation?: string
  first_page: number
  books?: { id: number; title: string }
}

interface QuizCard {
  id: number
  book_id: number
  question: string
  options: string[]
  correct_index: number
  explanation?: string
  books?: { id: number; title: string }
}

// ─── Chat History ───────────────────────────────────────────────────────────

function ChatHistory({ books }: { books: Book[] }) {
  const [conversations, setConversations] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Record<number, any[]>>({})
  const [loadingMsgs, setLoadingMsgs] = useState<number | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await supabase
          .from('conversations')
          .select('id, book_id, title, created_at, updated_at')
          .order('updated_at', { ascending: false })
          .limit(50)
        setConversations(data ?? [])
      } catch {}
      setLoaded(true)
    })()
  }, [])

  const loadMessages = async (convId: number) => {
    if (expandedId === convId) { setExpandedId(null); return }
    setExpandedId(convId)
    if (messages[convId]) return
    setLoadingMsgs(convId)
    const { data } = await supabase
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(50)
    setMessages(prev => ({ ...prev, [convId]: data ?? [] }))
    setLoadingMsgs(null)
  }

  if (!loaded) return <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 size={20} className="animate-spin mr-2" /> Loading…</div>

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6 text-gray-400">
        <Clock size={36} className="mb-3 text-gray-300" />
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No conversations yet</p>
        <p className="text-xs mt-1">Chat with your books using the sidebar — conversations are saved here.</p>
      </div>
    )
  }

  // Group by book
  const byBook: Record<number, { bookTitle: string; convs: typeof conversations }> = {}
  for (const conv of conversations) {
    const book = books.find(b => b.id === conv.book_id)
    const bid = conv.book_id ?? 0
    if (!byBook[bid]) byBook[bid] = { bookTitle: book?.title ?? conv.title ?? 'Unknown', convs: [] }
    byBook[bid].convs.push(conv)
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {Object.entries(byBook).map(([bookIdStr, group]) => {
        const bookId = Number(bookIdStr)
        return (
          <div key={bookId} className="border-b border-gray-100 dark:border-gray-800">
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">{group.bookTitle}</p>
              <span className="text-[10px] text-gray-400">{group.convs.length} chat{group.convs.length !== 1 ? 's' : ''}</span>
            </div>
            {group.convs.map(conv => {
              const isExpanded = expandedId === conv.id
              const msgs = messages[conv.id]
              const preview = msgs?.[msgs.length - 1]?.content?.slice(0, 80) ?? ''
              return (
                <div key={conv.id}>
                  <button
                    onClick={() => loadMessages(conv.id)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/30 flex items-center gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 dark:text-gray-200 truncate">
                        {conv.title || 'Conversation'}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(conv.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        {preview && !isExpanded && ` — ${preview}…`}
                      </p>
                    </div>
                    <ChevronRight size={12} className={`text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-3 space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                      {loadingMsgs === conv.id ? (
                        <div className="flex items-center gap-2 py-4 text-xs text-gray-400"><Loader2 size={12} className="animate-spin" /> Loading…</div>
                      ) : msgs?.length ? (
                        msgs.map((msg: any) => (
                          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'assistant' && <PersonaAvatar state="idle" size="sm" inline />}
                            <div className={`max-w-[85%] rounded-lg px-2.5 py-1.5 text-xs ${
                              msg.role === 'user'
                                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}>
                              {msg.content}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400 italic py-2">No messages</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

// ─── Cross-Book Problems & Quizzes ──────────────────────────────────────────

const SPACES_KEY = (id: string) => `bza-ps-spaces-${id}`
const LABELS_KEY = (bookId: number) => `bza-ps-labels-${bookId}`
const LABELMAP_KEY = (bookId: number) => `bza-ps-labelmap-${bookId}`

interface SavedProblem { id: string; title: string; text: string; pageNum: number; bookId: number; bookTitle: string }
interface SavedLabel { id: string; name: string; parentId: string | null; collapsed: boolean }

function CrossBookProblems({ books }: { books: Book[] }) {
  const [allProblems, setAllProblems] = useState<SavedProblem[]>([])
  const [allLabels, setAllLabels] = useState<{ bookId: number; bookTitle: string; labels: SavedLabel[] }[]>([])
  const [expandedBook, setExpandedBook] = useState<number | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const load = async () => {
      const problems: SavedProblem[] = []
      const labelGroups: typeof allLabels = []

      // Try DB first (authenticated users — correct book→problem mapping)
      let usedDb = false
      try {
        const { data: rows } = await supabase
          .from('problem_sets')
          .select('book_id, data')
        if (rows && rows.length > 0) {
          usedDb = true
          for (const row of rows) {
            const book = books.find(b => b.id === row.book_id)
            if (!book) continue
            const ps = row.data as any
            if (ps?.labels?.length) {
              labelGroups.push({ bookId: book.id, bookTitle: book.title, labels: ps.labels })
            }
            if (ps?.problems?.length) {
              const spaceCounts: Record<string, number> = {}
              if (ps.spaces) {
                for (const [pid, sp] of Object.entries(ps.spaces)) {
                  spaceCounts[pid] = Array.isArray(sp) ? (sp as any[]).length : 0
                }
              }
              for (const p of ps.problems) {
                const sc = spaceCounts[p.id] ?? 0
                if (sc > 0 || ps.labels?.length) {
                  problems.push({
                    id: p.id,
                    title: p.title ?? p.id,
                    text: sc > 0 ? `${sc} solution space${sc > 1 ? 's' : ''}` : 'No work yet',
                    pageNum: p.pageNum ?? 0,
                    bookId: book.id,
                    bookTitle: book.title,
                  })
                }
              }
            }
          }
        }
      } catch {}

      // Fallback: localStorage labels only (no problem scanning — can't determine book ownership)
      if (!usedDb) {
        for (const book of books) {
          try {
            const raw = localStorage.getItem(LABELS_KEY(book.id))
            if (raw) {
              const parsed: SavedLabel[] = JSON.parse(raw)
              if (parsed.length > 0) labelGroups.push({ bookId: book.id, bookTitle: book.title, labels: parsed })
            }
          } catch {}
        }
      }

      setAllProblems(problems)
      setAllLabels(labelGroups)
      setLoaded(true)
    }
    load()
  }, [books])

  if (!loaded) return <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 size={20} className="animate-spin mr-2" /> Loading…</div>

  const booksWithWork = [...new Set(allProblems.map(p => p.bookId))]
  const booksWithLabels = allLabels.map(g => g.bookId)
  const relevantBookIds = [...new Set([...booksWithWork, ...booksWithLabels])]
  const relevantBooks = books.filter(b => relevantBookIds.includes(b.id))

  if (relevantBooks.length === 0 && allProblems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6 text-gray-400">
        <ClipboardList size={36} className="mb-3 text-gray-300" />
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No problem sets yet</p>
        <p className="text-xs mt-1">Open a book and use the Problem Set panel to start working on exercises.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {relevantBooks.map(book => {
        const bookProblems = allProblems.filter(p => p.bookId === book.id)
        const bookLabels = allLabels.find(g => g.bookId === book.id)?.labels ?? []
        const isExpanded = expandedBook === book.id

        return (
          <div key={book.id} className="border-b border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setExpandedBook(isExpanded ? null : book.id)}
              className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-left"
            >
              {isExpanded ? <ChevronDown size={14} className="text-gray-400 flex-shrink-0" /> : <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{book.title}</p>
                <p className="text-xs text-gray-400">
                  {bookProblems.length} problem{bookProblems.length !== 1 ? 's' : ''} worked
                  {bookLabels.length > 0 && ` · ${bookLabels.length} group${bookLabels.length !== 1 ? 's' : ''}`}
                </p>
              </div>
              <Link href={`/books/${book.id}`} onClick={e => e.stopPropagation()} className="text-xs text-indigo-500 hover:underline flex-shrink-0">
                Open
              </Link>
            </button>

            {isExpanded && (
              <div className="px-4 pb-3 space-y-2">
                {bookLabels.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Groups</p>
                    {bookLabels.filter(l => !l.parentId).map(label => (
                      <div key={label.id} className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1.5 pl-2">
                        <ClipboardList size={11} className="text-gray-400 flex-shrink-0" />
                        {label.name}
                        {bookLabels.filter(c => c.parentId === label.id).map(child => (
                          <span key={child.id} className="ml-2 text-gray-400">↳ {child.name}</span>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
                {bookProblems.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Worked problems</p>
                    {bookProblems.map(p => (
                      <div key={p.id} className="text-xs text-gray-600 dark:text-gray-300 flex items-center justify-between pl-2">
                        <span className="truncate">{p.title}</span>
                        <span className="text-gray-400 flex-shrink-0 ml-2">{p.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function MetaDrawer({ books, isOpen, onClose, dueCardCount }: MetaDrawerProps) {
  const [activeTab, setActiveTab] = useState<Tab>('knowledge')
  const [knowledgeSub, setKnowledgeSub] = useState<'concepts' | 'connections'>('concepts')
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [conceptsLoaded, setConceptsLoaded] = useState(false)
  const [conceptsLoading, setConceptsLoading] = useState(false)
  const [mapSearch, setMapSearch] = useState('')
  const [quizCards, setQuizCards] = useState<QuizCard[]>([])
  const [quizLoaded, setQuizLoaded] = useState(false)
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizIdx, setQuizIdx] = useState(0)
  const [quizSelected, setQuizSelected] = useState<number | null>(null)
  const [quizDone, setQuizDone] = useState(false)
  const [flashcards, setFlashcards] = useState<(Flashcard & { book_title?: string })[]>([])
  const [flashcardsLoaded, setFlashcardsLoaded] = useState(false)
  const [flashcardsLoading, setFlashcardsLoading] = useState(false)
  const [showFlashcards, setShowFlashcards] = useState(false)
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set())
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [maximized, setMaximized] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const bookIds = useMemo(() => books.map(b => b.id), [books])

  // Load concepts when Map or Connections tab first activated
  useEffect(() => {
    if (!isOpen || conceptsLoaded || bookIds.length === 0) return
    if (activeTab !== 'knowledge') return
    setConceptsLoading(true)
    supabase
      .from('key_concepts')
      .select('id, book_id, term, concept_type, explanation, first_page, books(id, title)')
      .in('book_id', bookIds)
      .order('term')
      .limit(500)
      .then(({ data }) => {
        setConcepts((data as any) || [])
        setConceptsLoaded(true)
        setConceptsLoading(false)
      })
  }, [isOpen, activeTab, conceptsLoaded, bookIds])

  // Load due quiz cards when Quiz tab activated
  useEffect(() => {
    if (!isOpen || quizLoaded || activeTab !== 'quiz' || bookIds.length === 0) return
    setQuizLoading(true)
    supabase
      .from('quiz_cards')
      .select('id, book_id, question, options, correct_index, explanation, books(id, title)')
      .in('book_id', bookIds)
      .lte('next_review_at', new Date().toISOString())
      .limit(20)
      .then(({ data }) => {
        // Shuffle for cross-source mixing
        const shuffled = ((data as any) || []).sort(() => Math.random() - 0.5)
        setQuizCards(shuffled)
        setQuizLoaded(true)
        setQuizLoading(false)
        setQuizIdx(0)
        setQuizSelected(null)
        setQuizDone(false)
      })
  }, [isOpen, activeTab, quizLoaded, bookIds])

  // Load all flashcards when Quiz tab activated
  useEffect(() => {
    if (!isOpen || flashcardsLoaded || activeTab !== 'quiz' || bookIds.length === 0) return
    setFlashcardsLoading(true)
    supabase
      .from('flashcards')
      .select('*, books(title)')
      .in('book_id', bookIds)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setFlashcards(((data as any) || []).map((c: any) => ({ ...c, book_title: c.books?.title })))
        setFlashcardsLoaded(true)
        setFlashcardsLoading(false)
      })
  }, [isOpen, activeTab, flashcardsLoaded, bookIds])

  const downloadFlashcards = () => {
    if (flashcards.length === 0) return
    const rows = flashcards.map(c => [
      `"${(c.front ?? '').replace(/"/g, '""')}"`,
      `"${(c.back ?? '').replace(/"/g, '""')}"`,
      `"${(c.book_title ?? '').replace(/"/g, '""')}"`,
    ].join(','))
    const csv = 'Front,Back,Source\n' + rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'flashcards.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  // Connections: concepts appearing in 2+ books
  const connections = useMemo(() => {
    const byTerm: Record<string, { term: string; books: { id: number; title: string; page: number }[] }> = {}
    for (const c of concepts) {
      const key = c.term.toLowerCase().trim()
      if (!byTerm[key]) byTerm[key] = { term: c.term, books: [] }
      if (c.books && !byTerm[key].books.some(b => b.id === c.books!.id)) {
        byTerm[key].books.push({ id: c.books.id, title: c.books.title, page: c.first_page })
      }
    }
    return Object.values(byTerm)
      .filter(e => e.books.length >= 2)
      .sort((a, b) => b.books.length - a.books.length)
  }, [concepts])

  // Filtered map concepts
  const filteredConcepts = useMemo(() => {
    const q = mapSearch.toLowerCase().trim()
    return q ? concepts.filter(c => c.term.toLowerCase().includes(q) || c.explanation?.toLowerCase().includes(q)) : concepts
  }, [concepts, mapSearch])

  // Insights
  const insights = useMemo(() => {
    const byType: Record<string, number> = {}
    for (const b of books) {
      const t = b.content_type || 'fiction'
      byType[t] = (byType[t] || 0) + 1
    }
    const totalPages = books.reduce((s, b) => s + (b.total_pages || 0), 0)
    const recentBooks = [...books]
      .filter(b => b.last_read_at)
      .sort((a, b) => new Date(b.last_read_at!).getTime() - new Date(a.last_read_at!).getTime())
      .slice(0, 5)
    const topConceptTypes: Record<string, number> = {}
    for (const c of concepts) {
      topConceptTypes[c.concept_type] = (topConceptTypes[c.concept_type] || 0) + 1
    }
    const topTypes = Object.entries(topConceptTypes).sort((a, b) => b[1] - a[1]).slice(0, 5)
    return { byType, totalPages, recentBooks, topTypes, conceptCount: concepts.length }
  }, [books, concepts])

  const findRelevantConcepts = (query: string) => {
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    if (!words.length) return concepts.slice(0, 20)
    const scored = concepts.map(c => {
      const text = `${c.term} ${c.explanation ?? ''}`.toLowerCase()
      const score = words.filter(w => text.includes(w)).length
      return { c, score }
    }).filter(x => x.score > 0).sort((a, b) => b.score - a.score)
    return (scored.length ? scored : concepts.slice(0, 20).map(c => ({ c, score: 0 })))
      .slice(0, 20).map(x => ({
        term: x.c.term,
        concept_type: x.c.concept_type,
        explanation: x.c.explanation,
        first_page: x.c.first_page,
        bookTitle: (x.c.books as any)?.title ?? '',
      }))
  }

  const sendChat = async () => {
    const text = chatInput.trim()
    if (!text || chatLoading) return
    const nextMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: text }]
    setChatMessages(nextMessages)
    setChatInput('')
    setChatLoading(true)
    // Load concepts if not yet loaded
    if (!conceptsLoaded && bookIds.length > 0) {
      const { data } = await supabase
        .from('key_concepts')
        .select('id, book_id, term, concept_type, explanation, first_page, books(id, title)')
        .in('book_id', bookIds).order('term').limit(500)
      setConcepts((data as any) || [])
      setConceptsLoaded(true)
    }
    const relevantConcepts = findRelevantConcepts(text)
    const bookContext = books.map(b => ({ id: b.id, title: b.title, summary: b.summary, content_type: b.content_type }))
    try {
      const personaPrompt = (() => { try { const r = localStorage.getItem('bza-persona'); if (!r) return undefined; const p = JSON.parse(r); return p.id !== 'none' ? p.prompt : undefined } catch { return undefined } })()
      const res = await authedFetch('/api/library-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, books: bookContext, concepts: relevantConcepts, personaPrompt, ...(() => { try { const c = JSON.parse(localStorage.getItem('bza-model-choices') ?? '{}'); const m = c.libraryChat; if (!m) return {}; return { model: m, provider: m.includes('/') ? 'openrouter' : 'openai' } } catch { return {} } })() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setChatMessages(msgs => [...msgs, { role: 'assistant', content: data.error ?? 'Something went wrong.' }])
        return
      }
      setChatMessages(msgs => [...msgs, { role: 'assistant', content: data.content || 'No response.' }])
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    } catch {
      setChatMessages(msgs => [...msgs, { role: 'assistant', content: 'Network error — please try again.' }])
    } finally {
      setChatLoading(false)
    }
  }

  const TYPE_LABELS: Record<string, string> = {
    fiction: 'Fiction',
    textbook: 'Textbook',
    academic_paper: 'Academic Paper',
    math_textbook: 'Math Textbook',
    wikipedia_article: 'Wikipedia Article',
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />
      <div className={`fixed inset-y-0 right-0 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl z-50 flex flex-col transition-all duration-200 ${
        maximized ? 'w-full lg:w-[calc(100%-64px)]' : 'w-full lg:w-[440px]'
      }`}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <BookOpen size={18} className="text-indigo-500" />
            Librarian
          </h2>
          <div className="flex items-center gap-1">
            <button onClick={() => setMaximized(v => !v)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 hidden lg:block" title={maximized ? 'Minimize' : 'Maximize'}>
              {maximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          {([
            { id: 'chat', label: 'Chat', icon: MessageSquare },
            { id: 'history', label: 'History', icon: Clock },
            { id: 'problems', label: 'Problems', icon: ClipboardList },
            { id: 'knowledge', label: 'Knowledge', icon: Hash },
            { id: 'quiz', label: 'Quiz', icon: GraduationCap },
            { id: 'insights', label: 'Insights', icon: BarChart2 },
          ] as { id: Tab; label: string; icon: any; badge?: number }[]).map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium border-b-2 transition-colors relative ${
                activeTab === id
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <span className="relative">
                <Icon size={15} />
                {badge ? (
                  <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">{badge}</span>
                ) : null}
              </span>
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Library Chat ── */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-full">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
                {chatMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-6 text-gray-400">
                    <div className="mb-3"><PersonaAvatar state="idle" size="lg" /></div>
                    <MessageSquare size={36} className="mb-3 text-gray-300" />
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Chat with your library</p>
                    <p className="text-xs mt-1">Ask anything about your books — connections between them, things you've read, or ideas to explore.</p>
                    <div className="mt-4 space-y-2 w-full max-w-xs">
                      {[
                        'What themes connect my books?',
                        'What have I read about machine learning?',
                        'How do my books relate to each other?',
                      ].map(s => (
                        <button
                          key={s}
                          onClick={() => { setChatInput(s) }}
                          className="w-full text-left text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-600 dark:text-gray-300 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <PersonaAvatar state={chatLoading && i === chatMessages.length - 1 && !msg.content ? 'thinking' : 'idle'} size="sm" inline />
                    )}
                    <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm'
                    }`}>
                      {msg.content || (chatLoading && i === chatMessages.length - 1 ? (
                        <span className="flex items-center gap-1 text-gray-400"><Loader2 size={12} className="animate-spin" /> Thinking…</span>
                      ) : '')}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              {/* Input */}
              <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-2 flex gap-2 bg-white dark:bg-gray-900">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() } }}
                  placeholder="Ask about your library…"
                  disabled={chatLoading}
                  className="flex-1 min-w-0 input text-sm py-2 disabled:opacity-60"
                />
                <button
                  onClick={sendChat}
                  disabled={!chatInput.trim() || chatLoading}
                  className="flex-shrink-0 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ── Cross-Book Problems ── */}
          {/* ── Chat History ── */}
          {activeTab === 'history' && (
            <ChatHistory books={books} />
          )}

          {activeTab === 'problems' && (
            <CrossBookProblems books={books} />
          )}

          {/* ── Knowledge Map ── */}
          {activeTab === 'knowledge' && (
            <div className="flex flex-col h-full">
              {/* Sub-toggle: Concepts / Connections */}
              <div className="flex border-b border-gray-200 dark:border-gray-700 px-3 pt-2 gap-1 bg-white dark:bg-gray-900 sticky top-0 z-10">
                {(['concepts', 'connections'] as const).map(sub => (
                  <button
                    key={sub}
                    onClick={() => setKnowledgeSub(sub)}
                    className={`flex-1 text-xs font-medium py-1.5 rounded-t-lg transition-colors ${
                      knowledgeSub === sub
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    {sub === 'concepts' ? `Concepts${conceptsLoaded ? ` (${filteredConcepts.length})` : ''}` : `Connections${connections.length ? ` (${connections.length})` : ''}`}
                  </button>
                ))}
              </div>

              {knowledgeSub === 'concepts' && (
                <>
                  <div className="px-3 pt-2 pb-1 bg-white dark:bg-gray-900">
                    <div className="relative">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input type="text" value={mapSearch} onChange={e => setMapSearch(e.target.value)} placeholder="Search concepts…" className="input w-full pl-8 text-sm py-1.5" />
                    </div>
                  </div>
                  {conceptsLoading ? (
                    <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 size={20} className="animate-spin mr-2" /> Loading…</div>
                  ) : filteredConcepts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-6 text-gray-400">
                      <BookOpen size={36} className="mb-3 text-gray-300" />
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No concepts yet</p>
                      <p className="text-xs mt-1">Run Structure analysis on a textbook or academic paper to populate your knowledge map.</p>
                    </div>
                  ) : (
                    <div className="px-3 pb-4 space-y-1 overflow-y-auto">
                      {filteredConcepts.map(c => (
                        <Link key={c.id} href={`/books/${c.book_id}?page=${c.first_page}`} onClick={onClose}
                          className="flex items-start gap-2.5 px-2.5 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                          <span className="mt-0.5 text-xs px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 shrink-0 font-medium">{c.concept_type}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{c.term}</p>
                            {c.explanation && <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">{c.explanation}</p>}
                            <p className="text-xs text-gray-400 mt-0.5">{(c.books as any)?.title} · p.{c.first_page}</p>
                          </div>
                          <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 shrink-0 mt-1" />
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}

              {knowledgeSub === 'connections' && (
                <div className="px-3 py-3 space-y-3 overflow-y-auto">
                  {conceptsLoading ? (
                    <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 size={20} className="animate-spin mr-2" /> Loading…</div>
                  ) : connections.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-6 text-gray-400">
                      <Network size={36} className="mb-3 text-gray-300" />
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No cross-source connections yet</p>
                      <p className="text-xs mt-1">Connections appear when the same concept surfaces in two or more of your texts.</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-gray-400 px-0.5">{connections.length} shared across multiple texts</p>
                      {connections.map((conn, i) => (
                        <div key={i} className="border border-gray-100 dark:border-gray-700 rounded-xl p-3">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">{conn.term}</p>
                          <div className="space-y-1">
                            {conn.books.map(b => (
                              <Link key={b.id} href={`/books/${b.id}?page=${b.page}`} onClick={onClose}
                                className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                                <BookOpen size={11} className="shrink-0" /><span className="truncate">{b.title}</span><span className="text-gray-400 shrink-0">p.{b.page}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Cross-Quiz ── */}
          {activeTab === 'quiz' && (
            <div className="px-4 py-4 flex flex-col gap-4">
              {/* Summary row */}
              <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-100 dark:border-purple-800">
                <div>
                  <p className="text-sm font-semibold text-purple-900 dark:text-purple-200">
                    {dueCardCount} card{dueCardCount !== 1 ? 's' : ''} due across all texts
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">Full SRS session at /quiz</p>
                </div>
                <Link href="/quiz" onClick={onClose} className="btn btn-sm btn-primary bg-purple-600 hover:bg-purple-700 border-purple-600">
                  Study all
                </Link>
              </div>

              {/* Inline quick-quiz */}
              {quizLoading ? (
                <div className="flex items-center justify-center py-12 text-gray-400">
                  <Loader2 size={20} className="animate-spin mr-2" /> Loading cards…
                </div>
              ) : quizCards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center px-4 text-gray-400">
                  <GraduationCap size={36} className="mb-3 text-gray-300" />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No cards due right now</p>
                  <p className="text-xs mt-1">Check back later or generate more quiz cards from individual books.</p>
                </div>
              ) : quizDone ? (
                <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                  <GraduationCap size={36} className="mb-3 text-purple-400" />
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Session complete!</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">You reviewed {quizCards.length} cards from across your library.</p>
                  <button
                    onClick={() => { setQuizIdx(0); setQuizSelected(null); setQuizDone(false) }}
                    className="btn btn-sm btn-secondary mt-4"
                  >
                    Restart
                  </button>
                </div>
              ) : (() => {
                const card = quizCards[quizIdx]
                return (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-800 px-3 py-1.5 flex items-center justify-between">
                      <span className="text-xs text-gray-400">{quizIdx + 1} / {quizCards.length}</span>
                      <span className="text-xs text-gray-500 truncate max-w-[200px]">{(card.books as any)?.title}</span>
                    </div>
                    <div className="px-4 py-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-relaxed mb-4">{card.question}</p>
                      <div className="space-y-2">
                        {card.options.map((opt, i) => {
                          const isSelected = quizSelected === i
                          const isCorrect = i === card.correct_index
                          const revealed = quizSelected !== null
                          return (
                            <button
                              key={i}
                              disabled={revealed}
                              onClick={() => setQuizSelected(i)}
                              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm border transition-colors ${
                                revealed
                                  ? isCorrect
                                    ? 'bg-green-50 dark:bg-green-900/30 border-green-400 text-green-800 dark:text-green-200'
                                    : isSelected
                                      ? 'bg-red-50 dark:bg-red-900/30 border-red-400 text-red-800 dark:text-red-200'
                                      : 'border-gray-200 dark:border-gray-700 text-gray-400'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-800 dark:text-gray-200'
                              }`}
                            >
                              {opt}
                            </button>
                          )
                        })}
                      </div>
                      {quizSelected !== null && (
                        <>
                          {card.explanation && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 italic leading-relaxed">{card.explanation}</p>
                          )}
                          <div className="flex justify-end mt-3">
                            <button
                              onClick={() => {
                                if (quizIdx + 1 >= quizCards.length) {
                                  setQuizDone(true)
                                } else {
                                  setQuizIdx(i => i + 1)
                                  setQuizSelected(null)
                                }
                              }}
                              className="btn btn-sm btn-primary"
                            >
                              {quizIdx + 1 >= quizCards.length ? 'Finish' : 'Next →'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )
              })()}

              {/* ── Flashcards section ── */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowFlashcards(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                    <LayersIcon size={15} className="text-purple-500" />
                    Flashcards
                    {flashcardsLoaded && (
                      <span className="text-xs text-gray-400 font-normal">· {flashcards.length}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {flashcards.length > 0 && (
                      <button
                        onClick={e => { e.stopPropagation(); downloadFlashcards() }}
                        title="Download as CSV (Anki-compatible)"
                        className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                      >
                        <Download size={14} />
                      </button>
                    )}
                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${showFlashcards ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {showFlashcards && (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {flashcardsLoading ? (
                      <div className="flex items-center justify-center py-8 text-gray-400">
                        <Loader2 size={16} className="animate-spin mr-2" />Loading…
                      </div>
                    ) : flashcards.length === 0 ? (
                      <div className="py-8 text-center text-sm text-gray-400 px-4">
                        No flashcards yet. Highlight text while reading to create them.
                      </div>
                    ) : (
                      flashcards.map(card => {
                        const flipped = flippedCards.has(card.id)
                        return (
                          <div key={card.id} className="px-4 py-3">
                            {card.book_title && (
                              <p className="text-[10px] text-gray-400 mb-1 truncate">{card.book_title}{card.page_num ? ` · p.${card.page_num}` : ''}</p>
                            )}
                            <button
                              onClick={() => setFlippedCards(s => { const n = new Set(s); n.has(card.id) ? n.delete(card.id) : n.add(card.id); return n })}
                              className="w-full text-left"
                            >
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{card.front}</p>
                              {flipped && (
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1.5 pt-1.5 border-t border-dashed border-gray-200 dark:border-gray-600">{card.back}</p>
                              )}
                              {!flipped && (
                                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><RotateCcw size={10} />tap to reveal</p>
                              )}
                            </button>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Insights ── */}
          {activeTab === 'insights' && (
            <div className="px-4 py-4 space-y-5">
              {/* Summary stats */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Texts', value: books.length, icon: BookOpen, color: 'blue' },
                  { label: 'Total pages', value: insights.totalPages.toLocaleString(), icon: Hash, color: 'indigo' },
                  { label: 'Due cards', value: dueCardCount, icon: GraduationCap, color: 'purple' },
                  { label: 'Concepts mapped', value: insights.conceptCount, icon: Network, color: 'teal' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className={`p-3 rounded-xl bg-${color}-50 dark:bg-${color}-950/30 border border-${color}-100 dark:border-${color}-800`}>
                    <Icon size={16} className={`text-${color}-500 mb-1`} />
                    <p className={`text-xl font-bold text-${color}-700 dark:text-${color}-300`}>{value}</p>
                    <p className={`text-xs text-${color}-600 dark:text-${color}-400`}>{label}</p>
                  </div>
                ))}
              </div>

              {/* By content type */}
              {Object.keys(insights.byType).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">By Type</p>
                  <div className="space-y-1.5">
                    {Object.entries(insights.byType)
                      .sort((a, b) => b[1] - a[1])
                      .map(([type, count]) => (
                        <div key={type} className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-1.5 rounded-full bg-indigo-500"
                              style={{ width: `${Math.round((count / books.length) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400 w-32 shrink-0">{TYPE_LABELS[type] ?? type} ({count})</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Top concept types */}
              {insights.topTypes.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Top Concept Types</p>
                  <div className="flex flex-wrap gap-2">
                    {insights.topTypes.map(([type, count]) => (
                      <span key={type} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium">
                        {type} <span className="text-gray-400">×{count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Reading progress stats */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Reading Progress</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {(() => {
                    const totalPages = books.reduce((s: number, b: any) => s + (b.total_pages ?? 0), 0)
                    return [
                      { label: 'Books', value: books.length },
                      { label: 'Total pages', value: totalPages.toLocaleString() },
                      { label: 'Due cards', value: dueCardCount },
                    ].map(({ label, value }) => (
                      <div key={label} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{value}</p>
                        <p className="text-[10px] text-gray-400">{label}</p>
                      </div>
                    ))
                  })()}
                </div>
              </div>

              {/* Recently read */}
              {insights.recentBooks.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Clock size={12} /> Recently read
                  </p>
                  <div className="space-y-1.5">
                    {insights.recentBooks.map(b => (
                      <Link
                        key={b.id}
                        href={`/books/${b.id}`}
                        onClick={onClose}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <BookOpen size={13} className="text-gray-400 shrink-0" />
                        <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{b.title}</span>
                        <span className="text-xs text-gray-400 shrink-0">
                          {b.last_read_at ? new Date(b.last_read_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
