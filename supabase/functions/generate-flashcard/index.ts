// generate-flashcard: takes highlighted text from the reader and uses AI to
// create a front/back flashcard, saved to the flashcards table with SM-2 defaults.
//
// Request:  { bookId: number, pageNum: number, sourceText: string, hint?: string }
// Response: { card: Flashcard }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

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

    const { bookId, pageNum, sourceText, hint } = await req.json()

    if (!sourceText?.trim()) {
      return new Response(JSON.stringify({ error: 'sourceText is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Load book title for context
    const { data: book } = await db
      .from('books')
      .select('title, content_type')
      .eq('id', bookId)
      .eq('user_id', user.id)
      .single()

    if (!book) {
      return new Response(JSON.stringify({ error: 'Book not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const systemPrompt = `You are a flashcard generator for students studying "${book.title}".
Given a passage the student has highlighted, create ONE high-quality Anki-style flashcard.

Rules:
- front: a clear question or concept prompt (max 120 chars)
- back: a concise, accurate answer or definition (max 400 chars). Use bullet points for lists. LaTeX math is OK: $...$ inline, $$...$$ display.
- topic_tag: a short topic label (2–4 words, lowercase, e.g. "chain rule", "mitosis", "supply curve")

Respond ONLY with valid JSON: {"front":"...","back":"...","topic_tag":"..."}`

    const userPrompt = hint
      ? `Highlighted text:\n${sourceText}\n\nStudent's hint/focus: ${hint}`
      : `Highlighted text:\n${sourceText}`

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      }),
    })

    if (!aiRes.ok) {
      const err = await aiRes.json()
      throw new Error(err.error?.message || 'OpenAI error')
    }

    const aiData = await aiRes.json()
    const usage = aiData.usage
    let parsed: { front: string; back: string; topic_tag: string }
    try {
      parsed = JSON.parse(aiData.choices[0].message.content)
    } catch {
      throw new Error('Failed to parse AI response')
    }

    // Save flashcard
    const { data: card, error: insertErr } = await db
      .from('flashcards')
      .insert({
        user_id: user.id,
        book_id: bookId,
        page_num: pageNum ?? null,
        source_text: sourceText.slice(0, 2000),
        front: parsed.front,
        back: parsed.back,
        topic_tag: parsed.topic_tag ?? null,
      })
      .select()
      .single()

    if (insertErr) throw new Error(insertErr.message)

    // Log usage
    if (usage) {
      const { data: pricing } = await db
        .from('pricing_config')
        .select('input_cost_per_1m, output_cost_per_1m')
        .eq('model', 'gpt-4o-mini')
        .eq('active', true)
        .single()
      const baseCost = pricing
        ? (usage.prompt_tokens / 1_000_000) * pricing.input_cost_per_1m
          + (usage.completion_tokens / 1_000_000) * pricing.output_cost_per_1m
        : 0
      await db.from('api_usage').insert({
        user_id: user.id,
        api_provider: 'openai',
        model: 'gpt-4o-mini',
        endpoint_type: 'chat',
        request_type: 'flashcard_generation',
        input_tokens: usage.prompt_tokens,
        output_tokens: usage.completion_tokens,
        base_cost: baseCost,
        markup_multiplier: (pricing?.markup_multiplier ?? 2.0),
        book_id: bookId,
        page_num: pageNum ?? null,
      })
    }

    return new Response(JSON.stringify({ card }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('generate-flashcard error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
