import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken, checkQuota, logUsage } from '@/lib/apiQuota'

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
  const { messages, books, concepts, personaPrompt, model: requestModel, provider: requestProvider }: {
    messages: ChatMessage[]
    books: BookContext[]
    concepts: ConceptContext[]
    personaPrompt?: string
    model?: string
    provider?: 'openai' | 'openrouter'
  } = await req.json()

  if (!messages?.length) return NextResponse.json({ error: 'messages required' }, { status: 400 })

  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (userId) {
    const quotaErr = await checkQuota(userId)
    if (quotaErr) return NextResponse.json({ error: quotaErr }, { status: 429 })
  }

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

${conceptList ? `Relevant concepts from their library:\n${conceptList}\n` : ''}
Help them find connections between books, recall what they've read, explore ideas, and think deeper. When referencing content, cite the book title and page number. Keep responses concise and conversational.`

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
