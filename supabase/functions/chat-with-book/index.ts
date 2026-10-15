// Chat with Book Edge Function
// Handles AI chat conversations with context from books

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { reportOverageIfNeeded } from '../_shared/stripe-overage.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatRequest {
  conversationId: number
  message: string
  model?: string
  includeContext?: boolean
  pageNum?: number
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

    // Hard-block free users at their $2 monthly quota; pro users get overage billing instead
    const { data: quota } = await db.rpc('get_user_quota', { user_uuid: user.id })
    if (quota?.[0] && quota[0].tier === 'free' && quota[0].spend_this_month >= quota[0].spend_limit) {
      return new Response(JSON.stringify({ error: 'Monthly AI quota reached. Upgrade to Pro for $5 included per month plus pay-as-you-go beyond that.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse request
    const { conversationId, message, model = 'gpt-4o-mini', includeContext = true, pageNum, personaPrompt } =
      await req.json() as ChatRequest & { personaPrompt?: string }

    // Get conversation — scoped to this user
    const { data: conversation } = await db
      .from('conversations')
      .select('*, books(*)')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (!conversation) {
      throw new Error('Conversation not found')
    }

    // Build context — load page or chapter depending on content available
    let contextText = ''
    if (includeContext && conversation.books && pageNum) {
      const { data: storageData } = await db.storage
        .from('books')
        .download(conversation.books.file_path)

      if (storageData) {
        const fullContent = await storageData.text()
        const cpl = conversation.books.char_page_length ?? 420
        const pageStart = (pageNum - 1) * cpl
        const pageEnd = pageStart + cpl

        // Try to find chapter boundaries using heading patterns
        const headingRe = /^(?:#{1,4}\s|\\(?:section|chapter)|(?:CHAPTER|Chapter|PART|Part)\s+[IVXLCDM\d])/gm
        const headings: number[] = []
        let hm: RegExpExecArray | null
        while ((hm = headingRe.exec(fullContent)) !== null) headings.push(hm.index)

        // Find the heading before and after the current page
        let chapterStart = 0
        let chapterEnd = fullContent.length
        for (const ho of headings) {
          if (ho <= pageStart) chapterStart = ho
          if (ho > pageEnd && chapterEnd === fullContent.length) chapterEnd = ho
        }

        // Cap chapter context at ~5 pages to avoid token overflow
        const maxChapterLen = cpl * 5
        if (chapterEnd - chapterStart > maxChapterLen) {
          // Center around the current page
          chapterStart = Math.max(chapterStart, pageStart - maxChapterLen / 2)
          chapterEnd = Math.min(chapterEnd, pageStart + maxChapterLen / 2)
        }

        // Use chapter context if it's meaningfully larger than a page
        if (chapterEnd - chapterStart > cpl * 1.5) {
          contextText = fullContent.substring(chapterStart, chapterEnd)
        } else {
          contextText = fullContent.substring(pageStart, pageEnd)
        }
      }
    }

    // Get conversation history
    const { data: messages } = await db
      .from('chat_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(20)

    // Build OpenAI messages
    const openAIMessages: any[] = []

    const personaLine = personaPrompt?.trim() ? `\n\nPERSONALITY: ${personaPrompt.trim()}` : ''
    if (contextText) {
      openAIMessages.push({
        role: 'system',
        content: `You are a helpful reading assistant. Here is the current page content:\n\n${contextText}\n\nHelp the user understand and discuss this content.${personaLine}`
      })
    } else {
      openAIMessages.push({
        role: 'system',
        content: `You are a helpful reading assistant. Help the user with their questions about their book.${personaLine}`
      })
    }

    if (messages) {
      openAIMessages.push(...messages.map(m => ({ role: m.role, content: m.content })))
    }

    openAIMessages.push({ role: 'user', content: message })

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: openAIMessages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!openAIResponse.ok) {
      const error = await openAIResponse.json()
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`)
    }

    const openAIData = await openAIResponse.json()
    const assistantMessage = openAIData.choices[0].message.content
    const usage = openAIData.usage

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

    // Save user message
    await db
      .from('chat_messages')
      .insert({
        user_id: user.id,
        conversation_id: conversationId,
        role: 'user',
        content: message,
        page_num: pageNum,
      })

    // Save assistant message
    const { data: savedMessage } = await db
      .from('chat_messages')
      .insert({
        user_id: user.id,
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantMessage,
        page_num: pageNum,
        metadata: { model, tokens: usage.total_tokens },
      })
      .select()
      .single()

    // Log API usage
    await db
      .from('api_usage')
      .insert({
        user_id: user.id,
        api_provider: 'openai',
        model,
        endpoint_type: 'chat',
        request_type: 'chat_message',
        input_tokens: usage.prompt_tokens,
        output_tokens: usage.completion_tokens,
        base_cost: baseCost,
        markup_multiplier: (pricing?.markup_multiplier ?? 2.0),
        book_id: conversation.book_id,
        page_num: pageNum,
        request_metadata: {
          conversation_id: conversationId,
          include_context: includeContext,
        },
      })

    // Report overage to Stripe meter if user has exceeded $3 included quota
    await reportOverageIfNeeded(db, user.id)

    // Update conversation timestamp
    await db
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)
      .eq('user_id', user.id)

    return new Response(
      JSON.stringify({
        message: savedMessage,
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
