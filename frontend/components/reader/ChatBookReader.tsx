import { RefObject, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import { PromptInput } from '../PromptInput'

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
  /**
   * Whether the composer is in use, which is what decides how much of the
   * page it is allowed to take.
   *
   * Held here rather than read from `chatInput` alone because the bar has to
   * stay open while a focused box is empty — see `compactWhenIdle`. The
   * composing height is unchanged; only the resting one moved.
   */
  const [composing, setComposing] = useState(false)
  const open = composing || !!chatInput

  return (
    <>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 5 }} className="bg-gray-50 dark:bg-gray-900">
        {/* Tracks the bar, so the space the composer gives up is space the
            prose gets back. A constant 64 here would have kept the reading
            area exactly as short as before and made the shrink cosmetic. It
            is still a floor and not an exact fit — the bar grows over the
            prose while composing, which is the behaviour the note on the bar
            describes. */}
        <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', paddingBottom: open ? 64 : 44 }}>
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

      {/* The bar is no longer a fixed 64px of one-line input, so the content
          pane's padding-bottom above is a floor rather than an exact fit: the
          bar grows upward over the prose while composing and the last turn
          stays reachable by scrolling. Sized for the common case rather than
          the ten-row one, which is momentary.

          AND IT IS SMALLER WHILE YOU ARE NOT USING IT. Measured at 390px, the
          resting bar was 61px against a ~660px viewport — a tenth of a phone
          screen held permanently by a control that is idle for almost all of
          the time anyone spends on this page, which is a reader. It is 44px
          at rest now and unchanged the moment you touch it.

          The padding is the only thing that moves. Shrinking the TEXT would
          make the thing you are typing harder to read in exchange for the
          same pixels, and a reader that shows you a smaller font the more you
          want to write has the trade backwards. */}
      <div className={`absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-10 px-3 transition-[padding] ${open ? 'py-3' : 'py-1.5'}`}>
        <div className="max-w-prose mx-auto">
          <PromptInput
            value={chatInput}
            onChange={setChatInput}
            onSend={onSend}
            sending={chatSending}
            disabled={chatSending}
            sendLabel="Send"
            compactWhenIdle
            onFocusChange={setComposing}
          />
        </div>
      </div>
    </>
  )
}
