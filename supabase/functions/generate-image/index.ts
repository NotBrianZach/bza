// Generate Image Edge Function
// Creates AI-generated illustrations using DALL-E 3

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { reportOverageIfNeeded } from '../_shared/stripe-overage.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ImageRequest {
  bookId: number
  pageNum: number
  prompt?: string
  customStylePrompt?: string
  size?: '1024x1024' | '1792x1024' | '1024x1792'
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
    const { bookId, pageNum, prompt, size = '1024x1024', customStylePrompt }: ImageRequest = await req.json()

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

    // Generate prompt if not provided
    let finalPrompt = prompt
    if (!finalPrompt) {
      const { data: storageData } = await db.storage
        .from('books')
        .download(book.file_path)

      if (storageData) {
        const fullContent = await storageData.text()
        const start = (pageNum - 1) * book.char_page_length
        const end = start + book.char_page_length
        const pageContent = fullContent.substring(start, end)

        const model = 'gpt-4o-mini'
        const promptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
                content: 'You are an expert at creating visual prompts for AI image generation. Create a detailed, vivid description for an illustration based on the text provided. Focus on scene, characters, mood, and visual details. Keep it under 100 words.'
              },
              {
                role: 'user',
                content: `Create an image generation prompt for this text:\n\n${pageContent.substring(0, 2000)}`
              }
            ],
            temperature: 0.7,
            max_tokens: 150,
          }),
        })

        if (promptResponse.ok) {
          const promptData = await promptResponse.json()
          finalPrompt = promptData.choices[0].message.content

          const usage = promptData.usage
          const { data: pricing } = await db
            .from('pricing_config')
            .select('*')
            .eq('model', model)
            .eq('active', true)
            .single()

          if (pricing && usage) {
            const baseCost = (usage.prompt_tokens / 1000000) * pricing.input_cost_per_1m +
                           (usage.completion_tokens / 1000000) * pricing.output_cost_per_1m

            await db
              .from('api_usage')
              .insert({
                user_id: user.id,
                api_provider: 'openai',
                model,
                endpoint_type: 'chat',
                request_type: 'image_prompt_generation',
                input_tokens: usage.prompt_tokens,
                output_tokens: usage.completion_tokens,
                base_cost: baseCost,
                markup_multiplier: (pricing?.markup_multiplier ?? 2.0),
                book_id: bookId,
                page_num: pageNum,
              })
          }
        } else {
          finalPrompt = `Illustration for page ${pageNum} of ${book.title}`
        }
      }
    }

    if (!finalPrompt) {
      throw new Error('No prompt provided and could not generate one')
    }

    // Append user's custom style instructions
    if (customStylePrompt?.trim()) {
      finalPrompt = `${finalPrompt}. Style: ${customStylePrompt.trim()}`
    }

    // Generate image with gpt-image-1 (replaces dall-e-3)
    // Size mapping: gpt-image-1 uses slightly different dimensions
    const gptSize = size === '1792x1024' ? '1536x1024' : size === '1024x1792' ? '1024x1536' : '1024x1024'
    const dalleModel = `gpt-image-1-${gptSize}`
    const dalleResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: finalPrompt,
        n: 1,
        size: gptSize,
        quality: 'medium',
      }),
    })

    if (!dalleResponse.ok) {
      const error = await dalleResponse.json()
      throw new Error(`Image API error: ${error.error?.message || 'Unknown error'}`)
    }

    const dalleData = await dalleResponse.json()
    // gpt-image-1 returns base64, not a URL
    const b64 = dalleData.data[0].b64_json
    const byteChars = atob(b64)
    const byteArr = new Uint8Array(byteChars.length)
    for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i)
    const imageBlob = new Blob([byteArr], { type: 'image/png' })

    const timestamp = Date.now()
    const imagePath = `${user.id}/${bookId}_page${pageNum}_${timestamp}.png`

    const { error: uploadError } = await db.storage
      .from('page-images')
      .upload(imagePath, imageBlob, {
        contentType: 'image/png',
        cacheControl: '3600',
      })

    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`)
    }

    // Store path — frontend signs URLs on the fly
    const publicUrl = imagePath

    // Get pricing
    const { data: imagePricing } = await db
      .from('pricing_config')
      .select('*')
      .eq('model', dalleModel)
      .eq('active', true)
      .single()

    const baseCost = imagePricing?.image_cost || 0.04

    // Save image record — scoped to this user
    const { data: savedImage } = await db
      .from('page_images')
      .insert({
        user_id: user.id,
        book_id: bookId,
        page_num: pageNum,
        prompt: finalPrompt,
        image_url: publicUrl,
        model: 'gpt-image-1',
        size,
      })
      .select()
      .single()

    // Log API usage
    await db
      .from('api_usage')
      .insert({
        user_id: user.id,
        api_provider: 'openai',
        model: dalleModel,
        endpoint_type: 'image',
        request_type: 'image_generation',
        input_tokens: 0,
        output_tokens: 0,
        base_cost: baseCost,
        markup_multiplier: (imagePricing?.markup_multiplier ?? 2.0),
        book_id: bookId,
        page_num: pageNum,
        request_metadata: {
          size,
          prompt_length: finalPrompt.length,
        },
      })

    // Report overage to Stripe meter if user has exceeded $3 included quota
    await reportOverageIfNeeded(db, user.id)

    return new Response(
      JSON.stringify({
        image: savedImage,
        usage: {
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
