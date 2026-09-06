'use client'

import { useState, useEffect, useRef } from 'react'
import { Book } from '@/types'
import { MessageCircle, Bookmark, Users, Image, X, Send, AlertCircle, BookOpen, GraduationCap } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ensureSession } from '@/lib/anonAuth'
import { getPersonaPrompt, getPersonaInfo, personaSpeak, isAutoReadEnabled, setAutoRead, getModelChoice } from '@/lib/persona'
import PersonaAvatar from './PersonaAvatar'
import type { AvatarState } from './PersonaAvatar'
import { chatQueries, UserPrefs } from '@/lib/queries'
import type { Flashcard } from '@/lib/queries/flashcards'
import type { TocEntry, InlineImage } from './BookReader'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import BookmarkPanel from './BookmarkPanel'
import CharacterPanel from './CharacterPanel'
import StructurePanel from './StructurePanel'
import ImagePanel from './ImagePanel'
import QuizPanel from './QuizPanel'

interface PageSidebarProps {
  book: Book
  currentPage: number
  isOpen: boolean
  onClose: () => void
  sidebarMode?: 'hidden' | 'normal' | 'wide'
  prefs?: UserPrefs | null
  tocEntries?: TocEntry[]
  onTocNavigate?: (page: number) => void
  inlineImages?: InlineImage[]
  newFlashcard?: Flashcard | null
  onFlashcardConsumed?: () => void
  bookmarkedPages?: Set<number>
  externalChatPrompt?: string | null
  onExternalChatPromptConsumed?: () => void
  getPageSource?: (page: number) => string | null
}

type TabType = 'chat' | 'bookmarks' | 'characters' | 'images' | 'quiz'

const SIDEBAR_MIN = 280
const SIDEBAR_MAX = 720
const SIDEBAR_DEFAULT = 384

// Which tabs are shown by default for each content type.
// 'characters' renders as "Characters" panel for fiction/biography, "Structure" panel for everything else.
export const DEFAULT_TABS_BY_TYPE: Record<string, TabType[]> = {
  fiction:           ['chat', 'bookmarks', 'characters', 'images', 'quiz'],
  biography:         ['chat', 'bookmarks', 'characters', 'images', 'quiz'],
  textbook:          ['chat', 'bookmarks', 'characters', 'images', 'quiz'],
  math_textbook:     ['chat', 'bookmarks', 'characters', 'images', 'quiz'],
  academic_paper:    ['chat', 'bookmarks', 'characters', 'images', 'quiz'],
  wikipedia_article: ['chat', 'bookmarks', 'characters', 'images', 'quiz'],
  news_article:      ['chat', 'bookmarks', 'images', 'quiz'],
  forum_thread:      ['chat', 'bookmarks', 'images', 'quiz'],
  essay:             ['chat', 'bookmarks', 'images', 'quiz'],
  reference:         ['chat', 'bookmarks', 'characters', 'images', 'quiz'],
}
const FALLBACK_TABS: TabType[] = ['chat', 'bookmarks', 'characters', 'images', 'quiz']

// Tab metadata — label/icon vary by content type for 'characters'
const CHARACTERS_LABEL: Record<string, string> = {
  fiction: 'Characters', biography: 'Characters',
}
function getTabDef(id: TabType, contentType?: string): { id: TabType; label: string; icon: any; color: string } {
  switch (id) {
    case 'chat':       return { id, label: 'Chat',      icon: MessageCircle, color: 'blue' }
    case 'bookmarks':  return { id, label: 'Bookmarks', icon: Bookmark,      color: 'blue' }
    case 'characters': return { id, label: CHARACTERS_LABEL[contentType ?? ''] ?? 'Structure', icon: Users, color: contentType === 'fiction' || contentType === 'biography' ? 'purple' : 'indigo' }
    case 'images':     return { id, label: 'Images',    icon: Image,         color: 'green' }
    case 'quiz':       return { id, label: 'Quiz',      icon: GraduationCap, color: 'orange' }
  }
}

