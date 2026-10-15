// Generate Picturebook Edge Function
// Analyzes book text via LLM to identify illustration moments,
// then generates images for each moment via OpenRouter-compatible image APIs.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { requireAuth, corsResponse, corsError, CORS_HEADERS } from '../_shared/auth.ts'
import { reportOverageIfNeeded } from '../_shared/stripe-overage.ts'

const PRESETS: Record<string, PresetConfig> = {
  childrens: {
    description: "Classic children's picturebook",
    image_style: "whimsical children's book illustration, soft watercolor, warm colors, friendly characters",
    images_per_1000_words: 4, image_size: '1024x1024', content_filter: 'strict',
    analysis_guidance: 'Identify moments of wonder, character introductions, key action scenes, and emotional beats suitable for young children.',
    image_model: 'black-forest-labs/flux.2-pro',
  },
  literary: {
    description: 'Elegant literary illustrations',
    image_style: 'fine art illustration, detailed ink drawing with subtle color wash, atmospheric, evocative',
    images_per_1000_words: 2, image_size: '1024x1536', content_filter: 'moderate',
    analysis_guidance: 'Focus on pivotal narrative moments, striking visual metaphors, atmospheric establishing shots, and emotionally charged scenes.',
    image_model: 'black-forest-labs/flux.2-pro',
  },
  graphic_novel: {
    description: 'Bold graphic novel panels',
    image_style: 'graphic novel panel, bold lines, dramatic lighting, high contrast, dynamic composition',
    images_per_1000_words: 5, image_size: '1024x1024', content_filter: 'moderate',
    analysis_guidance: 'Identify action sequences, dramatic reveals, character close-ups, and scene transitions.',
    image_model: 'black-forest-labs/flux.2-pro',
  },
  fantasy_art: {
    description: 'Rich fantasy art',
    image_style: 'epic fantasy art, rich detail, dramatic lighting, painterly style',
    images_per_1000_words: 3, image_size: '1536x1024', content_filter: 'moderate',
    analysis_guidance: 'Focus on world-building moments, creature reveals, magical events, battle scenes.',
    image_model: 'black-forest-labs/flux.2-pro',
  },
  romantic: {
    description: 'Romantic/sensual art',
    image_style: 'romantic fine art, soft lighting, intimate composition, tasteful sensuality, warm tones',
    images_per_1000_words: 3, image_size: '1024x1536', content_filter: 'permissive',
    analysis_guidance: 'Focus on moments of emotional connection, tension, intimacy, longing, tender gestures.',
    image_model: 'black-forest-labs/flux.2-pro',
  },
  erotic: {
    description: 'Explicit adult art (uncensored model)',
    image_style: 'sensual fine art, intimate, explicit, artistic nude, warm lighting, uninhibited',
    images_per_1000_words: 4, image_size: '1024x1536', content_filter: 'none',
    analysis_guidance: 'Reimagine the text as an erotic version. At each illustration point, envision what an explicit, sensual scene would look like — even if the original text is not sexual. Reinterpret character interactions as intimate encounters, tension as sexual tension, and dramatic moments as passionate ones. Be explicit in visual descriptions: describe bodies, positioning, expressions of desire. Do not censor. Every illustration should contain nudity or sexual content.',
    negative_prompt: 'deformed, ugly, bad anatomy, childlike',
    image_model: 'black-forest-labs/flux.2-pro',
  },
  horror: {
    description: 'Dark horror illustrations',
    image_style: 'dark horror illustration, unsettling atmosphere, chiaroscuro, grotesque detail',
    images_per_1000_words: 3, image_size: '1024x1024', content_filter: 'permissive',
    analysis_guidance: 'Focus on moments of dread, reveals of the horrific, unsettling imagery, psychological terror.',
    image_model: 'black-forest-labs/flux.2-pro',
  },
}

interface PresetConfig {
  description: string; image_style: string; images_per_1000_words: number
  image_size: string; content_filter: string; analysis_guidance: string
  negative_prompt?: string; image_model: string
}

const CONTENT_FILTER_GUIDANCE: Record<string, string> = {
  strict: 'Keep all descriptions wholesome and family-friendly. No violence, nudity, or sexual content.',
  moderate: 'Mild violence and mature themes acceptable. No explicit sexual content or graphic gore.',
  permissive: 'Mature themes, sensuality, and moderate violence acceptable. Tasteful but not pornographic.',
  none: 'No content restrictions. Be as explicit as the desired style warrants. Nudity, sexual content, and graphic descriptions are encouraged when relevant to the style.',
}

