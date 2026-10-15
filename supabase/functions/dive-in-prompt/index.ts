// dive-in-prompt: generates a personalised "dive back in" conversation starter
// for the user's most recently read book, or a curated discovery prompt if they
// have no books yet.
//
// GET  /dive-in-prompt          → { type, prompt, book? }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Shown when the user has no books yet — rotate by day so it feels fresh
const DISCOVERY_PROMPTS = [
  { topic: 'The philosophy of consciousness', prompt: "What makes you… you? Dive into ideas about consciousness, identity, and the nature of the mind." },
  { topic: 'How money actually works', prompt: "From ancient barter to Bitcoin — the surprisingly fascinating story of money, debt, and value." },
  { topic: 'The science of habits', prompt: "Why do we do what we do? Explore the neurological loops that shape every decision you make." },
  { topic: 'Fermi\'s paradox', prompt: "The universe is 13 billion years old and incomprehensibly large. So where is everybody?" },
  { topic: 'The history of writing', prompt: "Every letter you read today traces back 5,000 years to Sumerian clay tablets. What a journey." },
  { topic: 'Emergence and complexity', prompt: "How do simple rules produce brains, cities, and markets? Explore the hidden order behind complex systems." },
  { topic: 'Sleep and the brain', prompt: "You spend a third of your life unconscious. What is your brain actually doing during that time?" },
]

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const url = new URL(req.url)
    const customSystemPrompt = url.searchParams.get('customPrompt') ?? ''

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

    // Find the most recently read book with progress
    const { data: sessions } = await db
      .from('reading_sessions')
      .select('book_id, end_page, end_time, books(id, title, article_type, total_pages)')
      .eq('user_id', user.id)
      .not('end_page', 'is', null)
      .order('end_time', { ascending: false })
      .limit(1)

    const session = sessions?.[0]
    const book = session?.books as any

    if (!book) {
      // No reading history — return a discovery prompt
      const idx = new Date().getDate() % DISCOVERY_PROMPTS.length
      const pick = DISCOVERY_PROMPTS[idx]
      return new Response(JSON.stringify({ type: 'discover', ...pick }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check token quota before calling OpenAI
    const { data: quota } = await db.rpc('get_user_quota', { user_uuid: user.id })
    if (quota?.[0] && quota[0].tier === 'free' && quota[0].spend_this_month >= quota[0].spend_limit) {
      // Quota hit — return a template prompt without AI
      const progress = Math.round((session.end_page / book.total_pages) * 100)
      return new Response(JSON.stringify({
        type: 'dive_in',
        prompt: `You're ${progress}% through "${book.title}". Ready to pick up where you left off?`,
        book: { id: book.id, title: book.title, currentPage: session.end_page, totalPages: book.total_pages },
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Generate a personalised prompt with OpenAI
    const baseSystemPrompt = `You generate short, witty "dive back in" one-liners for readers.
Given a book title, type, and reading progress, write ONE punchy sentence (max 20 words) that makes the reader
laugh or cringe slightly before being compelled to pick the book back up. Be specific and a little irreverent.
Avoid corporate-speak like "continue your journey" or "embark on". Sound like a sarcastic but loveable friend.
No quotes around the sentence.`

    const systemPrompt = customSystemPrompt
      ? `${baseSystemPrompt}

Additional style instructions: ${customSystemPrompt}`
      : baseSystemPrompt

    const userMsg = `Book: "${book.title}" (${book.article_type || 'fiction'})
Reader is on page ${session.end_page} of ${book.total_pages} (${Math.round((session.end_page / book.total_pages) * 100)}% through).`

    const openAIRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMsg },
        ],
        max_tokens: 60,
        temperature: 0.8,
      }),
    })

    const openAIData = await openAIRes.json()
    const prompt = openAIData.choices?.[0]?.message?.content?.trim()
      ?? `Pick up where you left off in "${book.title}" — you're ${Math.round((session.end_page / book.total_pages) * 100)}% through.`

    // Log usage (small cost, don't fail if it errors)
    const usage = openAIData.usage
    if (usage) {
      try {
        await db.from('api_usage').insert({
          user_id: user.id,
          api_provider: 'openai',
          model: 'gpt-4o-mini',
          endpoint_type: 'chat',
          request_type: 'dive_in_prompt',
          input_tokens: usage.prompt_tokens,
          output_tokens: usage.completion_tokens,
          base_cost: ((usage.prompt_tokens / 1_000_000) * 0.15) + ((usage.completion_tokens / 1_000_000) * 0.60),
          markup_multiplier: (pricing?.markup_multiplier ?? 2.0),
          book_id: book.id,
        })
      } catch { /* non-critical */ }
    }

    return new Response(JSON.stringify({
      type: 'dive_in',
      prompt,
      book: { id: book.id, title: book.title, currentPage: session.end_page, totalPages: book.total_pages },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err: any) {
    console.error('dive-in-prompt error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Failed' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
