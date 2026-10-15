// Library Ontology & Clustering Edge Function
// Analyzes user's library to generate topic ontology and book clusters.
//
// POST /library-ontology
//   action: 'generate'  — AI-generate ontology + clusters from library
//   action: 'get'       — retrieve cached ontology

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { requireAuth, corsResponse, corsError, CORS_HEADERS } from '../_shared/auth.ts'
import { getDefault } from '../_shared/defaults.ts'

const ONTOLOGY_PROMPT = `You are a knowledge organization expert. Analyze this library of books/texts and produce:

1. **ONTOLOGY**: A hierarchical topic tree that covers all the books. Each node has a label and optional description. Aim for 3-4 levels deep, 5-15 top-level categories. Every book should map to at least one leaf node.

2. **CLUSTERS**: Group the books into 4-12 natural clusters based on topic similarity. Each cluster has a label, description, and list of book IDs. A book can appear in multiple clusters if it bridges topics.

3. **CONNECTIONS**: Notable connections between books — where one book's content builds on, contradicts, complements, or extends another. List the most interesting 5-15 connections.

Return valid JSON:
{
  "ontology": {
    "label": "Library",
    "children": [
      {
        "label": "Mathematics",
        "description": "Pure and applied math",
        "children": [
          { "label": "Number Theory", "book_ids": [1, 5] },
          { "label": "Linear Algebra", "book_ids": [3] }
        ]
      },
      ...
    ]
  },
  "clusters": [
    { "id": 1, "label": "Foundations of Math", "description": "...", "book_ids": [1, 3, 5], "color": "blue" },
    ...
  ],
  "connections": [
    { "from_book_id": 1, "to_book_id": 5, "relationship": "extends", "description": "Book A's group theory chapter builds on concepts from Book B" },
    ...
  ]
}

Return ONLY the JSON, no other text.`

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const { db, userId } = await requireAuth(req)
    const { action } = await req.json()

    // ── GET: Return cached ontology ──
    if (action === 'get') {
      const { data } = await db.from('app_config')
        .select('value')
        .eq('key', `ontology:${userId}`)
        .maybeSingle()

      return corsResponse({ ontology: data?.value || null })
    }

    // ── GENERATE: Build ontology from library ──
    if (action === 'generate') {
      // Quota check
      const { data: quota } = await db.rpc('get_user_quota', { user_uuid: userId })
      if (quota?.[0]?.tier !== 'pro' && quota[0]?.spend_this_month >= quota[0]?.spend_limit) {
        return corsError('AI quota reached', 429)
      }

      // Get all user's books
      const { data: books } = await db.from('books')
        .select('id, title, content_type, summary, total_pages')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('title')

      if (!books?.length) return corsError('No books in library')

      // Also get existing concepts for richer analysis
      const { data: concepts } = await db.from('key_concepts')
        .select('term, concept_type, book_id, explanation')
        .eq('user_id', userId)
        .order('book_id')
        .limit(200)

      // Build context
      const bookList = books.map(b =>
        `[ID:${b.id}] "${b.title}" (${b.content_type || 'unknown'}, ${b.total_pages}p)${b.summary ? ` — ${b.summary.slice(0, 100)}` : ''}`
      ).join('\n')

      const conceptList = (concepts || []).map(c =>
        `  - ${c.term} (${c.concept_type}) in book ${c.book_id}`
      ).join('\n')

      const userPrompt = `Here are all ${books.length} books in my library:\n\n${bookList}\n\n${conceptList ? `Known concepts across these books:\n${conceptList.slice(0, 3000)}\n\n` : ''}Generate the ontology, clusters, and connections.`

      const model = await getDefault(db, 'analysis_model')
      const useOpenRouter = model.includes('/')
      const apiUrl = useOpenRouter ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions'
      const apiKey = useOpenRouter ? Deno.env.get('OPENROUTER_API_KEY') : Deno.env.get('OPENAI_API_KEY')
      const headers: Record<string, string> = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
      if (useOpenRouter) { headers['HTTP-Referer'] = 'https://aireadalong.com' }

      const res = await fetch(apiUrl, {
        method: 'POST', headers,
        body: JSON.stringify({
          model, temperature: 0.4, max_tokens: 4000,
          messages: [
            { role: 'system', content: ONTOLOGY_PROMPT },
            { role: 'user', content: userPrompt },
          ],
        }),
      })

      if (!res.ok) throw new Error(`LLM error: ${res.status}`)
      const data = await res.json()
      const raw = data.choices?.[0]?.message?.content || '{}'

      // Parse JSON
      let result: any = {}
      try {
        let clean = raw.trim()
        const fenceMatch = clean.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (fenceMatch) clean = fenceMatch[1].trim()
        if (!clean.startsWith('{')) {
          const objStart = clean.indexOf('{')
          if (objStart >= 0) clean = clean.slice(objStart)
        }
        result = JSON.parse(clean)
      } catch { result = { error: 'Failed to parse ontology', raw: raw.slice(0, 500) } }

      // Enrich with book titles
      const bookMap = new Map(books.map(b => [b.id, b.title]))
      if (result.clusters) {
        for (const cluster of result.clusters) {
          cluster.books = (cluster.book_ids || []).map((id: number) => ({ id, title: bookMap.get(id) || `Book ${id}` }))
        }
      }
      if (result.connections) {
        for (const conn of result.connections) {
          conn.from_title = bookMap.get(conn.from_book_id) || `Book ${conn.from_book_id}`
          conn.to_title = bookMap.get(conn.to_book_id) || `Book ${conn.to_book_id}`
        }
      }

      result.generated_at = new Date().toISOString()
      result.book_count = books.length

      // Cache in app_config (user-scoped key)
      await db.from('app_config').upsert({
        key: `ontology:${userId}`,
        value: result,
        description: `Library ontology for ${books.length} books`,
      }, { onConflict: 'key' })

      // Log usage
      if (data.usage) {
        const cost = (data.usage.prompt_tokens / 1e6) * 0.15 + (data.usage.completion_tokens / 1e6) * 0.60
        await db.from('api_usage').insert({
          user_id: userId, api_provider: useOpenRouter ? 'openrouter' : 'openai', model,
          endpoint_type: 'chat', request_type: 'library_ontology',
          input_tokens: data.usage.prompt_tokens, output_tokens: data.usage.completion_tokens,
          base_cost: cost, markup_multiplier: 2.0,
        }).catch(() => {})
      }

      return corsResponse({ ontology: result })
    }

    return corsError('Unknown action. Use: generate, get')
  } catch (error: any) {
    console.error('ontology error:', error)
    return corsError(error.message || 'Internal error', 500)
  }
})