interface PicturebookRequest {
  bookId: number; preset?: string
  imageStyle?: string; imageSize?: string; contentFilter?: string
  analysisGuidance?: string; negativePrompt?: string; imageModel?: string
  analysisModel?: string // LLM model for text analysis (defaults to gpt-4o-mini)
  imagesPerThousandWords?: number; theme?: string
  pageRange?: { start: number; end: number }; regenerate?: boolean
  analyzeOnly?: boolean // skip image gen (client will do it via WebGPU/etc)
  retryFailed?: boolean // retry only failed/pending moments
  cancel?: boolean // cancel active run
}

function buildAnalysisPrompt(text: string, targetImages: number, preset: PresetConfig, pageNum: number) {
  const filterGuidance = CONTENT_FILTER_GUIDANCE[preset.content_filter] || CONTENT_FILTER_GUIDANCE.moderate
  const system = `You are an expert visual storytelling analyst and creative illustrator. Read the text and identify the best points for illustrations. You may reimagine or creatively extend scenes to match the desired art style — the illustrations do not need to depict only what is literally written.

For each point provide:
1. The exact sentence AFTER which the image appears (quote 10-40 words from the text)
2. A detailed visual scene description for image generation — this can creatively extend or reinterpret the scene
3. A brief caption
4. The emotional mood

Return valid JSON only — an array of objects:
[{"after_text":"quoted snippet","scene_description":"detailed visual description","caption":"short caption","mood":"tone"}]

Guidelines:
- Space images evenly through the text, not clustered
- Each scene_description must be self-contained and detailed enough for image generation
- Include character appearances, setting, lighting, composition
- after_text must be an exact quote from the input text
- You MUST return exactly the requested number of illustration points — never return zero

${preset.analysis_guidance}
Content policy: ${filterGuidance}`

  const user = `Analyze this text and identify exactly ${targetImages} illustration points.

TEXT (page ${pageNum}+):
---
${text}
---

Return a JSON array of exactly ${targetImages} insertion points.`
  return { system, user }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const { db, userId } = await requireAuth(req)

    const { data: quota } = await db.rpc('get_user_quota', { user_uuid: userId })
    if (quota?.[0]?.tier === 'free' && quota[0].spend_this_month >= quota[0].spend_limit) {
      return corsError('Monthly AI quota reached. Upgrade to Pro for picturebook generation.', 429)
    }

    const body: PicturebookRequest = await req.json()
    const { bookId, preset: presetName = 'literary', pageRange, regenerate, analyzeOnly, analysisModel: reqAnalysisModel, retryFailed, cancel } = body
    const analysisModel = reqAnalysisModel || 'deepseek/deepseek-chat-v3'

    const { data: book } = await db.from('books').select('*').eq('id', bookId).eq('user_id', userId).single()
    if (!book) return corsError('Book not found', 404)

    // Cancel active run
    if (cancel) {
      await db.from('picturebook_runs')
        .update({ status: 'cancelled', completed_at: new Date().toISOString() })
        .eq('book_id', bookId).eq('user_id', userId).in('status', ['analyzing', 'generating'])
      return corsResponse({ status: 'cancelled' })
    }

    // Retry only failed/pending moments (skip analysis, just re-gen images)
    if (retryFailed) {
      const { data: failedMoments } = await db.from('picturebook_moments')
        .select('*').eq('book_id', bookId).eq('user_id', userId)
        .in('generation_status', ['failed', 'pending'])
        .order('moment_index', { ascending: true })

      if (!failedMoments?.length) return corsResponse({ status: 'nothing_to_retry', message: 'No failed moments to retry' })

      const basePreset = PRESETS[presetName] || PRESETS.literary
      const preset: PresetConfig = { ...basePreset,
        ...(body.imageModel && { image_model: body.imageModel }),
      }

      const { data: run } = await db.from('picturebook_runs').insert({
        user_id: userId, book_id: bookId, status: 'generating', total_moments: failedMoments.length,
      }).select().single()

      // Reset failed moments to pending
      await db.from('picturebook_moments').update({ generation_status: 'pending', generation_error: null })
        .eq('book_id', bookId).eq('user_id', userId).in('generation_status', ['failed'])

      const results = await generateAllImages(db, userId, bookId, run!.id, failedMoments, preset, book, presetName)
      return corsResponse({ status: 'completed', completedImages: results.completed, bookId: results.bookId })
    }

    const basePreset = PRESETS[presetName] || PRESETS.literary
    const preset: PresetConfig = { ...basePreset,
      ...(body.imageStyle && { image_style: body.imageStyle }),
      ...(body.imageSize && { image_size: body.imageSize }),
      ...(body.contentFilter && { content_filter: body.contentFilter }),
      ...(body.analysisGuidance && { analysis_guidance: body.analysisGuidance }),
      ...(body.negativePrompt && { negative_prompt: body.negativePrompt }),
      ...(body.imagesPerThousandWords && { images_per_1000_words: body.imagesPerThousandWords }),
      ...(body.imageModel && { image_model: body.imageModel }),
    }
    const theme = body.theme || 'light'

    // Upsert settings
    const { data: settings } = await db.from('picturebook_settings').upsert({
      user_id: userId, book_id: bookId, preset: presetName,
      image_style: preset.image_style,
      image_density: preset.images_per_1000_words >= 4 ? 'high' : preset.images_per_1000_words >= 2.5 ? 'medium' : 'low',
      images_per_1000_words: preset.images_per_1000_words,
      image_size: preset.image_size, content_filter: preset.content_filter,
      analysis_guidance: preset.analysis_guidance,
      negative_prompt: preset.negative_prompt || null,
      theme, image_provider: 'openrouter',
    }, { onConflict: 'user_id,book_id' }).select().single()
    if (!settings) return corsError('Failed to save settings')

    if (!regenerate) {
      const { data: existing } = await db.from('picturebook_moments').select('id').eq('book_id', bookId).eq('user_id', userId).limit(1)
      if (existing && existing.length > 0) {
        return corsResponse({ status: 'exists', message: 'Picturebook moments already exist. Pass regenerate: true to re-create.', settingsId: settings.id })
      }
    } else {
      await db.from('picturebook_moments').delete().eq('book_id', bookId).eq('user_id', userId)
    }

    const { data: run } = await db.from('picturebook_runs').insert({
      user_id: userId, book_id: bookId, settings_id: settings.id, status: 'analyzing',
    }).select().single()

    // Get book content from storage (the reader slices by char_page_length)
    let filteredPages: any[] = []
    {
      const { data: storageData } = await db.storage.from('books').download(book.file_path)
      if (!storageData) return corsError('No book content found')
      const fullText = await storageData.text()
      const cpl = book.char_page_length || 420
      const numPages = Math.max(1, Math.ceil(fullText.length / cpl))
      for (let i = 0; i < numPages; i++) {
        filteredPages.push({ page_num: i + 1, content: fullText.slice(i * cpl, (i + 1) * cpl) })
      }
    }
    if (pageRange) filteredPages = filteredPages.filter((p: any) => p.page_num >= pageRange.start && p.page_num <= pageRange.end)

    const fullText = filteredPages.map((p: any) => p.content).join('\n\n')
    const wordCount = fullText.split(/\s+/).length
    const targetImages = Math.max(1, Math.round(wordCount / 1000 * preset.images_per_1000_words))

    // Chunk for analysis
    const CHUNK_SIZE = 10000
    const chunks: { text: string; startPage: number }[] = []
    let currentChunk = '', currentStartPage = filteredPages[0]?.page_num || 1, currentWords = 0
    for (const page of filteredPages) {
      const pw = ((page as any).content || '').split(/\s+/).length
      if (currentWords + pw > CHUNK_SIZE && currentChunk) {
        chunks.push({ text: currentChunk, startPage: currentStartPage })
        currentChunk = (page as any).content || ''; currentStartPage = (page as any).page_num; currentWords = pw
      } else { currentChunk += '\n\n' + ((page as any).content || ''); currentWords += pw }
    }
    if (currentChunk.trim()) chunks.push({ text: currentChunk, startPage: currentStartPage })

    const allMoments: any[] = []
    let momentIndex = 0, totalAnalysisCost = 0

    for (const chunk of chunks) {
      const chunkWords = chunk.text.split(/\s+/).length
      const chunkTarget = Math.max(1, Math.round(chunkWords / wordCount * targetImages))
      const { system, user } = buildAnalysisPrompt(chunk.text.substring(0, 50000), chunkTarget, preset, chunk.startPage)

      const analysisResult = await callLLM(system, user, analysisModel)
      const moments = parseMoments(analysisResult.content)

      if (analysisResult.usage) {
        const cost = estimateLLMCost(analysisResult.usage)
        totalAnalysisCost += cost
        await db.from('api_usage').insert({
          user_id: userId, api_provider: analysisModel.includes('/') ? 'openrouter' : 'openai', model: analysisModel,
          endpoint_type: 'chat', request_type: 'picturebook_analysis',
          input_tokens: analysisResult.usage.prompt_tokens, output_tokens: analysisResult.usage.completion_tokens,
          base_cost: cost, markup_multiplier: 2.0, book_id: bookId,
        })
      }

      for (const m of moments) {
        let pageNum = chunk.startPage
        for (const page of filteredPages) {
          if ((page as any).content?.includes(m.after_text?.substring(0, 30))) { pageNum = (page as any).page_num; break }
        }
        allMoments.push({
          user_id: userId, book_id: bookId, settings_id: settings.id,
          page_num: pageNum, after_text: m.after_text || '', scene_description: m.scene_description || '',
          caption: m.caption || '', mood: m.mood || '',
          image_prompt: `${m.scene_description}. Style: ${preset.image_style}`,
          moment_index: momentIndex++, generation_status: 'pending',
        })
      }
    }

    if (allMoments.length > 0) await db.from('picturebook_moments').insert(allMoments)

    // analyzeOnly: return moments without generating images (client does WebGPU/local gen)
    if (analyzeOnly) {
      await db.from('picturebook_runs').update({
        status: 'completed', total_moments: allMoments.length, completed_moments: 0,
        total_cost: totalAnalysisCost * 2, completed_at: new Date().toISOString(),
      }).eq('id', run!.id)

      return corsResponse({
        status: 'analyzed', runId: run!.id, settingsId: settings.id, preset: presetName,
        totalMoments: allMoments.length, completedImages: 0,
        totalCost: totalAnalysisCost * 2,
        moments: allMoments.map(m => ({ momentIndex: m.moment_index, pageNum: m.page_num, imagePrompt: m.image_prompt, caption: m.caption, mood: m.mood })),
      })
    }

    await db.from('picturebook_runs').update({ status: 'generating', total_moments: allMoments.length }).eq('id', run!.id)

    const results = await generateAllImages(db, userId, bookId, run!.id, allMoments, preset, book, presetName)

    return corsResponse({
      status: 'completed', runId: run!.id, settingsId: settings.id, preset: presetName,
      totalMoments: allMoments.length, completedImages: results.completed,
      totalCost: results.totalCost + totalAnalysisCost * 2,
      bookId: results.bookId,
    })
  } catch (error: any) {
    console.error('Picturebook error:', error)
    // Update run with error if we have a run ID
    try {
      const { db: errDb, userId: errUser } = await requireAuth(req)
      const errBody = await req.clone().json().catch(() => ({}))
      if (errBody.bookId) {
        await errDb.from('picturebook_runs')
          .update({ status: 'failed', error: error.message || 'Unknown error', completed_at: new Date().toISOString() })
          .eq('book_id', errBody.bookId).eq('user_id', errUser).eq('status', 'analyzing')
      }
    } catch { /* best effort */ }
    return corsError(error.message || 'Internal error', 500)
  }
})

