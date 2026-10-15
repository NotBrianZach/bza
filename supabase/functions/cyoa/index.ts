// CYOA (Choose Your Own Adventure) Edge Function
// Creates branching narrative trees from book content.
//
// POST /cyoa
//   action: 'start'   — start a new CYOA from a book page
//   action: 'choose'  — make a choice, generate next node
//   action: 'history' — get the current session's path
//   action: 'tree'    — get the full story tree (for visualization)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { requireAuth, corsResponse, corsError, CORS_HEADERS } from '../_shared/auth.ts'
import { getDefault } from '../_shared/defaults.ts'

const CYOA_SYSTEM_PROMPT = `You are a masterful creator of interactive branching experiences. You adapt your style to the source material:

- For FICTION: write vivid, immersive narrative where the reader becomes a character making plot choices
- For TEXTBOOKS/MATH: create problem-solving adventures where choices represent different approaches, methods, or strategies. "Do you solve this with integration or substitution?" "Apply Newton's law or energy conservation?"
- For ACADEMIC PAPERS: branch into "what if" explorations of the research. "Investigate this hypothesis further" vs "challenge the methodology" vs "apply this to a different domain"
- For HISTORY/BIOGRAPHY: put the reader in historical shoes making real decisions. "Do you sign the treaty or march to war?"
- For any content: make choices feel meaningful and educational, not arbitrary

RULES:
- Write 150-300 words of compelling content for each beat
- End each beat with exactly 3 choices for the reader
- Choices should be meaningfully different — not just variations of the same thing
- Maintain consistency with everything established so far
- Match the tone of the source material
- Each choice should have real consequences

FORMAT your response EXACTLY like this (the choices MUST be on separate lines at the end):

[Your content here — 150-300 words]

CHOICE_A: [First choice — 5-15 words]
CHOICE_B: [Second choice — different approach, 5-15 words]
CHOICE_C: [Third choice — unexpected option, 5-15 words]

If the story reaches a natural ending, write the conclusion and add:
THE_END

Do NOT use markdown headers, bullet points, or other formatting. Just plain text followed by choices.`

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const { db, userId } = await requireAuth(req)

    // Quota check
    const { data: quota } = await db.rpc('get_user_quota', { user_uuid: userId })
    if (quota?.[0]?.tier !== 'pro' && quota[0]?.spend_this_month >= quota[0]?.spend_limit) {
      return corsError('AI quota reached. Create an account or upgrade to continue.', 429)
    }

    const { action, bookId, pageNum, storyId, choiceIndex, nodeId, model: reqModel } = await req.json()
    const model = reqModel || await getDefault(db, 'chat_model')

    // ── START: Create new CYOA from book page ──
    if (action === 'start') {
      if (!bookId) return corsError('bookId required')

      // Get book + page content
      const { data: book } = await db.from('books').select('*').eq('id', bookId).eq('user_id', userId).single()
      if (!book) return corsError('Book not found', 404)

      let pageContent = ''
      try {
        const { data: storageData } = await db.storage.from('books').download(book.file_path)
        if (storageData) {
          const fullText = await storageData.text()
          const cpl = book.char_page_length || 420
          const start = ((pageNum || 1) - 1) * cpl
          pageContent = fullText.slice(start, start + cpl * 3) // ~3 pages of context
        }
      } catch {}

      // Generate the opening beat
      const systemPrompt = `${CYOA_SYSTEM_PROMPT}

SOURCE MATERIAL from "${book.title}" (page ${pageNum || 1}):
---
${pageContent.slice(0, 3000)}
---

Create an interactive branching story that starts from this point in the book. The reader should feel like they are the protagonist (or a key character). Reimagine this scene as a choice-driven narrative.`

      const aiResult = await callLLM(systemPrompt, 'Begin the adventure. Set the scene and present my first choices.', model)

      // Parse choices from response
      const { narrative, choices, isEnding } = parseResponse(aiResult.content)

      // Create story
      const { data: story } = await db.from('cyoa_stories').insert({
        user_id: userId, book_id: bookId, title: `${book.title} — CYOA`,
        premise: narrative.slice(0, 200), source_page: pageNum || 1, model, status: 'active',
      }).select().single()

      // Create root node
      const { data: rootNode } = await db.from('cyoa_nodes').insert({
        story_id: story!.id, parent_id: null, depth: 0,
        choice_text: null, content: narrative, choices, model, is_ending: isEnding,
      }).select().single()

      // Create session
      await db.from('cyoa_sessions').upsert({
        story_id: story!.id, user_id: userId,
        current_node_id: rootNode!.id, path: [rootNode!.id],
      }, { onConflict: 'story_id,user_id' })

      // Log usage
      if (aiResult.usage) {
        const cost = (aiResult.usage.prompt_tokens / 1e6) * 0.15 + (aiResult.usage.completion_tokens / 1e6) * 0.60
        await db.from('api_usage').insert({
          user_id: userId, api_provider: model.includes('/') ? 'openrouter' : 'openai', model,
          endpoint_type: 'chat', request_type: 'cyoa_generation',
          input_tokens: aiResult.usage.prompt_tokens, output_tokens: aiResult.usage.completion_tokens,
          base_cost: cost, markup_multiplier: 2.0, book_id: bookId,
        })
      }

      return corsResponse({
        story: { id: story!.id, title: story!.title },
        node: { id: rootNode!.id, content: narrative, choices, isEnding, depth: 0 },
      })
    }

    // ── CHOOSE: Make a choice, generate next node ──
    if (action === 'choose') {
      if (!storyId || choiceIndex === undefined) return corsError('storyId and choiceIndex required')

      // Get current node
      const fromNodeId = nodeId || (await db.from('cyoa_sessions')
        .select('current_node_id').eq('story_id', storyId).eq('user_id', userId).single()).data?.current_node_id
      if (!fromNodeId) return corsError('No current node')

      const { data: currentNode } = await db.from('cyoa_nodes')
        .select('*').eq('id', fromNodeId).single()
      if (!currentNode) return corsError('Node not found')

      const chosenChoice = currentNode.choices?.[choiceIndex]
      if (!chosenChoice) return corsError('Invalid choice index')

      // Check if this choice was already explored (existing child node)
      const { data: existingNode } = await db.from('cyoa_nodes')
        .select('*').eq('parent_id', fromNodeId).eq('choice_text', chosenChoice.label).maybeSingle()

      if (existingNode) {
        // Already explored — just navigate there
        const { data: sess } = await db.from('cyoa_sessions').select('path').eq('story_id', storyId).eq('user_id', userId).single()
        await db.from('cyoa_sessions').update({
          current_node_id: existingNode.id,
          path: [...(sess?.path || []), existingNode.id],
        }).eq('story_id', storyId).eq('user_id', userId)

        return corsResponse({
          node: {
            id: existingNode.id, content: existingNode.content,
            choices: existingNode.choices, isEnding: existingNode.is_ending,
            depth: existingNode.depth, choiceText: existingNode.choice_text,
          },
          fromCache: true,
        })
      }

      // Get story context (path so far)
      const { data: story } = await db.from('cyoa_stories').select('*').eq('id', storyId).single()
      const { data: pathNodes } = await db.from('cyoa_nodes')
        .select('content, choice_text, depth')
        .eq('story_id', storyId)
        .in('id', (await db.from('cyoa_sessions').select('path').eq('story_id', storyId).eq('user_id', userId).single()).data?.path || [])
        .order('depth', { ascending: true })

      // Build conversation history for context
      const storyContext = (pathNodes || []).map(n =>
        `${n.choice_text ? `[Choice: ${n.choice_text}]\n` : ''}${n.content}`
      ).join('\n\n---\n\n')

      const systemPrompt = `${CYOA_SYSTEM_PROMPT}

STORY SO FAR:
---
${storyContext.slice(-4000)}
---

Continue the story based on the reader's choice. Maintain consistency with everything that happened before.`

      const aiResult = await callLLM(systemPrompt, `I choose: ${chosenChoice.label}`, model)
      const { narrative, choices, isEnding } = parseResponse(aiResult.content)

      // Create new node
      const { data: newNode } = await db.from('cyoa_nodes').insert({
        story_id: storyId, parent_id: fromNodeId, depth: currentNode.depth + 1,
        choice_text: chosenChoice.label, content: narrative, choices, model, is_ending: isEnding,
      }).select().single()

      // Update session
      const { data: sess2 } = await db.from('cyoa_sessions').select('path').eq('story_id', storyId).eq('user_id', userId).single()
      await db.from('cyoa_sessions').update({
        current_node_id: newNode!.id,
        path: [...(sess2?.path || []), newNode!.id],
      }).eq('story_id', storyId).eq('user_id', userId)

      // Update story node count
      const { data: storyRow } = await db.from('cyoa_stories').select('total_nodes').eq('id', storyId).single()
      await db.from('cyoa_stories').update({
        total_nodes: (storyRow?.total_nodes || 1) + 1,
        updated_at: new Date().toISOString(),
      }).eq('id', storyId)

      // Log usage
      if (aiResult.usage) {
        const cost = (aiResult.usage.prompt_tokens / 1e6) * 0.15 + (aiResult.usage.completion_tokens / 1e6) * 0.60
        await db.from('api_usage').insert({
          user_id: userId, api_provider: model.includes('/') ? 'openrouter' : 'openai', model,
          endpoint_type: 'chat', request_type: 'cyoa_generation',
          input_tokens: aiResult.usage.prompt_tokens, output_tokens: aiResult.usage.completion_tokens,
          base_cost: cost, markup_multiplier: 2.0, book_id: story?.book_id,
        })
      }

      return corsResponse({
        node: {
          id: newNode!.id, content: narrative, choices, isEnding,
          depth: newNode!.depth, choiceText: chosenChoice.label,
        },
      })
    }

    // ── HISTORY: Get session path ──
    if (action === 'history') {
      if (!storyId) return corsError('storyId required')

      const { data: session } = await db.from('cyoa_sessions')
        .select('*').eq('story_id', storyId).eq('user_id', userId).maybeSingle()

      if (!session) return corsResponse({ nodes: [], story: null })

      const { data: nodes } = await db.from('cyoa_nodes')
        .select('id, content, choices, choice_text, depth, is_ending')
        .in('id', session.path || [])
        .order('depth', { ascending: true })

      const { data: story } = await db.from('cyoa_stories')
        .select('id, title, book_id, source_page, total_nodes, status')
        .eq('id', storyId).single()

      return corsResponse({ nodes, story, currentNodeId: session.current_node_id })
    }

    // ── TREE: Get full story tree ──
    if (action === 'tree') {
      if (!storyId) return corsError('storyId required')

      const { data: nodes } = await db.from('cyoa_nodes')
        .select('id, parent_id, choice_text, depth, is_ending, choices')
        .eq('story_id', storyId)
        .order('depth', { ascending: true })

      return corsResponse({ nodes })
    }

    // ── LIST: Get user's CYOA stories ──
    if (action === 'list') {
      const { data: stories } = await db.from('cyoa_stories')
        .select('id, title, book_id, source_page, total_nodes, status, created_at, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(20)

      return corsResponse({ stories })
    }

    return corsError('Unknown action. Use: start, choose, history, tree, list')
  } catch (error: any) {
    console.error('CYOA error:', error)
    return corsError(error.message || 'Internal error', 500)
  }
})

