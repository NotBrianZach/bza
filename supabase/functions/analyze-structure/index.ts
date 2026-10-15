// Analyze Structure Edge Function
// Builds a running table of contents and key concept index for textbooks
// and academic papers, relating each page to the broader work.
// Incremental: only processes pages the reader has newly reached.
//
// Fixes applied:
// - 50-page cap per request (prevents timeout)
// - Deduplicates concept history before inserting
// - Handles null char_page_length gracefully
// - Batched DB writes

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CHUNK_SIZE = 5
const MAX_CHUNK_CHARS = 5000
const MAX_PAGES_PER_CALL = 50

interface AnalyzeRequest {
  bookId: number
  currentPage: number
  forceRestart?: boolean
}

interface StructureExtraction {
  sections: Array<{ title: string; section_type: string; level: number; page_num: number; summary: string }>
  concepts: Array<{ term: string; concept_type: string; explanation: string }>
  page_context: string
}

const PROMPTS: Record<string, (knownStructure: string, knownConcepts: string, pageRange: string, currentPage: number) => string> = {
  textbook: (knownStructure, knownConcepts, pageRange, currentPage) => `
You are analyzing a textbook for a reader who has reached page ${currentPage}.
Only analyze what is visible in this chunk — do not infer or reveal future content.

Known structure so far:
${knownStructure || 'None yet.'}

Known concepts so far:
${knownConcepts || 'None yet.'}

For the text chunk (${pageRange}), extract:

SECTIONS: Any chapter, section, or subsection headings that appear. For each:
- title: the heading text
- section_type: one of: chapter, section, subsection, abstract, introduction, methods, results, discussion, conclusion, appendix
- level: 1 for chapter, 2 for section, 3 for subsection
- page_num: the page it starts on
- summary: 1-2 sentence description

CONCEPTS: Key terms, definitions, theorems, algorithms, figures, or tables introduced. For each:
- term: the name of the concept
- concept_type: one of: concept, definition, theorem, lemma, equation, algorithm, figure, table, example
- explanation: plain-language explanation

PAGE_CONTEXT: A 2-3 sentence explanation of how this chunk fits into the broader work.

Return ONLY valid JSON:
{"sections": [...], "concepts": [...], "page_context": "..."}`,

  academic_paper: (knownStructure, knownConcepts, pageRange, currentPage) => `
You are analyzing an academic paper for a reader who has reached page ${currentPage}.
Only analyze what is visible in this chunk — do not infer or reveal future content.

Known structure so far:
${knownStructure || 'None yet.'}

Known concepts/results so far:
${knownConcepts || 'None yet.'}

For the text chunk (${pageRange}), extract:

SECTIONS: Paper sections that appear. For each:
- title: section heading
- section_type: one of: abstract, introduction, related_work, background, methods, results, discussion, conclusion, references, appendix
- level: 1 for main sections, 2 for subsections
- page_num: starting page
- summary: what this section establishes

CONCEPTS: Key results, theorems, definitions, equations, figures, tables, or cited works. For each:
- term: name or short label
- concept_type: one of: theorem, lemma, definition, equation, algorithm, figure, table, citation, concept
- explanation: what this result/item says, in plain language

PAGE_CONTEXT: 2-3 sentences on what part of the paper's argument this chunk covers.

Return ONLY valid JSON:
{"sections": [...], "concepts": [...], "page_context": "..."}`,
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
    if (authError || !user) throw new Error('Unauthorized')

    const { data: quota } = await db.rpc('get_user_quota', { user_uuid: user.id })
    if (quota?.[0] && quota[0].tier === 'free' && quota[0].spend_this_month >= quota[0].spend_limit) {
      return new Response(JSON.stringify({ error: 'Monthly token quota exceeded.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { bookId, currentPage, forceRestart = false }: AnalyzeRequest = await req.json()

    const { data: book } = await db
      .from('books').select('*').eq('id', bookId).eq('user_id', user.id).single()
    if (!book) throw new Error('Book not found')

    const contentType: string = book.content_type || 'fiction'
    if (contentType === 'fiction' || contentType === 'biography') {
      return new Response(
        JSON.stringify({ error: 'Structure analysis is for textbooks and papers. Use character analysis for fiction/biography.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const effectiveType = contentType === 'math_textbook' ? 'textbook' : contentType
    const promptFn = PROMPTS[effectiveType]
    if (!promptFn) throw new Error(`Unsupported content type: ${contentType}`)

    // Determine incremental range with cap
    const { data: latestStructure } = await db
      .from('book_structure').select('last_analyzed_page')
      .eq('book_id', bookId).eq('user_id', user.id)
      .order('last_analyzed_page', { ascending: false }).limit(1)

    const alreadyAnalyzed = forceRestart ? 0 : (latestStructure?.[0]?.last_analyzed_page ?? 0)
    const startPage = alreadyAnalyzed + 1
    const endPage = Math.min(startPage + MAX_PAGES_PER_CALL - 1, currentPage, book.total_pages)

    // Return cached data if nothing new
    if (startPage > endPage) {
      const [{ data: structure }, { data: concepts }] = await Promise.all([
        db.from('book_structure').select('*').eq('book_id', bookId).eq('user_id', user.id)
          .lte('page_num', currentPage).order('page_num', { ascending: true }),
        db.from('key_concepts').select('*').eq('book_id', bookId).eq('user_id', user.id)
          .lte('first_page', currentPage).order('first_page', { ascending: true }),
      ])
      return new Response(
        JSON.stringify({ structure: structure || [], concepts: concepts || [], pageContext: null, pagesAnalyzed: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const model = 'gpt-4o-mini'
    const { data: pricing } = await db
      .from('pricing_config').select('*').eq('model', model).eq('active', true).single()

    const { data: storageData } = await db.storage.from('books').download(book.file_path)
    if (!storageData) throw new Error('Failed to load book content')
    const fullContent = await storageData.text()
    const charPageLength = book.char_page_length ?? Math.ceil(fullContent.length / (book.total_pages || 1))

    // Load existing structure and concepts for context
    const [{ data: existingStructure }, { data: existingConcepts }] = await Promise.all([
      db.from('book_structure').select('title, section_type, page_num, summary')
        .eq('book_id', bookId).eq('user_id', user.id).order('page_num', { ascending: true }),
      db.from('key_concepts').select('term, concept_type, explanation')
        .eq('book_id', bookId).eq('user_id', user.id).order('first_page', { ascending: true }),
    ])

    let totalTokens = 0
    let totalBaseCost = 0
    const usageLogs: any[] = []
    const newSections: any[] = []
    const updatedConcepts = new Map<string, any>()
    let lastPageContext = ''

    for (let pageNum = startPage; pageNum <= endPage; pageNum += CHUNK_SIZE) {
      const chunkEnd = Math.min(pageNum + CHUNK_SIZE - 1, endPage)
      const chunkText = fullContent.substring(
        (pageNum - 1) * charPageLength,
        chunkEnd * charPageLength
      )
      if (!chunkText.trim()) continue

      const knownStructure = (existingStructure || []).concat(newSections)
        .map(s => `- ${s.title} (${s.section_type}, p.${s.page_num}): ${s.summary || ''}`)
        .join('\n')

      const knownConcepts = [...(existingConcepts || []), ...updatedConcepts.values()]
        .map(c => `- ${c.term} (${c.concept_type}): ${c.explanation || ''}`)
        .slice(-20)
        .join('\n')

      const systemPrompt = promptFn(knownStructure, knownConcepts, `pages ${pageNum}–${chunkEnd}`, currentPage)

      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Text chunk:\n\n${chunkText.substring(0, MAX_CHUNK_CHARS)}` }
          ],
          temperature: 0.2,
          max_tokens: 1500,
        }),
      })

      if (!openAIResponse.ok) {
        console.error('OpenAI error pages', pageNum, '-', chunkEnd, await openAIResponse.text())
        continue
      }

      const openAIData = await openAIResponse.json()
      const responseText = openAIData.choices[0].message.content
      const usage = openAIData.usage

      totalTokens += usage.total_tokens
      const chunkCost =
        (usage.prompt_tokens / 1_000_000) * (pricing?.input_cost_per_1m || 0) +
        (usage.completion_tokens / 1_000_000) * (pricing?.output_cost_per_1m || 0)
      totalBaseCost += chunkCost

      let extraction: StructureExtraction = { sections: [], concepts: [], page_context: '' }
      try {
        const cleaned = responseText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
        extraction = JSON.parse(cleaned)
      } catch {
        console.error('JSON parse error pages', pageNum, '-', chunkEnd)
        continue
      }

      for (const sec of extraction.sections || []) {
        if (!sec.title) continue
        newSections.push({ ...sec, last_analyzed_page: chunkEnd })
      }

      for (const concept of extraction.concepts || []) {
        if (!concept.term) continue
        const key = concept.term.toLowerCase()
        const prev = updatedConcepts.get(key)
        updatedConcepts.set(key, {
          term: concept.term,
          concept_type: concept.concept_type || 'concept',
          explanation: concept.explanation,
          firstPage: prev?.firstPage ?? pageNum,
          lastPage: chunkEnd,
          explanationHistory: [
            ...(prev?.explanationHistory || []),
            { pageNum: chunkEnd, explanation: concept.explanation },
          ],
        })
      }

      if (extraction.page_context) lastPageContext = extraction.page_context

      usageLogs.push({
        user_id: user.id, api_provider: 'openai', model,
        endpoint_type: 'chat', request_type: 'structure_analysis',
        input_tokens: usage.prompt_tokens, output_tokens: usage.completion_tokens,
        base_cost: chunkCost, markup_multiplier: (pricing?.markup_multiplier ?? 2.0),
        book_id: bookId, page_num: pageNum,
        request_metadata: {
          page_range: `${pageNum}-${chunkEnd}`,
          sections_found: (extraction.sections || []).length,
          concepts_found: (extraction.concepts || []).length,
        },
      })
    }

    // Batch insert usage logs
    if (usageLogs.length > 0) await db.from('api_usage').insert(usageLogs)

    // Clear stale history on force-restart
    if (forceRestart) {
      await db.from('concept_explanation_history').delete()
        .eq('book_id', bookId).eq('user_id', user.id)
    }

    // Persist sections — check for existing by title+page_num to avoid duplicates
    for (const sec of newSections) {
      const { data: existing } = await db
        .from('book_structure').select('id')
        .eq('user_id', user.id).eq('book_id', bookId)
        .eq('title', sec.title).eq('page_num', sec.page_num)
        .maybeSingle()

      if (existing) {
        await db.from('book_structure')
          .update({ summary: sec.summary, last_analyzed_page: sec.last_analyzed_page })
          .eq('id', existing.id)
      } else {
        await db.from('book_structure').insert({
          user_id: user.id, book_id: bookId,
          title: sec.title, section_type: sec.section_type,
          level: sec.level || 1, page_num: sec.page_num,
          summary: sec.summary, last_analyzed_page: sec.last_analyzed_page,
        })
      }
    }

    // Persist concepts and deduplicated history
    const allHistory: any[] = []
    for (const [, c] of updatedConcepts) {
      const { data: existing } = await db
        .from('key_concepts').select('id')
        .eq('user_id', user.id).eq('book_id', bookId).eq('term', c.term)
        .maybeSingle()

      let conceptId: number | null = null
      if (existing) {
        await db.from('key_concepts')
          .update({ explanation: c.explanation, last_page: c.lastPage })
          .eq('id', existing.id)
        conceptId = existing.id
      } else {
        const { data: inserted } = await db.from('key_concepts').insert({
          user_id: user.id, book_id: bookId,
          term: c.term, concept_type: c.concept_type,
          explanation: c.explanation,
          first_page: c.firstPage, last_page: c.lastPage,
        }).select('id').single()
        conceptId = inserted?.id ?? null
      }

      if (conceptId) {
        for (const snap of c.explanationHistory || []) {
          allHistory.push({
            concept_id: conceptId, user_id: user.id, book_id: bookId,
            page_num: snap.pageNum, explanation: snap.explanation,
          })
        }
      }
    }

    // Batch insert history with dedup (delete existing for same concept+page first)
    if (allHistory.length > 0) {
      for (const h of allHistory) {
        await db.from('concept_explanation_history').delete()
          .eq('concept_id', h.concept_id).eq('page_num', h.page_num)
      }
      await db.from('concept_explanation_history').insert(allHistory)
    }

    // Return full structure up to currentPage
    const [{ data: structure }, { data: concepts }] = await Promise.all([
      db.from('book_structure').select('*').eq('book_id', bookId).eq('user_id', user.id)
        .lte('page_num', currentPage).order('page_num', { ascending: true }),
      db.from('key_concepts').select('*').eq('book_id', bookId).eq('user_id', user.id)
        .lte('first_page', currentPage).order('first_page', { ascending: true }),
    ])

    return new Response(
      JSON.stringify({
        structure: structure || [],
        concepts: concepts || [],
        pageContext: lastPageContext,
        pagesAnalyzed: { start: startPage, end: endPage },
        hasMore: endPage < currentPage,
        usage: { totalTokens, totalBaseCost, totalChargedCost: totalBaseCost * 2 },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