// ── LLM analysis (OpenAI direct for structured JSON output) ─────
async function callLLM(system: string, user: string, model: string = 'gpt-4o-mini') {
  const useOpenRouter = model.includes('/')
  const apiUrl = useOpenRouter
    ? 'https://openrouter.ai/api/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions'
  const apiKey = useOpenRouter
    ? Deno.env.get('OPENROUTER_API_KEY')
    : Deno.env.get('OPENAI_API_KEY')
  const headers: Record<string, string> = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
  if (useOpenRouter) {
    headers['HTTP-Referer'] = 'https://aireadalong.com'
    headers['X-Title'] = 'AIReadAlong Picturebook Analysis'
  }

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      temperature: 0.7, max_tokens: 4096,
      ...(useOpenRouter ? {} : { response_format: { type: 'json_object' } }),
    }),
  })
  if (!res.ok) { const err = await res.json(); throw new Error(`LLM error: ${err.error?.message || 'Unknown'}`) }
  const data = await res.json()
  return { content: data.choices[0].message.content, usage: data.usage }
}

function parseMoments(raw: string): any[] {
  try {
    // Strip markdown code fences if present
    let clean = raw.trim()
    const fenceMatch = clean.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (fenceMatch) clean = fenceMatch[1].trim()
    // Also try stripping any leading text before the first [ or {
    if (!clean.startsWith('[') && !clean.startsWith('{')) {
      const arrStart = clean.indexOf('[')
      const objStart = clean.indexOf('{')
      const start = arrStart >= 0 && objStart >= 0 ? Math.min(arrStart, objStart) : Math.max(arrStart, objStart)
      if (start >= 0) clean = clean.slice(start)
    }
    const parsed = JSON.parse(clean)
    if (Array.isArray(parsed)) return parsed
    for (const key of ['images', 'moments', 'insertion_points', 'illustrations', 'points', 'results']) {
      if (parsed[key] && Array.isArray(parsed[key])) return parsed[key]
    }
    return [parsed]
  } catch { return [] }
}

