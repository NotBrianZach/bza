import { NextRequest } from 'next/server'
import { getUserFromToken, checkQuota, logUsage } from '@/lib/apiQuota'

/**
 * Streaming chat API route for book conversations.
 * Uses OpenRouter with SSE streaming. Book context is passed by the client.
 *
 * POST body: { messages, bookTitle, pageContent, model?, personaPrompt? }
 * Returns: SSE stream of content chunks, then a [DONE] sentinel.
 */
export async function POST(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (userId) {
    const quotaErr = await checkQuota(userId)
    if (quotaErr) {
      return new Response(JSON.stringify({ error: quotaErr }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  const {
    messages,
    bookTitle,
    pageContent,
    pageNum,
    model: requestModel,
    personaPrompt,
  } = await req.json()

  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'No API key configured' }), {
      status: 501,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const useOpenRouter = !!process.env.OPENROUTER_API_KEY
  const apiUrl = useOpenRouter
    ? 'https://openrouter.ai/api/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions'
  const modelId = requestModel || (useOpenRouter ? 'anthropic/claude-haiku-4-5' : 'gpt-4o-mini')

  // Build system prompt
  let systemPrompt = `You are a knowledgeable reading companion. You help readers understand, discuss, and explore the book they're reading. Be concise but thorough. Use markdown for formatting.`

  if (personaPrompt) {
    systemPrompt = personaPrompt + '\n\n' + systemPrompt
  }

  if (bookTitle) {
    systemPrompt += `\n\nThe reader is currently reading "${bookTitle}".`
  }

  if (pageContent) {
    systemPrompt += `\n\n--- CURRENT PAGE CONTENT (page ${pageNum ?? '?'}) ---\n${pageContent}\n--- END PAGE CONTENT ---\n\nUse this page content to answer questions about what the reader is currently looking at. Reference specific passages when relevant.`
  }

  // Build message array with system prompt
  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m: any) => ({
      role: m.role,
      content: m.content,
    })),
  ]

  // Call OpenRouter/OpenAI with streaming
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...(useOpenRouter ? {
        'HTTP-Referer': 'https://aireadalong.com',
        'X-Title': 'AI Read Along',
      } : {}),
    },
    body: JSON.stringify({
      model: modelId,
      messages: apiMessages,
      stream: true,
      max_tokens: 2048,
    }),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    return new Response(JSON.stringify({ error: errText || `API error (${response.status})` }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Transform the upstream SSE stream into our own SSE response
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const readable = new ReadableStream({
    async start(controller) {
      const reader = response.body!.getReader()
      let buffer = ''
      let totalContent = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (data === '[DONE]') {
              controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
              continue
            }

            try {
              const parsed = JSON.parse(data)
              const delta = parsed.choices?.[0]?.delta?.content
              if (delta) {
                totalContent += delta
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`)
                )
              }
            } catch {
              // skip malformed chunks
            }
          }
        }

        // Log usage
        if (userId && totalContent) {
          logUsage(userId, modelId, 0, totalContent.length).catch(() => {})
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`)
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
