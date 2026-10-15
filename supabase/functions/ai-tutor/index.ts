// ai-tutor: Persistent AI tutor that knows the student's quiz history,
// weak topics, and current book position. Streams responses via SSE.
//
// Request:  { bookId, pageNum, message, mode?: 'chat'|'analyze'|'drill', topic?: string }
// Response: SSE stream of text chunks

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

    // Quota check (tutoring uses AI — enforce limits for free users)
    const { data: quota } = await db.rpc('get_user_quota', { user_uuid: user.id })
    if (quota?.[0] && quota[0].tier === 'free' && quota[0].spend_this_month >= quota[0].spend_limit) {
      return new Response(JSON.stringify({ error: 'Monthly AI quota reached. Upgrade to Pro to continue using the tutor.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { bookId, pageNum, message, mode = 'chat', topic, customSystemPrompt } = await req.json()

    // --- Gather context in parallel ---

    // 1. Book info + current page text
    const { data: book } = await db
      .from('books')
      .select('title, content_type, file_path, char_page_length')
      .eq('id', bookId)
      .eq('user_id', user.id)
      .single()

    if (!book) {
      return new Response(JSON.stringify({ error: 'Book not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Recent quiz attempts (last 10 sessions)
    const { data: attempts } = await db
      .from('quiz_attempts')
      .select('score, total, results, focus_type, created_at')
      .eq('user_id', user.id)
      .eq('book_id', bookId)
      .order('created_at', { ascending: false })
      .limit(10)

    // 3. Weak topics from RPC
    const { data: weakTopics } = await db.rpc('get_weak_topics', {
      p_user_id: user.id,
      p_book_id: bookId,
      p_limit: 5,
    })

    // 4. Flashcard due counts by topic
    const { data: dueCards } = await db
      .from('flashcards')
      .select('topic_tag')
      .eq('user_id', user.id)
      .eq('book_id', bookId)
      .lte('next_review_at', new Date().toISOString())

    const dueBytopic: Record<string, number> = {}
    for (const c of (dueCards ?? [])) {
      if (c.topic_tag) dueBytopic[c.topic_tag] = (dueBytopic[c.topic_tag] ?? 0) + 1
    }

    // 5. Current page text (optional — skip if no file_path)
    let pageText = ''
    if (book.file_path && pageNum) {
      try {
        const { data: fileData } = await db.storage.from('books').download(book.file_path)
        if (fileData) {
          const full = await fileData.text()
          const start = (pageNum - 1) * (book.char_page_length ?? 3000)
          pageText = full.slice(start, start + (book.char_page_length ?? 3000))
        }
      } catch { /* non-fatal */ }
    }

    // --- Build system prompt ---
    const weakSummary = (weakTopics ?? []).length > 0
      ? (weakTopics as any[]).map(t =>
          `  • ${t.topic}: ${t.correct}/${t.total} correct (${t.accuracy}%)`
        ).join('\n')
      : '  (no quiz data yet)'

    const dueSummary = Object.entries(dueBytopic).length > 0
      ? Object.entries(dueBytopic).map(([t, n]) => `  • ${t}: ${n} card${n > 1 ? 's' : ''} due`).join('\n')
      : '  (no cards due)'

    const recentScores = (attempts ?? []).slice(0, 3).map(a =>
      `  ${new Date(a.created_at).toLocaleDateString()}: ${a.score}/${a.total}`
    ).join('\n') || '  (no recent quizzes)'

    let modeInstruction = ''
    if (mode === 'analyze') {
      modeInstruction = `The student just finished a quiz. Proactively analyze their weak topics and suggest what to study next. Be specific and encouraging. End with 1-2 targeted drill questions on their weakest topic.`
    } else if (mode === 'drill' && topic) {
      modeInstruction = `The student wants to drill on "${topic}". Ask them 2-3 targeted questions on this topic (one at a time), give feedback on answers, and explain any misconceptions. Use Socratic method.`
    } else {
      modeInstruction = `Answer the student's question. Reference their known weak areas when relevant. Be concise and educational.`
    }

    const systemPrompt = `You are a personal AI tutor helping a student work through "${book.title}".
You have full context of their learning history and weak areas — use it to give targeted, personalized help.

## Student's learning profile:
Weak topics (from quiz history):
${weakSummary}

Recent quiz scores:
${recentScores}

Flashcards due for review:
${dueSummary}

${pageText ? `## Current page content (page ${pageNum}):\n${pageText.slice(0, 2000)}` : ''}

## Your role:
${modeInstruction}

Format your responses clearly. Use markdown. Use LaTeX math ($...$ inline, $$...$$ display) when appropriate.
Be encouraging but honest. If they're struggling with a concept, break it down step by step.${customSystemPrompt ? `\n\nPersonality/style override from user: ${customSystemPrompt}` : ''}`

    // --- Stream response from Claude ---
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? Deno.env.get('OPENAI_API_KEY') ?? '',
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        stream: true,
        system: systemPrompt,
        messages: [{ role: 'user', content: message || 'Analyze my weak areas and tell me what to focus on.' }],
      }),
    })

    if (!aiRes.ok) {
      // Fallback to OpenAI if Anthropic key not set
      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          stream: true,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message || 'Analyze my weak areas and tell me what to focus on.' },
          ],
          max_tokens: 1024,
        }),
      })

      if (!openaiRes.ok) {
        const err = await openaiRes.json()
        throw new Error(err.error?.message || 'AI error')
      }

      // Stream OpenAI SSE response through
      return new Response(openaiRes.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      })
    }

    // Stream Anthropic SSE response through
    return new Response(aiRes.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    console.error('ai-tutor error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