function estimateLLMCost(usage: { prompt_tokens: number; completion_tokens: number }): number {
  return (usage.prompt_tokens / 1e6) * 0.15 + (usage.completion_tokens / 1e6) * 0.60
}

// ── Image generation via OpenRouter ─────────────────────────────
async function generateImage(prompt: string, preset: PresetConfig): Promise<{ blob: Blob; model: string; cost: number }> {
  const model = preset.image_model || 'black-forest-labs/flux.2-pro'
  const apiKey = Deno.env.get('OPENROUTER_API_KEY')
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set')

  // OpenRouter uses chat completions for image gen, images returned in message.images
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://aireadalong.com',
      'X-Title': 'AIReadAlong Picturebook',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: `Generate an image: ${prompt}. Return only the image, no text.` }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`OpenRouter image error: ${(err as any).error?.message || res.status}`)
  }

  const data = await res.json()
  const baseCost = data.usage?.cost ?? 0.04

  // OpenRouter returns images in message.images array as data URIs
  const msg = data.choices?.[0]?.message
  const images = msg?.images || []
  const imgObj = images[0]
  if (!imgObj) throw new Error('No image in response')

  const dataUri: string = imgObj.image_url?.url || imgObj.url || ''
  if (!dataUri.startsWith('data:image')) throw new Error('Invalid image data URI')

  // Extract base64 from data URI
  const b64 = dataUri.split(',')[1]
  if (!b64) throw new Error('Empty image data')

  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
  return { blob: new Blob([bytes], { type: 'image/png' }), model, cost: baseCost }
}

