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

        // Log usage.
        //
        // This call was `logUsage(userId, modelId, 0, totalContent.length)` — the
        // signature it was written against, (userId, model, inputTokens,
        // outputTokens), no longer exists. logUsage now takes
        // (userId, baseCost, meta), so modelId landed in baseCost and `0` landed
        // in meta, making `meta.model.includes('/')` a TypeError on undefined.
        // logUsage swallows its own exceptions and the call site adds
        // `.catch(() => {})`, so it failed in complete silence: api_usage has no
        // chat row after 2026-07-06, while other endpoints kept logging.
        //
        // That is a quota hole, not just missing telemetry — get_user_quota reads
        // api_usage and checkQuota gates free-tier users on spend_this_month, so
        // chat, the highest-volume endpoint, stopped counting against the limit.
        //
        // The flat estimate is the convention here (library-chat uses 0.002, tts
        // 0.015) because logUsage hardcodes input_tokens/output_tokens to 0 and
        // has nowhere to put a real count. 0.0002 rather than a guess: it is the
        // mean of the 1063 chat rows logged while this worked (0.2007 total).
        //
        // AWAITED, and that is the second half of the bug. Fixing the signature
        // alone changed nothing: this sits immediately before
        // `finally { controller.close() }`, so a fire-and-forget promise is
        // started and the response then completes. On Cloudflare Workers the
        // isolate may be torn down at that point and un-awaited work is simply
        // dropped — there is no ctx.waitUntil registration here to keep it
        // alive. Verified empirically: with the signature fixed but the call
        // still floating, a successful chat request produced no api_usage row.
        //
        // Awaiting delays only the stream's close, not the content — every
        // chunk including [DONE] has already been enqueued by this point, so
        // the client sees the full reply either way.
        //
        // app/api/correlate/turn/route.ts gets away with not awaiting because
        // its call is followed by more awaits inside the handler, which keeps
        // the isolate alive long enough. That is luck rather than design.
        if (userId && totalContent) {
          try {
            await logUsage(userId, 0.0002, { model: modelId, endpoint: 'chat' })
          } catch {
            // Usage logging must never fail a reply the user already received.
          }
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
