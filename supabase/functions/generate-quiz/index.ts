// generate-quiz Edge Function
// Generates multiple-choice comprehension questions from a book page.
//
// Request:  { bookId: number, pageNum: number, model?: string }
// Response: { questions: Array<{ question, options, correct, explanation }> }

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
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Quota check
    const { data: quota } = await db.rpc('get_user_quota', { user_uuid: user.id })
    if (quota?.[0] && quota[0].tier === 'free' && quota[0].spend_this_month >= quota[0].spend_limit) {
      return new Response(JSON.stringify({ error: 'Monthly token quota exceeded.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { bookId, pageNum, model = 'gpt-4o-mini', focus = { type: 'page' } } = await req.json()

    // Load book — scoped to user
    const { data: book } = await db
      .from('books')
      .select('*')
      .eq('id', bookId)
      .eq('user_id', user.id)
      .single()

    if (!book) {
      return new Response(JSON.stringify({ error: 'Book not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch book content from storage
    const { data: storageData } = await db.storage.from('books').download(book.file_path)
    if (!storageData) throw new Error('Failed to load book content')

    const fullContent = await storageData.text()
    const pageStart = (pageNum - 1) * book.char_page_length
    const pageText = fullContent.substring(pageStart, pageStart + book.char_page_length)

    // Build source text and focus instruction based on focus type
    let sourceText: string
    let focusInstruction: string

    if (focus.type === 'book') {
      // Sample beginning + middle + current position for broader coverage
      const chunkSize = 3000
      const mid = Math.floor(fullContent.length / 2)
      sourceText = [
        fullContent.substring(0, chunkSize),
        fullContent.substring(mid, mid + chunkSize),
        pageText,
      ].filter(Boolean).join('\n\n---\n\n')
      focusInstruction = 'Generate questions about the overall book — themes, characters, plot arcs, and key ideas across the whole story.'
    } else if (focus.type === 'character') {
      sourceText = pageText
      focusInstruction = `Focus all 5 questions specifically on the character "${focus.value ?? 'the main character'}" — their traits, motivations, actions, and relationships.`
    } else if (focus.type === 'custom') {
      sourceText = pageText
      focusInstruction = `Focus all 5 questions specifically on this topic: "${focus.value ?? 'the content'}".`
    } else if (focus.type === 'node') {
      // Knowledge-graph node quiz: full-book sampling, focused on a specific concept
      const chunkSize = 3000
      const mid = Math.floor(fullContent.length / 2)
      sourceText = [
        fullContent.substring(0, chunkSize),
        fullContent.substring(mid, mid + chunkSize),
        pageText,
      ].filter(Boolean).join('\n\n---\n\n')
      focusInstruction = `Focus all 5 questions on the concept: "${focus.value ?? 'the main topic'}". Test definitions, applications, and relationships to other ideas.`
    } else {
      // 'page' (default)
      sourceText = pageText
      focusInstruction = ''
    }

    if (!sourceText.trim()) {
      return new Response(JSON.stringify({ error: 'No content on this page' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const focusLine = focusInstruction ? `\nFocus: ${focusInstruction}\n` : ''

    const prompt = `You are a reading comprehension quiz generator. Based on the following passage, generate exactly 5 multiple-choice questions that test understanding of the content.
${focusLine}
Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Brief explanation of why this is correct."
    }
  ]
}

Rules:
- Each question must have exactly 4 options
- "correct" is the 0-based index of the correct option
- Questions should be substantive — about plot, characters, concepts, or key details
- Vary difficulty across questions
- Do not reference "the passage" or "the text" in questions

Passage:
${sourceText}`

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    })

    if (!openAIResponse.ok) {
      const err = await openAIResponse.json()
      throw new Error(`OpenAI error: ${err.error?.message || 'Unknown error'}`)
    }

    const openAIData = await openAIResponse.json()
    const usage = openAIData.usage
    const parsed = JSON.parse(openAIData.choices[0].message.content)

    // Log API usage
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
      endpoint_type: 'quiz',
      request_type: 'generate_quiz',
      input_tokens: usage.prompt_tokens,
      output_tokens: usage.completion_tokens,
      base_cost: baseCost,
      markup_multiplier: (pricing?.markup_multiplier ?? 2.0),
      book_id: bookId,
      page_num: pageNum,
    })

    return new Response(JSON.stringify({ questions: parsed.questions ?? [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('generate-quiz error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Quiz generation failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