async function generateAllImages(
  db: any, userId: string, bookId: number, runId: number,
  moments: any[], preset: PresetConfig,
  book?: any, presetName?: string, // for assembleBook at the end
) {
  let completed = 0, totalCost = 0
  const CONCURRENCY = 4

  const processOne = async (moment: any) => {
    try {
      const prompt = moment.image_prompt || `${moment.scene_description}. Style: ${preset.image_style}`
      const imageResult = await generateImage(prompt, preset)

      const imagePath = `${userId}/picturebook_${bookId}_m${moment.moment_index}_${Date.now()}.png`
      const { error: uploadError } = await db.storage.from('page-images').upload(imagePath, imageResult.blob, { contentType: 'image/png', cacheControl: '3600' })
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)
      // Store the storage path, not a URL — reader signs on the fly
      await db.from('picturebook_moments').update({
        image_url: imagePath, image_model: imageResult.model, image_size: preset.image_size, generation_status: 'completed',
      }).eq('book_id', bookId).eq('user_id', userId).eq('moment_index', moment.moment_index)

      await db.from('api_usage').insert({
        user_id: userId, api_provider: 'openrouter', model: imageResult.model,
        endpoint_type: 'image', request_type: 'picturebook_image',
        input_tokens: 0, output_tokens: 0, base_cost: imageResult.cost, markup_multiplier: 2.0,
        book_id: bookId, request_metadata: { size: preset.image_size, moment_index: moment.moment_index },
      })

      const chargedCost = imageResult.cost * 2
      totalCost += chargedCost
      completed++
    } catch (err: any) {
      console.error(`Failed moment ${moment.moment_index}:`, err)
      await db.from('picturebook_moments').update({ generation_status: 'failed', generation_error: err.message })
        .eq('book_id', bookId).eq('user_id', userId).eq('moment_index', moment.moment_index)
    }
    // Update progress after each (success or fail)
    await db.from('picturebook_runs').update({ completed_moments: completed, total_cost: totalCost }).eq('id', runId)
  }

  // Process in parallel batches of CONCURRENCY
  for (let i = 0; i < moments.length; i += CONCURRENCY) {
    const batch = moments.slice(i, i + CONCURRENCY)
    await Promise.all(batch.map(processOne))
  }
  // Assemble the book before marking complete (survives HTTP timeout)
  let newBookId: number | null = null
  if (completed > 0 && book && presetName) {
    try {
      newBookId = await assembleBook(db, userId, bookId, book, moments, preset, presetName, { completed, totalCost })
    } catch (e) { console.error('assembleBook error:', e) }
  }

  await db.from('picturebook_runs').update({
    status: completed > 0 ? 'completed' : 'failed', completed_moments: completed,
    total_cost: totalCost, completed_at: new Date().toISOString(),
    // Store the new book ID in result metadata
    ...(newBookId ? { error: null } : {}),
  }).eq('id', runId)
  await reportOverageIfNeeded(db, userId)
  return { completed, totalCost, bookId: newBookId }
}

