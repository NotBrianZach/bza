// Generate Discussion Points Edge Function
// Creates AI-generated discussion questions for book pages

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DiscussionRequest {
  bookId: number
  pageNum: number
  numPoints?: number
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Single admin client — new Supabase key format (sb_secret_*) uses ES256;
    // forwarding user JWTs to PostgREST for RLS doesn't work with ES256.
    // We enforce data isolation explicitly via user_id filters on every query.
    const db = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Verify caller identity from JWT
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    const { data: { user }, error: authError } = await db.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Enforce token quota before calling OpenAI
    const { data: quota } = await db.rpc('get_user_quota', { user_uuid: user.id })
    if (quota?.[0] && quota[0].tier === 'free' && quota[0].spend_this_month >= quota[0].spend_limit) {
      return new Response(JSON.stringify({ error: 'Monthly token quota exceeded. Upgrade your plan or wait until next month.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse request
    const { bookId, pageNum, numPoints = 3 }: DiscussionRequest = await req.json()

    // Get book — scoped to this user
    const { data: book } = await db
      .from('books')
      .select('*')
      .eq('id', bookId)
      .eq('user_id', user.id)
      .single()

    if (!book) {
      throw new Error('Book not found')
    }

    // Get page content
    const { data: storageData } = await db.storage
      .from('books')
      .download(book.file_path)

    if (!storageData) {
      throw new Error('Failed to load book content')
    }

    const fullContent = await storageData.text()
    const start = (pageNum - 1) * book.char_page_length
    const end = start + book.char_page_length
    const pageContent = fullContent.substring(start, end)

    if (!pageContent.trim()) {
      throw new Error('Page content is empty')
    }

    // Generate discussion questions using GPT-4o-mini
    const model = 'gpt-4o-mini'
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
            content: `You are a literary discussion facilitator. Generate ${numPoints} thoughtful discussion questions based on the provided text. Focus on comprehension, analysis, and reflection. Return ONLY a JSON array of strings, no additional text.`
          },
          {
            role: 'user',
            content: `Generate ${numPoints} discussion questions for this text:\n\n${pageContent}`
          }
        ],
        temperature: 0.8,
        max_tokens: 500,
      }),
    })

    if (!openAIResponse.ok) {
      const error = await openAIResponse.json()
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`)
    }

    const openAIData = await openAIResponse.json()
    const responseText = openAIData.choices[0].message.content
    const usage = openAIData.usage

    // Parse questions
    let questions: string[] = []
    try {
      questions = JSON.parse(responseText)
    } catch {
      questions = responseText
        .split('\n')
        .map((q: string) => q.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim())
        .filter((q: string) => q.length > 10)
        .slice(0, numPoints)
    }

    // Get pricing for cost calculation
    const { data: pricing } = await db
      .from('pricing_config')
      .select('*')
      .eq('model', model)
      .eq('active', true)
      .single()

    let baseCost = 0
    if (pricing) {
      const inputCost = (usage.prompt_tokens / 1000000) * pricing.input_cost_per_1m
      const outputCost = (usage.completion_tokens / 1000000) * pricing.output_cost_per_1m
      baseCost = inputCost + outputCost
    }

    // Log API usage
    await db
      .from('api_usage')
      .insert({
        user_id: user.id,
        api_provider: 'openai',
        model,
        endpoint_type: 'chat',
        request_type: 'discussion_generation',
        input_tokens: usage.prompt_tokens,
        output_tokens: usage.completion_tokens,
        base_cost: baseCost,
        markup_multiplier: (pricing?.markup_multiplier ?? 2.0),
        book_id: bookId,
        page_num: pageNum,
        request_metadata: { num_questions: questions.length },
      })

    // Save discussion to database — scoped to this user
    await db
      .from('page_discussions')
      .upsert({
        user_id: user.id,
        book_id: bookId,
        page_num: pageNum,
        discussion_text: questions.join('\n'),
      }, {
        onConflict: 'user_id,book_id,page_num'
      })

    return new Response(
      JSON.stringify({
        questions,
        usage: {
          tokens: usage.total_tokens,
          baseCost,
          chargedCost: baseCost * 2.0,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
