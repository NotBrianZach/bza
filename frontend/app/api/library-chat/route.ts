import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken, checkQuota, logUsage } from '@/lib/apiQuota'
import { librarianContext, sectionsNeeded } from '@/lib/librarian/context'

/**
 * The librarian.
 *
 * It began as a chat over the user's books and the concepts extracted from
 * them. Two more things now exist in this app that it could not see: the
 * suggested feed, and the practice state. A reading companion unable to answer
 * "why is this in my feed" or "what should I work on next" is missing the two
 * questions a person would most want to ask it — so both are now in its context,
 * assembled by lib/librarian/context.ts.
 *
 * That module is where the care is. The librarian may only state reasons the
 * scorer, the selector or the practice scheduler already computed; it is told so
 * explicitly, and the context carries the stored explanations rather than
 * regenerating them. The reason that matters: both of those subsystems are built
 * around a refusal to fabricate — a bridge below 0.15 is withheld, a short
 * bucket is reported rather than filled, an unrulable answer is "inconclusive"
 * and never "wrong" — and a chat layer improvising over the top would undo every
 * one of those decisions at the last step, in the layer the user actually reads.
 */

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ConceptContext {
  term: string
  concept_type: string
  explanation?: string
  first_page: number
  bookTitle: string
}

interface BookContext {
  id: number
  title: string
  summary?: string
  content_type?: string
}

export async function POST(req: NextRequest) {
  const {
    messages, books, concepts, personaPrompt,
    model: requestModel, provider: requestProvider,
    includeFeed, includePractice,
  }: {
    messages: ChatMessage[]
    books: BookContext[]
    concepts: ConceptContext[]
    personaPrompt?: string
    model?: string
    provider?: 'openai' | 'openrouter'
    /**
     * Whether to load the feed and practice context.
     *
     * Omitted means DECIDE FROM THE CONVERSATION — `sectionsNeeded` scans the
     * last few messages for feed or practice vocabulary. Loading both on every
     * message costs two rounds of database reads and a meaningful number of
     * tokens, which is not worth paying when somebody is asking about a book.
     *
     * Pass `true` to force a section on (a dedicated feed-side chat entry
     * point would), or `false` to force it off.
     */
    includeFeed?: boolean
    includePractice?: boolean
  } = await req.json()

  if (!messages?.length) return NextResponse.json({ error: 'messages required' }, { status: 400 })

  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (userId) {
    const quotaErr = await checkQuota(userId)
    if (quotaErr) return NextResponse.json({ error: quotaErr }, { status: 429 })
  }

  /**
   * The feed and practice sections, for a signed-in user who asked for them.
   *
   * Failure is swallowed to an empty string HERE and nowhere deeper: the
   * context builder already turns a per-section failure into a sentence saying
   * so, which is what the model needs. This catch only covers the case where
   * the whole builder throws, and in that case the librarian falls back to
   * being a books-only assistant rather than returning an error for a chat
   * message that had nothing to do with either feature.
   */
  const needed = sectionsNeeded(messages)
  const extraContext = userId
    ? await librarianContext(userId, {
        feed: includeFeed ?? needed.feed,
        practice: includePractice ?? needed.practice,
      }).catch(() => '')
    : ''

  const bookList = books.map(b =>
    `- "${b.title}"${b.content_type ? ` (${b.content_type.replace(/_/g, ' ')})` : ''}${b.summary ? `: ${b.summary.slice(0, 200)}` : ''}`
  ).join('\n')

  const conceptList = concepts?.length
    ? concepts.slice(0, 25).map(c =>
        `- ${c.term} [${c.concept_type}] in "${c.bookTitle}" p.${c.first_page}${c.explanation ? `: ${c.explanation}` : ''}`
      ).join('\n')
    : ''

  const personaLine = personaPrompt?.trim() ? `\n\nPERSONALITY: ${personaPrompt.trim()}\n` : ''

  const systemPrompt = `You are a reading assistant helping a user explore and connect ideas across their personal library.${personaLine}

Their library (${books.length} text${books.length !== 1 ? 's' : ''}):
${bookList}

${conceptList ? `Relevant concepts from their library:\n${conceptList}\n` : ''}${extraContext ? `\n${extraContext}\n` : ''}
Help them find connections between books, recall what they've read, explore ideas, and think deeper. When referencing content, cite the book title and page number. Keep responses concise and conversational.

You can also discuss their suggested feed and their maths practice when the sections above are present — including why a particular item appeared, what their feed is or is not covering, and what they are ready to practise or blocked on. Connect the three where there is a real connection: an article that bears on something they are reading, or a feed topic that a concept in their practice would help them read critically. Where there is no real connection, do not manufacture one.`

  const openrouterKey = process.env.OPENROUTER_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY

  const aiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({ role: m.role, content: m.content })),
  ]

  // Determine provider and model from request or defaults
  const useOpenRouter = requestProvider === 'openrouter' ? !!openrouterKey : (requestModel?.includes('/') ? !!openrouterKey : !openaiKey && !!openrouterKey)
  const apiUrl = useOpenRouter ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions'
  const apiKey = useOpenRouter ? openrouterKey : openaiKey
  const modelId = requestModel || (useOpenRouter ? 'anthropic/claude-haiku-4-5' : 'gpt-4o-mini')

  if (!apiKey) return NextResponse.json({ error: 'No AI API key configured' }, { status: 500 })

  let aiRes = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: modelId, max_tokens: 1024, messages: aiMessages }),
  })

  // Fallback: if OpenRouter fails, try OpenAI
  if (!aiRes.ok && useOpenRouter && openaiKey) {
    aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 1024, messages: aiMessages }),
    })
  }

  if (!aiRes.ok) {
    const err = await aiRes.json().catch(() => ({}))
    return NextResponse.json({ error: (err as any)?.error?.message ?? `AI error (${aiRes.status})` }, { status: 500 })
  }

  const data = await aiRes.json()
  const content = data.choices?.[0]?.message?.content ?? ''
  if (userId) logUsage(userId, 0.002, { model: modelId, endpoint: 'library-chat' })
  return NextResponse.json({ content })
}