export default function PageSidebar({ book, currentPage, isOpen, onClose, prefs, newFlashcard, onFlashcardConsumed, externalChatPrompt, onExternalChatPromptConsumed, onTocNavigate, onOpenProblemSet, getPageSource, bookmarkedPages }: PageSidebarProps & { onOpenProblemSet?: (problem?: string) => void }) {
  const [activeTab, setActiveTab] = useState<TabType>('chat')
  const [chatPrefill, setChatPrefill] = useState<string | null>(null)
  const [imagePrefill, setImagePrefill] = useState<string | null>(null)
  const [width, setWidth] = useState(SIDEBAR_DEFAULT)
  const dragging = useRef(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const openChatWith = (text: string) => {
    setChatPrefill(text)
    setActiveTab('chat')
  }

  // External trigger: open chat tab with a prefilled prompt
  useEffect(() => {
    if (externalChatPrompt) {
      openChatWith(externalChatPrompt)
      onExternalChatPromptConsumed?.()
    }
  }, [externalChatPrompt])

  const openImagesWith = (prompt: string) => {
    setImagePrefill(prompt)
    setActiveTab('images')
  }

  // Apply resizable width only on desktop — mobile stays full-screen via CSS w-full
  useEffect(() => {
    if (sidebarRef.current && window.innerWidth >= 1024) {
      sidebarRef.current.style.width = `${width}px`
    }
  }, [width])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const next = window.innerWidth - e.clientX
      setWidth(Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, next)))
    }
    const onUp = () => { dragging.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  // Compute which tabs to show: user pref override → type default → fallback
  // Must be before early return so the useEffect below is always called (Rules of Hooks)
  const ct = book.content_type
  const enabledTabIds: TabType[] = (
    (prefs?.sidebar_tabs_by_type?.[ct ?? ''] ??
    DEFAULT_TABS_BY_TYPE[ct ?? ''] ??
    FALLBACK_TABS) as TabType[]
  )
  const tabs = enabledTabIds.map(id => getTabDef(id, ct))

  // If active tab is no longer in the enabled list, switch to first available
  useEffect(() => {
    if (!enabledTabIds.includes(activeTab) && enabledTabIds.length > 0) {
      setActiveTab(enabledTabIds[0])
    }
  }, [enabledTabIds.join(',')])

  if (!isOpen) return null

  return (
    <>
      {/* Mobile Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />

      {/* Sidebar — full-screen on mobile, resizable panel on desktop */}
      <div
        ref={sidebarRef}
        className="fixed lg:relative inset-y-0 right-0 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl flex flex-col z-50 w-full"
      >
        {/* Drag handle */}
        <div
          onMouseDown={() => { dragging.current = true }}
          className="hidden lg:block absolute left-0 inset-y-0 w-1 cursor-col-resize hover:bg-blue-400 active:bg-blue-500 transition-colors"
        />

        {/* Header with Tabs */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          {/* Close Button (Mobile) */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 lg:hidden">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">{book.title}</h2>
            <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex-1 min-w-0 flex items-center justify-center gap-1.5 px-2 py-3 text-sm font-medium
                    border-b-2 transition-colors
                    ${isActive
                      ? `border-${tab.color}-600 text-${tab.color}-600 bg-${tab.color}-50/50`
                      : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  <span className="truncate text-xs">{tab.label}</span>
                </button>
              )
            })}
            {/* Close button — visible on desktop where there's no overlay to tap */}
            <button
              onClick={onClose}
              className="hidden lg:flex flex-shrink-0 items-center justify-center w-10 h-full border-b-2 border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Close sidebar"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat' && (
            <div className="h-full">
              <ChatPanelContent
                book={book}
                currentPage={currentPage}
                prefill={chatPrefill}
                onPrefillConsumed={() => setChatPrefill(null)}
                getPageSource={getPageSource}
              />
            </div>
          )}

          {activeTab === 'bookmarks' && (
            <BookmarkPanel
              book={book}
              currentPage={currentPage}
              onNavigate={(page) => {
                onTocNavigate?.(page)
                // Close sidebar on mobile so the page is visible after jump
                if (typeof window !== 'undefined' && window.innerWidth < 1024) onClose()
              }}
            />
          )}

          {activeTab === 'characters' && (
            (ct === 'fiction' || ct === 'biography' || !ct)
              ? <CharacterPanel book={book} currentPage={currentPage} onCorrect={openChatWith} onGenerateImage={openImagesWith} />
              : <StructurePanel book={book} currentPage={currentPage} onCorrect={openChatWith} onGenerateImage={openImagesWith} onNavigate={onTocNavigate} />
          )}

          {activeTab === 'images' && (
            <ImagePanel book={book} currentPage={currentPage} prefill={imagePrefill} onPrefillConsumed={() => setImagePrefill(null)} onNavigate={onTocNavigate} getPageSource={getPageSource} />
          )}

          {activeTab === 'quiz' && (
            <QuizPanel book={book} currentPage={currentPage} newFlashcard={newFlashcard} onFlashcardConsumed={onFlashcardConsumed} onOpenProblemSet={onOpenProblemSet} />
          )}
        </div>
      </div>
    </>
  )
}

