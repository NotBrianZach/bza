import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken, checkQuota, logUsage } from '@/lib/apiQuota'

/**
 * Parse manga/comic page images through a vision model.
 * Extracts panel-by-panel descriptions, dialogue, and scene details
 * that can be used for re-prompting image generation.
 *
 * POST body: { imageBase64, pageNum, bookTitle?, model? }
 * Returns: { panels: [{ index, description, dialogue, mood, characters }], pageDescription }
 */
export async function POST(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (userId) {
    const quotaErr = await checkQuota(userId)
    if (quotaErr) return NextResponse.json({ error: quotaErr }, { status: 429 })
  }

  const { imageBase64, pageNum, bookTitle, model: requestModel } = await req.json()

  if (!imageBase64) {
    return NextResponse.json({ error: 'imageBase64 is required' }, { status: 400 })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'No API key configured' }, { status: 501 })
  }

  const modelId = requestModel || 'google/gemini-2.5-flash'

  const systemPrompt = `You are an expert manga/comic panel analyzer. Given an image of a manga or comic page, analyze it panel by panel.

For each panel, provide:
- **index**: Panel number (top-to-bottom, right-to-left for manga, left-to-right for western comics)
- **description**: Detailed visual description of the scene, art style, composition, and action. Include enough detail that an image generation model could recreate this panel.
- **dialogue**: Any text/speech bubbles in the panel (preserve original language, add translation if non-English)
- **sound_effects**: Onomatopoeia or SFX text
- **mood**: The emotional tone (e.g. "tense", "comedic", "melancholic")
- **characters**: Characters visible and their expressions/poses

Also provide a brief overall pageDescription summarizing the narrative of this page.

Return valid JSON in this format:
{
  "pageDescription": "Brief narrative summary of the page",
  "readingDirection": "rtl" or "ltr",
  "panels": [
    {
      "index": 1,
      "description": "Detailed visual description...",
      "dialogue": "Character: dialogue text",
      "sound_effects": "CRASH, whoosh",
      "mood": "tense",
      "characters": ["Character A (angry)", "Character B (scared)"]
    }
  ]
}`

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://aireadalong.com',
        'X-Title': 'AI Read Along - Manga Parser',
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this ${bookTitle ? `page from "${bookTitle}"` : 'manga/comic page'} (page ${pageNum ?? '?'}). Return JSON with panel-by-panel breakdown.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      return NextResponse.json({ error: errText || `API error (${response.status})` }, { status: response.status })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || '{}'

    if (userId) {
      logUsage(userId, modelId, 0, content.length).catch(() => {})
    }

    try {
      // Try to parse the JSON response, handling markdown code fences
      let jsonStr = content.trim()
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      }
      const parsed = JSON.parse(jsonStr)
      return NextResponse.json(parsed)
    } catch {
      // If JSON parse fails, return the raw content
      return NextResponse.json({
        pageDescription: content,
        panels: [],
        parseError: 'Could not parse structured panel data',
      })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Vision model call failed' }, { status: 500 })
  }
}