async function assembleBook(
  db: any, userId: string, bookId: number, book: any,
  moments: any[], preset: PresetConfig, presetName: string,
  results: { completed: number; totalCost: number },
): Promise<number | null> {
  // Get the completed moments with image URLs
  const { data: completedMoments } = await db
    .from('picturebook_moments')
    .select('after_text, caption, image_url, moment_index')
    .eq('book_id', bookId)
    .eq('user_id', userId)
    .eq('generation_status', 'completed')
    .order('moment_index', { ascending: true })

  if (!completedMoments?.length) return null

  // Get original text from storage
  let fullText = ''
  const { data: storageData } = await db.storage.from('books').download(book.file_path)
  if (storageData) fullText = await storageData.text()
  if (!fullText) return null

  // Insert images into text at identified positions (reverse order to preserve offsets)
  let pbText = fullText
  const insertions: [number, any][] = []
  for (const m of completedMoments) {
    const after = m.after_text || ''
    let pos = pbText.indexOf(after)
    if (pos < 0) pos = pbText.toLowerCase().indexOf(after.substring(0, 40).toLowerCase())
    if (pos >= 0) {
      insertions.push([pos + after.length, m])
    }
  }
  // Sort descending so earlier inserts don't shift later positions
  insertions.sort((a, b) => b[0] - a[0])
  for (const [pos, m] of insertions) {
    // Use storage:// scheme — the reader resolves these to signed URLs
    const imgMd = `\n\n![${m.caption || ''}](storage://page-images/${m.image_url})\n*${m.caption || ''}*\n\n`
    pbText = pbText.slice(0, pos) + imgMd + pbText.slice(pos)
  }

  // Append any images that couldn't be placed
  const placedIndices = new Set(insertions.map(([, m]) => m.moment_index))
  for (const m of completedMoments) {
    if (!placedIndices.has(m.moment_index)) {
      pbText += `\n\n![${m.caption || ''}](storage://page-images/${m.image_url})\n*${m.caption || ''}*\n`
    }
  }

  // Upload new book file
  const timestamp = Date.now()
  const slug = book.title.replace(/[^a-z0-9]+/gi, '_').toLowerCase().slice(0, 40)
  const newPath = `${userId}/${timestamp}_${slug}_picturebook.md`

  const { error: uploadErr } = await db.storage
    .from('books')
    .upload(newPath, new Blob([pbText], { type: 'text/markdown' }), { contentType: 'text/markdown' })
  if (uploadErr) { console.error('Upload error:', uploadErr); return null }

  // Create book record
  const charPageLength = book.char_page_length || 420
  const totalPages = Math.max(1, Math.ceil(pbText.length / charPageLength))

  const { data: newBook } = await db.from('books').insert({
    user_id: userId,
    file_path: newPath,
    title: `${book.title} (Picturebook — ${presetName})`,
    content_type: book.content_type || 'fiction',
    char_page_length: charPageLength,
    total_pages: totalPages,
    summary: `Illustrated picturebook version (${presetName} preset, ${results.completed} images)`,
    source_url: `/books/${bookId}`,
  }).select().single()

  if (!newBook) return null

  return newBook.id
}
// deployed 1781891970
