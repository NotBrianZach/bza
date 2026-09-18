import { RefObject } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import { Loader2 } from 'lucide-react'

interface ChatBookReaderProps {
  scrollContainerRef: RefObject<HTMLDivElement>
  chatBookContent: string
  chatSending: boolean
  loadError: string | null
  chatInput: string
  setChatInput: (v: string) => void
  onSend: () => void
}

// Dedicated content pane + input bar for a chat-book (an interactive
// conversation-style book). Two absolutely-positioned siblings inside
// the reader's content container.
export function ChatBookReader({
  scrollContainerRef, chatBookContent, chatSending, loadError,
  chatInput, setChatInput, onSend,
}: ChatBookReaderProps) {
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 5 }} className="bg-gray-50 dark:bg-gray-900">
        <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', paddingBottom: 64 }}>
          <div className="max-w-prose mx-auto px-6 pt-8 pb-12 prose prose-lg font-serif text-gray-900 dark:text-gray-100 dark:prose-invert">
            {chatBookContent ? (
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeRaw, [rehypeKatex, { throwOnError: false }]]}>
                {chatBookContent}
              </ReactMarkdown>
            ) : (
              <p className="text-gray-400 italic">Send a message to start the conversation…</p>
            )}
            {chatSending && <p className="text-gray-400 animate-pulse">Thinking…</p>}
            {loadError && <p className="text-red-500 text-sm">{loadError}</p>}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-3 z-10">
        <form
          onSubmit={e => { e.preventDefault(); onSend() }}
          className="flex gap-2 max-w-prose mx-auto"
        >
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            placeholder="Type a message…"
            disabled={chatSending}
            className="flex-1 text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={chatSending || !chatInput.trim()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-40 text-sm flex items-center gap-1"
          >
            {chatSending ? <Loader2 size={14} className="animate-spin" /> : 'Send'}
          </button>
        </form>
      </div>
    </>
  )
}