// ── LLM call ──
async function callLLM(system: string, user: string, model: string) {
  const useOpenRouter = model.includes('/')
  const apiUrl = useOpenRouter
    ? 'https://openrouter.ai/api/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions'
  const apiKey = useOpenRouter
    ? Deno.env.get('OPENROUTER_API_KEY')
    : Deno.env.get('OPENAI_API_KEY')

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }
  if (useOpenRouter) {
    headers['HTTP-Referer'] = 'https://aireadalong.com'
    headers['X-Title'] = 'AIReadAlong CYOA'
  }

  const res = await fetch(apiUrl, {
    method: 'POST', headers,
    body: JSON.stringify({
      model, temperature: 0.85, max_tokens: 1500,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`LLM error: ${(err as any).error?.message || res.status}`)
  }

  const data = await res.json()
  return { content: data.choices[0].message.content, usage: data.usage }
}

// ── Parse AI response into narrative + choices ──
function parseResponse(raw: string): {
  narrative: string
  choices: { label: string }[]
  isEnding: boolean
} {
  const isEnding = raw.includes('THE_END')
  const lines = raw.replace('THE_END', '').trim().split('\n')

  const choices: { label: string }[] = []
  const narrativeLines: string[] = []

  for (const line of lines) {
    const choiceMatch = line.match(/^CHOICE_[A-Z]:\s*(.+)/)
    if (choiceMatch) {
      choices.push({ label: choiceMatch[1].trim() })
    } else {
      narrativeLines.push(line)
    }
  }

  return {
    narrative: narrativeLines.join('\n').trim(),
    choices: isEnding ? [] : choices,
    isEnding,
  }
}
