// daily-riff: generates a once-per-day AI riff on yesterday's reading.
// Randomly picks one of three modes: summary, story, or rant.
//
// GET /daily-riff → { riff: string, type: 'summary'|'story'|'rant', books: string[], date: string }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RIFF_TYPES = ['summary', 'story', 'rant'] as const
type RiffType = typeof RIFF_TYPES[number]

const SYSTEM_PROMPTS: Record<RiffType, string> = {
  summary: `You are a witty, sharp reading companion. Given a list of books someone read yesterday,
write a punchy 2–4 sentence summary of their reading day. Be specific, slightly irreverent, and make
it feel like a smart friend recapping your day for you. Avoid corporate-speak. Sound alive.`,

  story: `You are a creative writer. Given a list of books someone read yesterday, write a SHORT (3–5 sentences)
absurdist micro-fiction that incorporates characters, concepts, or settings from those books. Make it
delightful and weird. Don't explain the joke.`,

  rant: `You are a passionate, opinionated literary enthusiast. Given books someone read yesterday, go on a
short (3–5 sentence) funny rant about one or more aspects of those books — could be praising something
brilliant, mocking something ridiculous, or marveling at something strange. Be entertaining and specific.
No hedging. Have a take.`,
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

    // Yesterday window (UTC)
    const now = new Date()
    const todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const yesterdayMidnight = new Date(todayMidnight.getTime() - 86_400_000)

    const { data: sessions } = await db
      .from('reading_sessions')
      .select('book_id, books(id, title, article_type)')
      .eq('user_id', user.id)
      .gte('end_time', yesterdayMidnight.toISOString())
      .lt('end_time', todayMidnight.toISOString())
      .not('end_page', 'is', null)

    if (!sessions || sessions.length === 0) {
      return new Response(JSON.stringify({ riff: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Deduplicate books
    const seen = new Set<number>()
    const books: { id: number; title: string; article_type: string }[] = []
    for (const s of sessions) {
      const b = s.books as any
      if (b && !seen.has(b.id)) {
        seen.add(b.id)
        books.push({ id: b.id, title: b.title, article_type: b.article_type ?? 'fiction' })
      }
    }

    // Check quota
    const { data: quota } = await db.rpc('get_user_quota', { user_uuid: user.id })
    const riffType: RiffType = RIFF_TYPES[now.getUTCDate() % 3]

    if (quota?.[0] && quota[0].tier === 'free' && quota[0].spend_this_month >= quota[0].spend_limit) {
      // Quota hit — simple fallback
      const titles = books.map(b => `"${b.title}"`).join(', ')
      return new Response(JSON.stringify({
        riff: `Yesterday you read: ${titles}. Not bad.`,
        type: 'summary',
        books: books.map(b => b.title),
        date: yesterdayMidnight.toISOString().slice(0, 10),
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const bookList = books.map(b => `"${b.title}" (${b.article_type})`).join(', ')

    const openAIRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS[riffType] },
          { role: 'user', content: `Books read yesterday: ${bookList}` },
        ],
        max_tokens: 120,
        temperature: 0.9,
      }),
    })

    const openAIData = await openAIRes.json()
    const riff = openAIData.choices?.[0]?.message?.content?.trim() ?? null

    // Log usage
    const usage = openAIData.usage
    if (usage) {
      await db.from('api_usage').insert({
        user_id: user.id,
        api_provider: 'openai',
        model: 'gpt-4o-mini',
        endpoint_type: 'chat',
        request_type: 'daily_riff',
        input_tokens: usage.prompt_tokens,
        output_tokens: usage.completion_tokens,
        base_cost: ((usage.prompt_tokens / 1_000_000) * 0.15) + ((usage.completion_tokens / 1_000_000) * 0.60),
        markup_multiplier: (pricing?.markup_multiplier ?? 2.0),
      }).catch(() => {})
    }

    return new Response(JSON.stringify({
      riff,
      type: riffType,
      books: books.map(b => b.title),
      date: yesterdayMidnight.toISOString().slice(0, 10),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err: any) {
    console.error('daily-riff error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Failed' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
