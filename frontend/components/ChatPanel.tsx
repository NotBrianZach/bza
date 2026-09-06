'use client'

import { useState, useEffect, useRef } from 'react'
import { Book, ChatMessage } from '@/types'
import { chatQueries } from '@/lib/queries'
import { track } from '@/lib/analytics'
import UpgradeGate from './UpgradeGate'
import { Send, Loader2, MessageCircle, X } from 'lucide-react'

interface ChatPanelProps {
  book: Book
  isOpen: boolean
  onClose: () => void
}

export default function ChatPanel({ book, isOpen, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [quotaGateOpen, setQuotaGateOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && book.id) {
      loadChatHistory()
    }
  }, [book.id, isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadChatHistory = async () => {
    try {
      setIsLoading(true)
      const conversations = await chatQueries.listConversations(book.id)
      if (conversations.length > 0) {
        const conv = conversations[0]
        setConversationId(conv.id)
        const msgs = await chatQueries.getMessages(conv.id)
        setMessages(msgs.map(m => ({
          id: String(m.id),
          book_id: book.id,
          role: m.role,
          content: m.content,
          created_at: m.created_at,
        })))
      }
    } catch (err) {
      console.error('Error loading chat history:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inputValue.trim() || isSending) return

    track('chat_message_sent', { book_id: book.id, content_type: book.content_type, len: inputValue.trim().length })

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      book_id: book.id,
      role: 'user',
      content: inputValue.trim(),
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsSending(true)

    try {
      let convId = conversationId
      if (!convId) {
        const conv = await chatQueries.createConversation(book.id, 'Chat')
        convId = conv.id
        setConversationId(convId)
      }

      const { message } = await chatQueries.sendMessage(convId, userMessage.content)

      const assistantMessage: ChatMessage = {
        id: String(message.id),
        book_id: book.id,
        role: 'assistant',
        content: message.content,
        created_at: message.created_at,
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err: any) {
      console.error('Error sending message:', err)

      const msg = String(err?.message ?? '')
      const isQuotaHit = msg.toLowerCase().includes('quota') ||
                         msg.toLowerCase().includes('limit') ||
                         msg.toLowerCase().includes('upgrade')

      if (isQuotaHit) {
        setQuotaGateOpen(true)
      }

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        book_id: book.id,
        role: 'assistant',
        content: isQuotaHit
          ? 'You\'ve hit your AI budget for this month. Upgrade to Pro to keep chatting.'
          : 'Sorry, I encountered an error. Please try again.',
        created_at: new Date().toISOString()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-xl flex flex-col z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle size={20} />
          <div>
            <h3 className="font-semibold">Chat about Book</h3>
            <p className="text-xs text-blue-100">{book.title}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-300 text-sm">Loading chat history...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <MessageCircle size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Start a conversation about this book!</p>
              <p className="text-xs mt-2">Ask questions, discuss themes, or request summaries.</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                    }`}
                  >
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about the book..."
            disabled={isSending}
            className="input flex-1"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isSending}
            className="btn btn-primary px-4"
          >
            {isSending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>
      </div>
      <UpgradeGate
        open={quotaGateOpen}
        reason="chat_quota"
        onClose={() => setQuotaGateOpen(false)}
      />
    </div>
  )
}
