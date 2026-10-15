// build-knowledge-graph Edge Function
// Extracts a topic dependency graph from a book using OpenAI.
//
// Request:  { bookId: number }
// Response: { nodes: KnowledgeNode[], edges: KnowledgeEdge[] }
//
// ── PROVENANCE: recovered from production, not authored here ───────────────
//
// This function was deployed and running (1 of 25 ACTIVE functions on the
// project) with no source anywhere in this repo. The body below was recovered
// from the deployed eszip's sourcemap via the Supabase management API
// (GET /v1/projects/<ref>/functions/build-knowledge-graph/body) and is
// otherwise verbatim — only this comment block was added.
//
// It is committed because the prompt below is load-bearing for anything built
// on `knowledge_edges`. The rule under "Rules:" is what makes those edges
// *prerequisite* edges:
//
//     - Edges: "from" index is PREREQUISITE for "to" index
//     - No cycles allowed
//
// That is the only place that semantics is written down. While this file lived
// solely in production, the meaning of every row in knowledge_edges was
// recoverable only by querying a deploy — so a scheduler could not be reviewed
// against the claim it depends on.
//
// NOTE: "No cycles allowed" is an instruction to a language model, not a
// constraint. The insert below filters self-loops (`e.from !== e.to`) and
// nothing rejects a longer cycle, in this file or in the schema. Any traversal
// over these edges needs its own visited-set.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const db = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    const { data: { user }, error: authError } = await db.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Quota check
    const { data: quota } = await db.rpc('get_user_quota', { user_uuid: user.id })
    if (quota?.[0] && quota[0].tier === 'free' && quota[0].spend_this_month >= quota[0].spend_limit) {
      return new Response(JSON.stringify({ error: 'Monthly token quota exceeded.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { bookId } = await req.json()

    // Load book scoped to user
    const { data: book } = await db
      .from('books')
      .select('*')
      .eq('id', bookId)
      .eq('user_id', user.id)
      .single()

    if (!book) {
      return new Response(JSON.stringify({ error: 'Book not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Load content: beginning + middle sample for broad topic coverage
    const { data: storageData } = await db.storage.from('books').download(book.file_path)
    if (!storageData) throw new Error('Failed to load book content')
    const fullContent = await storageData.text()

    const chunkSize = 4000
    const mid = Math.floor(fullContent.length / 2)
    const sourceText = [
      fullContent.substring(0, chunkSize),
      fullContent.substring(mid, mid + chunkSize),
    ].join('\n\n---\n\n')

    const totalPages = book.total_pages ?? 1
    const charPageLength = book.char_page_length ?? 800

    const prompt = `You are a knowledge graph extractor for academic and educational texts.

Given the following excerpts from "${book.title}", extract 8–15 key concepts/topics and their prerequisite relationships.

Return ONLY valid JSON in this exact format:
{
  "nodes": [
    {
      "label": "Short concept name (2-5 words)",
      "description": "One-sentence definition or explanation.",
      "page_refs": [1, 3, 5]
    }
  ],
  "edges": [
    { "from": 0, "to": 2 }
  ]
}

Rules:
- 8–15 nodes total, each a specific concept or topic from the text
- "label": concise name, 2–5 words
- "description": one clear sentence
- "page_refs": 1-based page numbers (total pages in book: ${totalPages}). Estimate where each topic appears.
- Edges: "from" index is PREREQUISITE for "to" index (must understand A before B)
- Use 0-based indices into the nodes array
- No cycles allowed
- Not every node needs edges — isolated concepts are valid
- Focus on the actual subject matter, not meta-structure like "Introduction" or "References"

Text excerpts:
${sourceText}`

    const model = 'gpt-4o-mini'
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    })

    if (!openAIResponse.ok) {
      const err = await openAIResponse.json()
      throw new Error(`OpenAI error: ${err.error?.message || 'Unknown'}`)
    }

    const openAIData = await openAIResponse.json()
    const usage = openAIData.usage
    const parsed = JSON.parse(openAIData.choices[0].message.content)

    const rawNodes: { label: string; description?: string; page_refs?: number[] }[] = parsed.nodes ?? []
    const rawEdges: { from: number; to: number }[] = parsed.edges ?? []

    // Delete existing graph for this book+user (rebuild)
    const { data: existingNodes } = await db
      .from('knowledge_nodes')
      .select('id')
      .eq('book_id', bookId)
      .eq('user_id', user.id)

    if (existingNodes && existingNodes.length > 0) {
      const ids = existingNodes.map((n: any) => n.id)
      await db.from('knowledge_edges').delete().in('from_node', ids)
      await db.from('knowledge_nodes').delete().eq('book_id', bookId).eq('user_id', user.id)
    }

    // Insert nodes sequentially to preserve index order for edge mapping
    const insertedIds: number[] = []
    for (const node of rawNodes) {
      const { data: inserted, error: nodeErr } = await db
        .from('knowledge_nodes')
        .insert({
          book_id: bookId,
          user_id: user.id,
          label: node.label,
          description: node.description ?? null,
          page_refs: node.page_refs ?? [],
        })
        .select('id')
        .single()
      if (nodeErr || !inserted) continue
      insertedIds.push(inserted.id)
    }

    // Insert edges using real node IDs
    const edgeRows = rawEdges
      .filter(e => e.from >= 0 && e.from < insertedIds.length && e.to >= 0 && e.to < insertedIds.length && e.from !== e.to)
      .map(e => ({
        book_id: bookId,
        from_node: insertedIds[e.from],
        to_node: insertedIds[e.to],
      }))

    if (edgeRows.length > 0) {
      await db.from('knowledge_edges').insert(edgeRows)
    }

    // Log usage
    const { data: pricing } = await db
      .from('pricing_config')
      .select('*')
      .eq('model', model)
      .eq('active', true)
      .single()

    let baseCost = 0
    if (pricing) {
      baseCost =
        (usage.prompt_tokens / 1_000_000) * pricing.input_cost_per_1m +
        (usage.completion_tokens / 1_000_000) * pricing.output_cost_per_1m
    }

    await db.from('api_usage').insert({
      user_id: user.id,
      api_provider: 'openai',
      model,
      endpoint_type: 'knowledge_graph',
      request_type: 'build_knowledge_graph',
      input_tokens: usage.prompt_tokens,
      output_tokens: usage.completion_tokens,
      base_cost: baseCost,
      markup_multiplier: (pricing?.markup_multiplier ?? 2.0),
      book_id: bookId,
    })

    // Return freshly inserted data
    const { data: finalNodes } = await db
      .from('knowledge_nodes')
      .select('*')
      .eq('book_id', bookId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    const { data: finalEdges } = await db
      .from('knowledge_edges')
      .select('*')
      .eq('book_id', bookId)

    return new Response(JSON.stringify({
      nodes: finalNodes ?? [],
      edges: finalEdges ?? [],
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err: any) {
    console.error('build-knowledge-graph error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Failed to build knowledge graph' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
