// Manga OCR Edge Function
// Uses GPT-4o vision to extract text and describe manga page images.
// Stores extracted text as the page's content for accessibility, narration, and search.

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
    if (authError || !user) throw new Error('Unauthorized')

    const { bookId, pageNum }: { bookId: number; pageNum: number } = await req.json()

    // Get the page image
    const { data: pageImage } = await db
      .from('page_images')
      .select('image_url')
      .eq('book_id', bookId)
      .eq('page_num', pageNum)
      .limit(1)
      .maybeSingle()

    if (!pageImage?.image_url) throw new Error('Page image not found')

    // Get signed URL for the image
    const { data: signed } = await db.storage
      .from('page-images')
      .createSignedUrl(pageImage.image_url, 600)

    if (!signed?.signedUrl) throw new Error('Failed to get image URL')

    // Call GPT-4o vision to extract/describe the page
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are reading a manga/comic page for someone who cannot see it. Provide a rich, detailed description that captures:

1. **Panel layout** — describe how many panels and their arrangement
2. **Visual description** — what's happening in each panel (characters, actions, expressions, scenery)
3. **Dialogue** — transcribe all speech bubbles and text boxes in reading order (right-to-left for Japanese manga, left-to-right for Western comics)
4. **Sound effects** — transcribe any onomatopoeia or SFX text
5. **Narrative flow** — connect the panels into a coherent reading experience

Format your output as natural prose that reads like a novel adaptation of the page. Include all dialogue in quotes. This should be enjoyable to listen to as an audiobook.`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: `Describe this manga/comic page (page ${pageNum}):` },
              { type: 'image_url', image_url: { url: signed.signedUrl, detail: 'high' } }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    })

    if (!openAIResponse.ok) {
      const errText = await openAIResponse.text()
      console.error('OpenAI vision error:', errText)
      throw new Error('Vision model failed')
    }

    const result = await openAIResponse.json()
    const text = result.choices[0].message.content
    const usage = result.usage

    // Log usage
    const { data: pricing } = await db
      .from('pricing_config')
      .select('*')
      .eq('model', 'gpt-4o')
      .eq('active', true)
      .single()

    const baseCost =
      (usage.prompt_tokens / 1_000_000) * (pricing?.input_cost_per_1m || 0) +
      (usage.completion_tokens / 1_000_000) * (pricing?.output_cost_per_1m || 0)

    await db.from('api_usage').insert({
      user_id: user.id,
      api_provider: 'openai',
      model: 'gpt-4o',
      endpoint_type: 'chat',
      request_type: 'manga_ocr',
      input_tokens: usage.prompt_tokens,
      output_tokens: usage.completion_tokens,
      base_cost: baseCost,
      markup_multiplier: (pricing?.markup_multiplier ?? 2.0),
      book_id: bookId,
      page_num: pageNum,
      request_metadata: { page_num: pageNum },
    })

    // Store the extracted text: append to the book's markdown file for searchability
    const { data: book } = await db
      .from('books')
      .select('file_path, char_page_length')
      .eq('id', bookId)
      .single()

    if (book) {
      const { data: fileData } = await db.storage.from('books').download(book.file_path)
      if (fileData) {
        const existing = await fileData.text()
        const pageBlock = `\n\n## Page ${pageNum}\n\n${text}\n`
        const updated = existing + pageBlock
        await db.storage.from('books').upload(book.file_path, new Blob([updated], { type: 'text/markdown' }), { upsert: true })
        // Update total_pages based on content length
        const charLen = book.char_page_length || 2000
        const newTotalPages = Math.max(pageNum, Math.ceil(updated.length / charLen))
        await db.from('books').update({ total_pages: newTotalPages }).eq('id', bookId)
      }
    }

    return new Response(
      JSON.stringify({ text, pageNum }),
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