function ChatPanelContent({
  book, currentPage, prefill, onPrefillConsumed, getPageSource
}: {
  book: Book
  currentPage: number
  prefill: string | null
  onPrefillConsumed: () => void
  getPageSource?: (page: number) => string | null
}) {
  const [messages, setMessages] = useState<any[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [showConvList, setShowConvList] = useState(false)
  const [includePageContext, setIncludePageContext] = useState(true)
  const [contextMode, setContextMode] = useState<'page' | 'chapter' | 'summary' | 'custom'>('page')
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [customContextPages, setCustomContextPages] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const [avatarState, setAvatarState] = useState<AvatarState>('idle')
  const [autoRead, setAutoReadState] = useState(() => isAutoReadEnabled())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const cancelSpeechRef = useRef<(() => void) | null>(null)
  const currentPageRef = useRef(currentPage)
  currentPageRef.current = currentPage

  // Cleanup speech on unmount
  useEffect(() => () => { cancelSpeechRef.current?.() }, [])

  const speak = (msgId: string, text: string) => {
    cancelSpeechRef.current?.()
    if (speakingId === msgId) { setSpeakingId(null); setAvatarState('idle'); return }
    cancelSpeechRef.current = personaSpeak(
      text,
      () => { setSpeakingId(msgId); setAvatarState('talking') },
      () => { setSpeakingId(null); setAvatarState('idle') },
    )
  }

  const toggleAutoRead = () => {
    const next = !autoRead
    setAutoReadState(next)
    setAutoRead(next)
  }

  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      setError(null)
      try {
        await ensureSession()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { setIsAuthenticated(false); setIsLoading(false); return }
        setIsAuthenticated(true)

        // Find most-recent conversation for this book, or create one
        const convs = await chatQueries.listConversations(book.id)
        setConversations(convs)
        let conv = convs[0]
        if (!conv) conv = await chatQueries.createConversation(book.id, book.title)
        setConversationId(conv.id)

        const msgs = await chatQueries.getMessages(conv.id)
        setMessages(msgs)
      } catch (err: any) {
        setError('Failed to load chat')
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [book.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // When a correction/prefill comes in from another panel, populate the input
  useEffect(() => {
    if (prefill && !isLoading) {
      setInputValue(prefill)
      onPrefillConsumed()
      inputRef.current?.focus()
    }
  }, [prefill, isLoading])

  const switchConversation = async (convId: number) => {
    setConversationId(convId)
    setShowConvList(false)
    const msgs = await chatQueries.getMessages(convId)
    setMessages(msgs)
  }

  const startNewChat = async () => {
    const conv = await chatQueries.createConversation(book.id, book.title)
    setConversations(prev => [conv, ...prev])
    setConversationId(conv.id)
    setMessages([])
    setShowConvList(false)
  }

  // Slash command expansion
  const expandSlashCommand = (text: string): string | null => {
    const cmd = text.trim().toLowerCase()
    if (cmd === '/summarize' || cmd === '/summary') return `Summarize what's on this page in a few bullet points.`
    if (cmd === '/explain') return `Explain the key concepts on this page in simple terms.`
    if (cmd === '/quiz') return `Create 3 quiz questions based on this page to test my understanding.`
    if (cmd === '/characters') return `Who are the characters or key figures mentioned on this page? Describe them briefly.`
    if (cmd === '/themes') return `What are the main themes or arguments being made on this page?`
    if (cmd === '/define') return `List and define any technical terms, jargon, or unfamiliar words on this page.`
    if (cmd === '/discuss') return `What are some interesting discussion questions that arise from this page?`
    if (cmd.startsWith('/')) return null // unknown slash command, don't expand
    return undefined // not a slash command
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || isSending) return

    // Handle slash commands
    const expanded = expandSlashCommand(text)
    if (expanded === null) {
      setError(`Unknown command: ${text.trim().split(' ')[0]}. Try /summarize, /explain, /quiz, /characters, /themes, /define, /discuss`)
      return
    }
    const finalText = expanded ?? text.trim()

    setInputValue('')
    setIsSending(true)
    setError(null)

    const userMsgId = `user-${Date.now()}`
    const assistantMsgId = `stream-${Date.now()}`
    setMessages(prev => [...prev, {
      id: userMsgId, role: 'user', content: finalText, created_at: new Date().toISOString()
    }])

    // Add empty assistant message for streaming
    setMessages(prev => [...prev, {
      id: assistantMsgId, role: 'assistant', content: '', created_at: new Date().toISOString(), streaming: true
    }])

    try {
      const { model } = getModelChoice('chat')

      // Get page content for context
      let pageContent: string | undefined
      let contextPageNum: number | undefined
      if (contextMode === 'page') {
        contextPageNum = currentPageRef.current
        if (getPageSource) pageContent = getPageSource(contextPageNum) || undefined
      } else if (contextMode === 'chapter') {
        contextPageNum = currentPageRef.current
        if (getPageSource) pageContent = getPageSource(contextPageNum) || undefined
      } else if (contextMode === 'custom' && customContextPages.trim()) {
        const first = parseInt(customContextPages.split(/[,\-]/)[0])
        contextPageNum = isNaN(first) ? currentPageRef.current : first
        if (getPageSource) pageContent = getPageSource(contextPageNum) || undefined
      }

      // Build message history for context (last 20 messages)
      const historyMsgs = messages.slice(-20).map(m => ({
        role: m.role, content: m.content
      }))
      historyMsgs.push({ role: 'user', content: finalText })

      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          messages: historyMsgs,
          bookTitle: book.title,
          pageContent,
          pageNum: contextPageNum,
          model,
          personaPrompt: getPersonaPrompt() || undefined,
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(err.error || `Error ${response.status}`)
      }

      // Read SSE stream
      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            if (parsed.content) {
              fullContent += parsed.content
              setMessages(prev => prev.map(m =>
                m.id === assistantMsgId ? { ...m, content: fullContent } : m
              ))
            }
            if (parsed.error) throw new Error(parsed.error)
          } catch (e: any) {
            if (e.message && e.message !== 'Unexpected end of JSON input') {
              throw e
            }
          }
        }
      }

      // Mark streaming complete
      setMessages(prev => prev.map(m =>
        m.id === assistantMsgId ? { ...m, streaming: false } : m
      ))

      // Save to DB if we have a conversation
      if (conversationId && fullContent) {
        // Save user message
        supabase.from('chat_messages').insert({
          user_id: session?.user?.id, conversation_id: conversationId,
          role: 'user', content: finalText, page_num: contextPageNum,
        }).then(() => {})
        // Save assistant message
        supabase.from('chat_messages').insert({
          user_id: session?.user?.id, conversation_id: conversationId,
          role: 'assistant', content: fullContent, page_num: contextPageNum,
        }).then(() => {})
        // Update conversation timestamp
        supabase.from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId).then(() => {})
      }

      // Auto-read response if enabled
      if (autoRead && getPersonaInfo() && fullContent) {
        speak(assistantMsgId, fullContent)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send message')
      setMessages(prev => prev.filter(m => m.id !== assistantMsgId))
    } finally {
      setIsSending(false)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputValue)
  }

  if (isAuthenticated === null || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-3 text-gray-500 dark:text-gray-400">
        <AlertCircle size={40} className="text-gray-300" />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Chat unavailable</p>
        <p className="text-xs text-gray-400">Could not initialize session. Try refreshing the page.</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Conversation switcher + New Chat */}
      <div className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2 relative">
        <button
          onClick={() => setShowConvList(v => !v)}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 truncate flex-1 text-left"
        >
          {conversations.find(c => c.id === conversationId)?.title || 'Chat'} ▾
        </button>
        <button onClick={startNewChat} className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline flex-shrink-0">
          + New
        </button>
        {showConvList && conversations.length > 1 && (
          <div className="absolute top-full left-0 right-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-0.5">
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => switchConversation(conv.id)}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 ${conv.id === conversationId ? 'bg-purple-50 dark:bg-purple-900/20 font-medium text-purple-700 dark:text-purple-300' : 'text-gray-600 dark:text-gray-300'}`}
              >
                <p className="truncate">{conv.title || 'Untitled'}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{new Date(conv.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Context mode selector */}
      <div className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2 relative">
        <button
          onClick={() => setShowContextMenu(v => !v)}
          className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
        >
          <span className="text-[10px]">📎</span>
          {contextMode === 'page' ? `p.${currentPage}` : contextMode === 'chapter' ? 'Chapter' : contextMode === 'summary' ? 'Summary' : 'Custom'}
          <span className="text-gray-400">▾</span>
        </button>

        {showContextMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowContextMenu(false)} />
            <div className="absolute top-full left-2 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 min-w-[200px] mt-0.5">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide px-2 mb-1">Context sent with messages</p>
              {([
                { id: 'page' as const, label: `Current page (p.${currentPage})`, desc: 'Just the page you\'re reading' },
                { id: 'chapter' as const, label: 'Current chapter', desc: 'Full chapter containing this page' },
                { id: 'summary' as const, label: 'Book summary only', desc: 'No page text — just title + summary' },
                { id: 'custom' as const, label: 'Custom page range', desc: 'Specify which pages to include' },
              ]).map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { setContextMode(opt.id); setIncludePageContext(opt.id !== 'summary'); setShowContextMenu(false) }}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs ${contextMode === opt.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  <p className="font-medium">{opt.label}</p>
                  <p className="text-[10px] text-gray-400">{opt.desc}</p>
                </button>
              ))}
              {contextMode === 'custom' && (
                <div className="mt-2 px-2">
                  <input
                    type="text"
                    value={customContextPages}
                    onChange={e => setCustomContextPages(e.target.value)}
                    placeholder="e.g. 1-5, 10, 15-20"
                    className="input w-full text-xs py-1"
                  />
                </div>
              )}
            </div>
          </>
        )}

        <div className="flex-1" />
        {getPersonaInfo() && (
          <label className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 cursor-pointer select-none">
            <input type="checkbox" checked={autoRead} onChange={toggleAutoRead} className="rounded" style={{ width: 12, height: 12 }} />
            🔊
          </label>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 bg-gray-50 dark:bg-gray-900">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
            <div>
              <div className="flex justify-center mb-3">
                <PersonaAvatar state="idle" size="lg" />
              </div>
              {!getPersonaPrompt() && <MessageCircle size={40} className="mx-auto mb-3 text-gray-300" />}
              <p className="text-sm">Ask anything about this book</p>
              <p className="text-xs mt-1 text-gray-400">
                {includePageContext
                  ? `Page ${currentPage} content included as context`
                  : 'Whole-book context mode'}
              </p>
            </div>
            {/* Suggested actions */}
            <div className="mt-4 flex flex-wrap gap-1.5 justify-center max-w-xs">
              {[
                { label: 'Summarize page', cmd: '/summarize' },
                { label: 'Explain concepts', cmd: '/explain' },
                { label: 'Quiz me', cmd: '/quiz' },
                { label: 'Key terms', cmd: '/define' },
                { label: 'Discuss', cmd: '/discuss' },
              ].map(a => (
                <button
                  key={a.cmd}
                  onClick={() => sendMessage(a.cmd)}
                  disabled={isSending}
                  className="text-[10px] px-2.5 py-1.5 rounded-full border border-purple-200 dark:border-purple-700 text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors disabled:opacity-40"
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg: any) => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <PersonaAvatar state={speakingId === msg.id ? 'talking' : avatarState === 'idle' ? 'idle' : 'idle'} size="sm" inline />
                )}
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 prose prose-sm max-w-none dark:prose-invert'
                }`}>
                  {msg.role === 'assistant' ? (
                    <>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      {msg.streaming && <span className="inline-block w-1.5 h-4 bg-purple-500 animate-pulse ml-0.5 align-text-bottom rounded-sm" />}
                    </>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                  <div className={`flex items-center gap-1.5 mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                    <p className="text-xs flex-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {msg.role === 'assistant' && !msg.streaming && (
                      <button
                        onClick={() => navigator.clipboard.writeText(msg.content)}
                        className="text-[10px] p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        title="Copy"
                      >
                        📋
                      </button>
                    )}
                    {msg.role === 'assistant' && getPersonaInfo() && !msg.streaming && (
                      <button
                        onClick={() => speak(msg.id, msg.content)}
                        className={`text-[10px] p-0.5 rounded transition-colors ${speakingId === msg.id ? 'text-indigo-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                        title={speakingId === msg.id ? 'Stop reading' : 'Read aloud'}
                      >
                        {speakingId === msg.id ? '🔊' : '🔈'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator — only show before stream starts */}
            {isSending && !messages.some(m => m.streaming) && (
              <div className="flex gap-2 justify-start items-end">
                <PersonaAvatar state="thinking" size="sm" inline />
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 flex gap-1 items-center">
                  {[0, 150, 300].map(delay => (
                    <span
                      key={delay}
                      className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="px-3 py-2 bg-red-50 border-t border-red-100 flex items-center gap-2 text-xs text-red-600">
          <AlertCircle size={12} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder={includePageContext ? `Ask about page ${currentPage}… (try /summarize)` : 'Ask about this book… (try /quiz)'}
            disabled={isSending}
            className="input flex-1 text-sm"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isSending}
            className="btn btn-primary px-3"
          >
            {isSending ? <div className="spinner" /> : <Send size={16} />}
          </button>
        </form>
      </div>
    </div>
  )
}
