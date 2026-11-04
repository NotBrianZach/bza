// dive-in-prompt: generates a personalised "dive back in" conversation starter
// for the user's most recently read book.
//
// GET  /dive-in-prompt          → { type: 'dive_in', prompt, book }
//                               → 204 No Content when there is no reading history
//
// ── The "Something to explore" branch is gone ──────────────────────────────
//
// It used to answer { type: 'discover' } for anyone with no reading history: a
// topic and a blurb drawn from a hard-coded array of seven, rotated by
// `new Date().getDate() % 7`, under a heading that said "Something to explore"
// and a button that said "Upload a book to start exploring".
//
// Nothing about it was personal, and the one condition it keyed on was wrong.
// The branch fires on no reading SESSION, not on no books — so a user who had
// uploaded books but never turned a page was told to upload a book, directly
// above their own library. The upload path is already the home page's empty
// state, and said better there.
//
// 204 rather than a `{ type: 'none' }` body, deliberately: a client that has
// not been redeployed yet fails to parse the empty body, falls into its own
// catch, and renders nothing — which is exactly what the new client does. The
// alternative shape would have had the old client render an empty card.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
      // No reading history, so there is nothing to dive back INTO. The section
      // simply does not appear; see the note at the top of this file.
      return new Response(null, { status: 204, headers: corsHeaders })
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
      /**
       * `pricing` is looked up here, and it was NOT before.
       *
       * The insert below reads `pricing?.markup_multiplier` — copied from
       * generate-discussion, which fetches the row — but the fetch did not come
       * with it, so the identifier was undeclared. It sits inside a try/catch
       * whose comment says the logging is non-critical, so the ReferenceError
       * was swallowed and the row was never written: every OpenAI call this
       * function has ever made is missing from `api_usage`, and therefore from
       * the spend this user's quota is checked against twenty lines above.
       *
       * Only the multiplier comes from the row. `base_cost` keeps the literal
       * gpt-4o-mini rates already written below, because that is what this
       * function hard-codes as its model.
       */
      const { data: pricing } = await db
        .from('pricing_config')
        .select('markup_multiplier')
        .eq('model', 'gpt-4o-mini')
        .eq('active', true)
        .maybeSingle()
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
