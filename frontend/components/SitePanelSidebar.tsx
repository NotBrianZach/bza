'use client'
import { useEffect, useState, useCallback } from 'react'
import { authedFetch } from '@/lib/authedFetch'
import { Camera, Bookmark, Loader2, Plus, X, ExternalLink, Trash2, MessageSquare, Send, PencilRuler, Settings, RotateCcw } from 'lucide-react'
import WorkspaceEditor from './WorkspaceEditor'

interface Props {
  sessionId: string | null   // null until session started
  currentUrl?: string        // hint for bookmark form
}

interface Capture {
  id: string
  mode: string
  extracted: any
  model?: string
  base_cost?: number
  created_at: string
}
interface BookmarkRow {
  id: string
  url: string
  title?: string | null
  note?: string | null
  created_at: string
}

export default function SitePanelSidebar({ sessionId, currentUrl }: Props) {
  const [tab, setTab] = useState<'captures' | 'bookmarks' | 'chats' | 'workspace'>('captures')
  const [captures, setCaptures] = useState<Capture[]>([])
  const [bookmarks, setBookmarks] = useState<BookmarkRow[]>([])
  const [loading, setLoading] = useState(false)
  const [addingBookmark, setAddingBookmark] = useState(false)
  const [bmUrl, setBmUrl] = useState('')
  const [bmTitle, setBmTitle] = useState('')
  const [chats, setChats] = useState<{id:string; role:string; content:string; created_at:string}[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const [contextOpen, setContextOpen] = useState(false)
  const [contextText, setContextText] = useState('')
  const [contextLoaded, setContextLoaded] = useState(false)
  const [contextSaving, setContextSaving] = useState(false)
  const [capOpen, setCapOpen] = useState(false)
  const [capText, setCapText] = useState('')
  const [capMode, setCapMode] = useState<'problem'|'text'|'diagram'>('problem')
  const [capLoaded, setCapLoaded] = useState(false)
  const [capSaving, setCapSaving] = useState(false)

  const loadCaptures = useCallback(async () => {
    if (!sessionId) return
    setLoading(true)
    try {
      const r = await authedFetch(`/api/browser-session/${sessionId}/captures`)
      const d = await r.json()
      setCaptures(d.captures ?? [])
    } finally { setLoading(false) }
  }, [sessionId])

  const loadBookmarks = useCallback(async () => {
    if (!sessionId) return
    setLoading(true)
    try {
      const r = await authedFetch(`/api/browser-session/${sessionId}/bookmarks`)
      const d = await r.json()
      setBookmarks(d.bookmarks ?? [])
    } finally { setLoading(false) }
  }, [sessionId])

  const loadChats = useCallback(async () => {
    if (!sessionId) return
    setLoading(true)
    try {
      const r = await authedFetch(`/api/browser-session/${sessionId}/chats`)
      const d = await r.json()
      setChats(d.chats ?? [])
    } finally { setLoading(false) }
  }, [sessionId])

  const loadContext = useCallback(async () => {
    if (!sessionId) return
    try {
      const r = await authedFetch(`/api/browser-session/${sessionId}`)
      const d = await r.json()
      setContextText(d.chat_system_prompt ?? '')
      setContextLoaded(true)
      setCapText(d.capture_prompt ?? '')
      setCapMode((d.capture_mode as any) ?? 'problem')
      setCapLoaded(true)
    } catch {}
  }, [sessionId])

  const saveCapConfig = async () => {
    if (!sessionId) return
    setCapSaving(true)
    try {
      await authedFetch(`/api/browser-session/${sessionId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capturePrompt: capText, captureMode: capMode }),
      })
    } finally { setCapSaving(false) }
  }
  const resetCapConfig = async () => {
    if (!sessionId) return
    setCapSaving(true)
    try {
      await authedFetch(`/api/browser-session/${sessionId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capturePrompt: null, captureMode: null }),
      })
      setCapText(''); setCapMode('problem')
    } finally { setCapSaving(false) }
  }

  const saveContext = async () => {
    if (!sessionId) return
    setContextSaving(true)
    try {
      await authedFetch(`/api/browser-session/${sessionId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatSystemPrompt: contextText }),
      })
    } finally { setContextSaving(false) }
  }

  const resetContext = async () => {
    if (!sessionId) return
    setContextSaving(true)
    try {
      await authedFetch(`/api/browser-session/${sessionId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatSystemPrompt: null }),
      })
      setContextText('')
    } finally { setContextSaving(false) }
  }

  useEffect(() => { if (sessionId && tab === 'chats' && !contextLoaded) loadContext() }, [sessionId, tab, contextLoaded, loadContext])

  const sendChat = async () => {
    if (!sessionId || !chatInput.trim() || chatSending) return
    const msg = chatInput.trim()
    setChatInput('')
    setChatSending(true)
    // Optimistic user message
    setChats(cs => [...cs, { id: 'tmp-' + Date.now(), role: 'user', content: msg, created_at: new Date().toISOString() }])
    try {
      const r = await authedFetch(`/api/browser-session/${sessionId}/chats`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: msg }),
      })
      const d = await r.json()
      if (r.ok && d.reply) {
        setChats(cs => [...cs, { id: 'tmp-a-' + Date.now(), role: 'assistant', content: d.reply, created_at: new Date().toISOString() }])
      }
    } finally { setChatSending(false) }
  }

  useEffect(() => {
    if (!sessionId) return
    if (tab === 'captures') { loadCaptures(); if (!capLoaded) loadContext() }
    else if (tab === 'bookmarks') loadBookmarks()
    else if (tab === 'chats') loadChats()
  }, [sessionId, tab, loadCaptures, loadBookmarks, loadChats, capLoaded, loadContext])

  useEffect(() => { if (currentUrl && !bmUrl) setBmUrl(currentUrl) }, [currentUrl])

  const saveBookmark = async () => {
    if (!sessionId || !bmUrl.trim()) return
    await authedFetch(`/api/browser-session/${sessionId}/bookmarks`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: bmUrl.trim(), title: bmTitle.trim() || null }),
    })
    setAddingBookmark(false); setBmTitle('')
    loadBookmarks()
  }

  const deleteBookmark = async (id: string) => {
    if (!sessionId) return
    await authedFetch(`/api/browser-session/${sessionId}/bookmarks?bookmark=${encodeURIComponent(id)}`, { method: 'DELETE' })
    setBookmarks(b => b.filter(x => x.id !== id))
  }

  return (
    <div className="h-full flex flex-col bg-gray-950 border-l border-gray-800 text-gray-100" style={{ width: tab === 'workspace' ? 600 : 320 }}>
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setTab('captures')}
          className={'flex-1 py-2 text-sm flex items-center justify-center gap-1.5 ' + (tab === 'captures' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-200')}
        >
          <Camera size={13} /> Captures{captures.length ? ' (' + captures.length + ')' : ''}
        </button>
        <button
          onClick={() => setTab('bookmarks')}
          className={'flex-1 py-2 text-sm flex items-center justify-center gap-1.5 ' + (tab === 'bookmarks' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-200')}
        >
          <Bookmark size={13} /> Bookmarks{bookmarks.length ? ' (' + bookmarks.length + ')' : ''}
        </button>
        <button
          onClick={() => setTab('chats')}
          className={'flex-1 py-2 text-sm flex items-center justify-center gap-1.5 ' + (tab === 'chats' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-200')}
        >
          <MessageSquare size={13} /> Chat{chats.length ? ' (' + chats.length + ')' : ''}
        </button>
        <button
          onClick={() => setTab('workspace')}
          className={'flex-1 py-2 text-sm flex items-center justify-center gap-1.5 ' + (tab === 'workspace' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-200')}
        >
          <PencilRuler size={13} /> Workspace
        </button>
      </div>

      {!sessionId && (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm p-4 text-center">
          Start a session to see captures + bookmarks here.
        </div>
      )}

      {sessionId && tab === 'captures' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="border-b border-gray-800">
            <button
              onClick={() => setCapOpen(v => !v)}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[11px] text-gray-400 hover:text-gray-200 hover:bg-gray-900"
            >
              <Settings size={11} /> {capOpen ? 'Hide' : 'Edit'} capture context (mode: {capMode}{capText ? ', custom prompt' : ''})
            </button>
            {capOpen && (
              <div className="p-2 space-y-1.5 bg-gray-900/40">
                <div className="flex gap-1">
                  {(['problem','text','diagram'] as const).map(m => (
                    <button key={m} onClick={() => setCapMode(m)}
                      className={'flex-1 text-[11px] py-1 rounded ' + (capMode === m ? 'bg-teal-700 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700')}
                    >{m}</button>
                  ))}
                </div>
                <textarea
                  value={capText}
                  onChange={e => setCapText(e.target.value)}
                  rows={4}
                  placeholder="Custom extraction prompt (empty = default for selected mode)"
                  className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-[11px] text-gray-100 font-mono"
                />
                <div className="flex gap-1.5">
                  <button onClick={saveCapConfig} disabled={capSaving} className="flex-1 text-[11px] py-1 rounded bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white">Save</button>
                  <button onClick={resetCapConfig} disabled={capSaving} title="Reset to defaults" className="px-2 text-[11px] py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-200"><RotateCcw size={11} /></button>
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-auto">
          {loading && <div className="p-3 text-xs text-gray-400 flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> Loading…</div>}
          {!loading && captures.length === 0 && (
            <div className="p-4 text-sm text-gray-500 text-center">Nothing captured yet. Use the Capture button in the top bar.</div>
          )}
          {captures.map(c => (
            <div key={c.id} className="p-3 border-b border-gray-800 text-xs">
              <div className="flex justify-between text-gray-400 mb-1">
                <span>{new Date(c.created_at).toLocaleString()}</span>
                <span className="font-mono">{c.model ?? c.mode}</span>
              </div>
              <div className="text-gray-100 whitespace-pre-wrap font-mono text-xs">
                {(c.extracted?.problems?.[0]?.text ?? '').slice(0, 400)}
                {(c.extracted?.problems?.[0]?.text?.length ?? 0) > 400 && '…'}
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {sessionId && tab === 'bookmarks' && (
        <div className="flex-1 overflow-auto flex flex-col">
          <div className="p-2 border-b border-gray-800">
            {!addingBookmark ? (
              <button
                onClick={() => setAddingBookmark(true)}
                className="w-full flex items-center justify-center gap-1.5 text-sm py-1.5 rounded bg-teal-800 hover:bg-teal-700 text-white"
              >
                <Plus size={13} /> Add bookmark
              </button>
            ) : (
              <div className="space-y-2">
                <input
                  type="url"
                  value={bmUrl}
                  onChange={e => setBmUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-100"
                />
                <input
                  type="text"
                  value={bmTitle}
                  onChange={e => setBmTitle(e.target.value)}
                  placeholder="Title (optional)"
                  className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-100"
                />
                <div className="flex gap-1.5">
                  <button onClick={saveBookmark} className="flex-1 text-xs py-1.5 rounded bg-teal-700 hover:bg-teal-600 text-white">Save</button>
                  <button onClick={() => { setAddingBookmark(false); setBmTitle('') }} className="px-2 text-xs py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300"><X size={12} /></button>
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-auto">
            {loading && <div className="p-3 text-xs text-gray-400 flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> Loading…</div>}
            {!loading && bookmarks.length === 0 && (
              <div className="p-4 text-sm text-gray-500 text-center">No bookmarks yet.</div>
            )}
            {bookmarks.map(b => (
              <div key={b.id} className="p-3 border-b border-gray-800 text-xs group">
                <div className="flex justify-between items-start gap-2">
                  <a href={b.url} target="_blank" rel="noopener" className="text-teal-300 hover:text-teal-200 flex items-center gap-1 min-w-0">
                    <ExternalLink size={11} className="flex-shrink-0" />
                    <span className="truncate">{b.title || b.url}</span>
                  </a>
                  <button onClick={() => deleteBookmark(b.id)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400">
                    <Trash2 size={11} />
                  </button>
                </div>
                {b.title && <div className="text-gray-500 mt-0.5 truncate">{b.url}</div>}
                {b.note && <div className="text-gray-400 mt-1">{b.note}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {sessionId && tab === 'workspace' && (
        <WorkspaceEditor sessionId={sessionId} />
      )}

      {sessionId && tab === 'chats' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="border-b border-gray-800">
            <button
              onClick={() => setContextOpen(v => !v)}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[11px] text-gray-400 hover:text-gray-200 hover:bg-gray-900"
            >
              <Settings size={11} /> {contextOpen ? 'Hide' : 'Edit'} context{contextText ? ' (custom)' : ' (default)'}
            </button>
            {contextOpen && (
              <div className="p-2 space-y-1.5 bg-gray-900/40">
                <textarea
                  value={contextText}
                  onChange={e => setContextText(e.target.value)}
                  rows={5}
                  placeholder="Custom system prompt for this session (leave empty for default). Captures still auto-append."
                  className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-[11px] text-gray-100 font-mono"
                />
                <div className="flex gap-1.5">
                  <button onClick={saveContext} disabled={contextSaving} className="flex-1 text-[11px] py-1 rounded bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white">Save</button>
                  <button onClick={resetContext} disabled={contextSaving} title="Reset to default" className="px-2 text-[11px] py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-200"><RotateCcw size={11} /></button>
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-2">
            {loading && <div className="text-xs text-gray-400 flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> Loading…</div>}
            {!loading && chats.length === 0 && (
              <div className="text-sm text-gray-500 text-center p-4">Ask about what you're looking at, or paste a captured problem for help.</div>
            )}
            {chats.map(m => (
              <div key={m.id} className={'rounded px-2 py-1.5 text-xs whitespace-pre-wrap ' + (m.role === 'user' ? 'bg-teal-900/40 text-gray-100' : 'bg-gray-900 text-gray-200')}>
                <div className="text-[10px] text-gray-500 mb-0.5">{m.role === 'user' ? 'You' : 'Assistant'}</div>
                {m.content}
              </div>
            ))}
            {chatSending && (
              <div className="rounded px-2 py-1.5 text-xs bg-gray-900 text-gray-400 flex items-center gap-2"><Loader2 size={11} className="animate-spin" /> Thinking…</div>
            )}
          </div>
          <div className="p-2 border-t border-gray-800 flex gap-1.5">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() } }}
              placeholder="Message…"
              className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-100"
              disabled={chatSending}
            />
            <button
              onClick={sendChat}
              disabled={chatSending || !chatInput.trim()}
              className="px-2 rounded bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white"
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
