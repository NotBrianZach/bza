'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, MessageSquare, Loader2, Save } from 'lucide-react'
import { PromptInput } from '../PromptInput'
import { booksQueries } from '@/lib/queries'
import { supabase } from '@/lib/supabase'
import { saveLocalBook, saveBookContent } from '@/lib/localStorage'

interface ChatMsg {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

export function ChatBookCreator({ useLocalStorage, onSuccess }: { useLocalStorage: boolean; onSuccess?: () => void }) {
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [chatTitle, setChatTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /* No FormEvent: PromptInput owns the form and its key handling, and calls
     this with nothing. The parameter was only ever there to be
     preventDefault'd. */
  const handleSend = async () => {
    if (!input.trim() || isSending) return

    const text = input.trim()
    setInput('')
    setIsSending(true)
    setError(null)

    const userMsgId = `user-${Date.now()}`
    const assistantMsgId = `stream-${Date.now()}`

    setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: text }])
    setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '', streaming: true }])

    // Auto-generate title from first message
    if (!chatTitle && messages.length === 0) {
      setChatTitle(text.length > 60 ? text.slice(0, 57) + '…' : text)
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()

      const historyMsgs = messages.map(m => ({ role: m.role, content: m.content }))
      historyMsgs.push({ role: 'user', content: text })

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ messages: historyMsgs }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(err.error || `Error ${response.status}`)
      }

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
          } catch {}
        }
      }

      setMessages(prev => prev.map(m =>
        m.id === assistantMsgId ? { ...m, streaming: false } : m
      ))
    } catch (err: any) {
      setError(err.message || 'Failed to send')
      setMessages(prev => prev.filter(m => m.id !== assistantMsgId))
    } finally {
      setIsSending(false)
    }
  }

  const saveAsBook = async () => {
    if (messages.length < 2) return
    setIsSaving(true)
    setError(null)

    try {
      /*
       * Format chat as readable markdown, in the shape the READER APPENDS IN.
       *
       * This used `## You` / `## Assistant` headings while
       * BookReader.sendChatBookMessage appends `**You:**` / `**Assistant:**`.
       * Both render, so nothing looked broken — but a conversation continued
       * after saving would have had two different conventions in one
       * document, the seam landing exactly where the save happened. Since
       * the whole point of this change is that the book stays continuable,
       * matching the append format is part of the fix rather than a tidy-up.
       */
      const title = chatTitle || 'Chat conversation'
      let markdown = `# ${title}\n\n`
      markdown += `*Created ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}*\n\n---\n`

      for (const msg of messages) {
        if (msg.role === 'user') {
          markdown += `\n\n**You:** ${msg.content}\n\n`
        } else {
          markdown += `**Assistant:** ${msg.content}\n\n---\n`
        }
      }

      if (useLocalStorage) {
        const nb = saveLocalBook({
          user_id: '', title, file_path: 'local',
          total_pages: Math.max(1, Math.ceil(markdown.length / 2000)), summary: '',
          /* The local path has to carry the type too, or a signed-out user
             gets the same dead-end book the signed-in one used to. */
          content_type: 'chat_book',
        })
        saveBookContent(nb.id, markdown)
        onSuccess?.()
        router.push(`/books/${nb.id}`)
      } else {
        /* createChatBook, not upload(). See its header: `upload` would set
           content_type from articleType, and only 'chat_book' is continuable.
           It also skips a pointless round trip through File → text. */
        const book = await booksQueries.createChatBook(title, markdown)
        onSuccess?.()
        router.push(`/books/${book.id}`)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col" style={{ minHeight: 400 }}>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Have a conversation with AI, then save it as a readable book in your library.
      </p>

      {/* Title */}
      <input
        type="text"
        value={chatTitle}
        onChange={e => setChatTitle(e.target.value)}
        placeholder="Conversation title (auto-generated from first message)"
        className="input text-sm mb-3"
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3 space-y-3 mb-3" style={{ maxHeight: 360 }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-8">
            <MessageSquare size={32} className="mb-2 text-gray-300" />
            <p className="text-sm">Start a conversation</p>
            <p className="text-xs mt-1">Ask anything — your chat will become a book</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.streaming && <span className="inline-block w-1.5 h-4 bg-purple-500 animate-pulse ml-0.5 align-text-bottom rounded-sm" />}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <p className="text-xs text-red-500 mb-2 flex items-center gap-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}

      {/* Input */}
      <div className="mb-3">
        <PromptInput
          value={input}
          onChange={setInput}
          onSend={() => handleSend()}
          sending={isSending}
          disabled={isSending}
          autoFocus
        />
      </div>

      {/* Save as book */}
      <button
        onClick={saveAsBook}
        disabled={messages.length < 2 || isSaving || isSending}
        className="btn btn-primary w-full flex items-center justify-center gap-2 py-2.5 disabled:opacity-40"
      >
        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {isSaving ? 'Saving…' : `Save as book (${messages.length} messages)`}
      </button>
    </div>
  )
}
