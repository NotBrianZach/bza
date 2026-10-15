// Analyze Characters Edge Function
// Context-aware: only analyzes pages the reader has reached.
// Uses chain-of-thought reasoning, maintains per-character summaries,
// and supports incremental analysis (only processes new pages since last run).
//
// Fixes applied:
// - Deduplicates mentions/summary history before inserting
// - Batches DB writes
// - 50-page cap per request
// - Handles null char_page_length gracefully

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CHUNK_SIZE = 5
const MAX_CHUNK_CHARS = 4000
const MAX_PAGES_PER_CALL = 50

interface AnalyzeRequest {
  bookId: number
  currentPage: number
  forceRestart?: boolean
}

interface CharacterExtraction {
  name: string
  type: 'person' | 'animal' | 'entity' | 'group'
  reasoning: string
  evidence: string
  summary_update: string
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

    // Determine incremental range
    const { data: existingChars } = await db
      .from('characters').select('last_analyzed_page')
      .eq('book_id', bookId).eq('user_id', user.id)
      .order('last_analyzed_page', { ascending: false }).limit(1)

    const alreadyAnalyzed = forceRestart ? 0 : (existingChars?.[0]?.last_analyzed_page ?? 0)
    const startPage = alreadyAnalyzed + 1
    const endPage = Math.min(startPage + MAX_PAGES_PER_CALL - 1, currentPage, book.total_pages)

