// Suggest Character Merges Edge Function
// Uses AI to identify likely duplicate characters that should be merged.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { getDefault } from '../_shared/defaults.ts'

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
    if (authError || !user) throw new Error('Unauthorized')

    const { bookId }: { bookId: number } = await req.json()

    // Fetch all characters for this book
    const { data: characters, error: charError } = await db
      .from('characters')
      .select('id, name, type, summary, aliases, first_page, last_page')
      .eq('book_id', bookId)
      .eq('user_id', user.id)
      .order('first_page', { ascending: true })

    if (charError) throw charError
    if (!characters || characters.length < 2) {
      return new Response(
        JSON.stringify({ suggestions: [], message: 'Need at least 2 characters to suggest merges.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const model = await getDefault(db, 'knowledge_graph_model')

    // Build character list for the prompt
    const charList = characters.map(c =>
      `[ID:${c.id}] "${c.name}" (${c.type}) — ${c.summary || 'no summary'}`
    ).join('\n')

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
            content: `You are a literary analyst identifying duplicate character entries that should be merged. Characters may have been detected multiple times under different names (e.g. first name vs full name, nickname vs formal name, title vs name).

Analyze the character list and identify groups that are likely the same character. Only suggest merges where you are confident they refer to the same entity.

For each suggested merge group, pick the best "primary" name to keep.

Return ONLY a JSON array of merge suggestions:
[
  {
    "primary_id": number,
    "primary_name": string,
    "merge_ids": number[],
    "merge_names": string[],
    "confidence": "high" | "medium",
    "reason": string
  }
]

Rules:
- Only include groups where confidence is at least medium
- merge_ids should NOT include the primary_id
- If no duplicates found, return []
- No markdown, no extra text.`
          },
          {
            role: 'user',
            content: `Characters in this book:\n\n${charList}`
          }
        ],
        temperature: 0.1,
        max_tokens: 800,
      }),
    })

    if (!openAIResponse.ok) {
      const errText = await openAIResponse.text()
      console.error('OpenAI error:', errText)
      throw new Error('AI analysis failed')
    }

    const openAIData = await openAIResponse.json()
    const responseText = openAIData.choices[0].message.content
    const usage = openAIData.usage

    // Log usage
    const { data: pricing } = await db
      .from('pricing_config')
      .select('*')
      .eq('model', model)
      .eq('active', true)
      .single()

    const baseCost =
      (usage.prompt_tokens / 1_000_000) * (pricing?.input_cost_per_1m || 0) +
      (usage.completion_tokens / 1_000_000) * (pricing?.output_cost_per_1m || 0)

    await db.from('api_usage').insert({
      user_id: user.id,
      api_provider: 'openai',
      model,
      endpoint_type: 'chat',
      request_type: 'character_merge_suggestion',
      input_tokens: usage.prompt_tokens,
      output_tokens: usage.completion_tokens,
      base_cost: baseCost,
      markup_multiplier: (pricing?.markup_multiplier ?? 2.0),
      book_id: bookId,
      request_metadata: { characters_count: characters.length },
    })

    let suggestions = []
    try {
      const cleaned = responseText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
      suggestions = JSON.parse(cleaned)
      if (!Array.isArray(suggestions)) suggestions = []
    } catch {
      console.error('Failed to parse merge suggestions:', responseText.substring(0, 500))
      suggestions = []
    }

    return new Response(
      JSON.stringify({ suggestions }),
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