    // Nothing new to analyze — return cached
    if (startPage > endPage) {
      const chars = await db
        .from('characters').select('*, character_mentions(page_num, evidence)')
        .eq('book_id', bookId).eq('user_id', user.id)
        .lte('first_page', currentPage).order('first_page', { ascending: true })
      return new Response(
        JSON.stringify({ characters: chars.data || [], pagesAnalyzed: null, hasMore: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const model = 'gpt-4o-mini'
    const { data: pricing } = await db
      .from('pricing_config').select('*').eq('model', model).eq('active', true).single()

    // Download book content
    const { data: storageData } = await db.storage.from('books').download(book.file_path)
    if (!storageData) throw new Error('Failed to load book content')
    const fullContent = await storageData.text()
    const charPageLength = book.char_page_length ?? Math.ceil(fullContent.length / (book.total_pages || 1))

    // Load existing character summaries for context
    const { data: existingCharData } = await db
      .from('characters').select('id, name, type, summary, last_analyzed_page')
      .eq('book_id', bookId).eq('user_id', user.id)

    const charMap = new Map<string, any>(
      (existingCharData || []).map(c => [c.name.toLowerCase(), c])
    )

    // Load existing mentions to deduplicate
    const existingMentionKeys = new Set<string>()
    const { data: existingMentions } = await db
      .from('character_mentions').select('character_id, page_num')
      .in('character_id', (existingCharData || []).map(c => c.id))
    for (const m of existingMentions || []) {
      existingMentionKeys.add(`${m.character_id}:${m.page_num}`)
    }

    let totalTokens = 0
    let totalBaseCost = 0
    const usageLogs: any[] = []
    const updatedCharacters = new Map<string, any>()

    for (let pageNum = startPage; pageNum <= endPage; pageNum += CHUNK_SIZE) {
      const chunkEnd = Math.min(pageNum + CHUNK_SIZE - 1, endPage)
      const chunkStart = (pageNum - 1) * charPageLength
      const chunkEndPos = chunkEnd * charPageLength
      const chunkText = fullContent.substring(chunkStart, chunkEndPos)

      if (!chunkText.trim()) continue

      const knownCharsSummary = charMap.size > 0
        ? 'Characters identified so far:\n' + [...charMap.values()]
            .map(c => `- ${c.name}: ${c.summary || 'no summary yet'}`)
            .join('\n')
        : 'No characters identified yet.'

      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: `You are a literary analyst helping a reader track characters as they read. You only know about the pages the reader has reached — never reveal information from later in the book.

${knownCharsSummary}

For the new text chunk below (pages ${pageNum}–${chunkEnd}), identify characters using these strict rules:

INCLUDE a character only if they:
- Are an active participant in the narrative (they act, speak, think, or are directly encountered)
- Appear in the fiction/content, not in surrounding editorial text

EXCLUDE:
- Real-world authors, editors, translators mentioned in prefaces/introductions
- Characters only name-dropped in editorial context
- Historical figures mentioned in non-narrative context
- If the chunk is a preface, introduction, or translator's note, return an empty array []

For each included character:
1. Note the exact evidence (a direct quote or action) proving they appear.
2. Write brief reasoning for why they qualify.
3. Write a cumulative summary of what the reader now knows about them after page ${chunkEnd}.

Return ONLY a JSON array:
[{"name": string, "type": "person"|"animal"|"entity"|"group", "reasoning": string, "evidence": string, "summary_update": string}]
No markdown, no extra text.`
            },
            { role: 'user', content: `Pages ${pageNum}–${chunkEnd}:\n\n${chunkText.substring(0, MAX_CHUNK_CHARS)}` }
          ],
          temperature: 0.2,
          max_tokens: 1200,
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

      let extractions: CharacterExtraction[] = []
      try {
        const cleaned = responseText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
        extractions = JSON.parse(cleaned)
        if (!Array.isArray(extractions)) extractions = []
      } catch {
        console.error('JSON parse error for pages', pageNum, '-', chunkEnd)
        continue
      }

      for (const ext of extractions) {
        if (!ext.name) continue
        const key = ext.name.toLowerCase()
        const existing = updatedCharacters.get(key) || charMap.get(key)

        updatedCharacters.set(key, {
          name: ext.name,
          type: ext.type || 'person',
          reasoning: ext.reasoning,
          summary: ext.summary_update,
          firstPage: existing?.first_page ?? existing?.firstPage ?? pageNum,
          lastPage: chunkEnd,
          lastAnalyzedPage: chunkEnd,
          mentions: [...(existing?.mentions || []), { pageNum, pageEnd: chunkEnd, evidence: ext.evidence }],
          summaryHistory: [
            ...(existing?.summaryHistory || []),
            { pageNum: chunkEnd, summary: ext.summary_update },
          ],
        })

        charMap.set(key, { ...(charMap.get(key) || {}), name: ext.name, summary: ext.summary_update })
      }

      usageLogs.push({
        user_id: user.id, api_provider: 'openai', model,
        endpoint_type: 'chat', request_type: 'character_analysis',
        input_tokens: usage.prompt_tokens, output_tokens: usage.completion_tokens,
        base_cost: chunkCost, markup_multiplier: (pricing?.markup_multiplier ?? 2.0),
        book_id: bookId, page_num: pageNum,
        request_metadata: { page_range: `${pageNum}-${chunkEnd}`, characters_found: extractions.length },
      })
    }

    // Batch insert usage logs
    if (usageLogs.length > 0) await db.from('api_usage').insert(usageLogs)

    // Clear stale history on force-restart
    if (forceRestart) {
      await db.from('character_summary_history').delete()
        .eq('book_id', bookId).eq('user_id', user.id)
      await db.from('character_mentions').delete()
        .in('character_id', (existingCharData || []).map(c => c.id))
      existingMentionKeys.clear()
    }

    // Persist characters, mentions, and summary history
    const allMentions: any[] = []
    const allHistory: any[] = []

    for (const [, charData] of updatedCharacters) {
      const { data: existing } = await db
        .from('characters').select('id')
        .eq('user_id', user.id).eq('book_id', bookId).eq('name', charData.name)
        .maybeSingle()

      let charId: number
      if (existing) {
        await db.from('characters').update({
          type: charData.type, summary: charData.summary, reasoning: charData.reasoning,
          last_page: charData.lastPage, last_analyzed_page: charData.lastAnalyzedPage,
        }).eq('id', existing.id)
        charId = existing.id
      } else {
        const { data: inserted, error } = await db.from('characters').insert({
          user_id: user.id, book_id: bookId, name: charData.name, type: charData.type,
          summary: charData.summary, reasoning: charData.reasoning,
          first_page: charData.firstPage, last_page: charData.lastPage,
          last_analyzed_page: charData.lastAnalyzedPage,
        }).select('id').single()
        if (error || !inserted) { console.error('Character insert failed:', charData.name, error?.message); continue }
        charId = inserted.id
      }

      // Deduplicate mentions
      for (const mention of charData.mentions) {
        const key = `${charId}:${mention.pageNum}`
        if (!existingMentionKeys.has(key)) {
          allMentions.push({ user_id: user.id, character_id: charId, page_num: mention.pageNum, evidence: mention.evidence })
          existingMentionKeys.add(key)
        }
      }

      // Deduplicate summary history (one per character per page)
      for (const snap of charData.summaryHistory || []) {
        allHistory.push({ character_id: charId, user_id: user.id, book_id: bookId, page_num: snap.pageNum, summary: snap.summary })
      }
    }

    // Batch insert mentions and history
    if (allMentions.length > 0) await db.from('character_mentions').insert(allMentions)
    if (allHistory.length > 0) {
      // Use upsert-style: delete existing for these pages first, then insert
      for (const h of allHistory) {
        await db.from('character_summary_history').delete()
          .eq('character_id', h.character_id).eq('page_num', h.page_num)
      }
      await db.from('character_summary_history').insert(allHistory)
    }

    // Return full character list up to currentPage
    const { data: allChars } = await db
      .from('characters').select('*, character_mentions(page_num, evidence)')
      .eq('book_id', bookId).eq('user_id', user.id)
      .lte('first_page', currentPage).order('first_page', { ascending: true })

    return new Response(
      JSON.stringify({
        characters: allChars || [],
        usage: { totalTokens, totalBaseCost, totalChargedCost: totalBaseCost * 2 },
        pagesAnalyzed: { start: startPage, end: endPage },
        hasMore: endPage < currentPage,
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
