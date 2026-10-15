// Concept Detection Edge Function
// Scans a page for "pinnable" knowledge artifacts and optionally looks them up
// in external databases (OEIS, etc.)
//
// POST /detect-concepts
//   action: 'scan'     — detect concepts on a page
//   action: 'pin'      — pin a detected concept (creates flashcards)
//   action: 'unpin'    — remove a pin
//   action: 'list'     — list pins for a book
//   action: 'oeis'     — look up an OEIS sequence by ID or terms

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { requireAuth, corsResponse, corsError, CORS_HEADERS } from '../_shared/auth.ts'
import { getDefault } from '../_shared/defaults.ts'

const DETECT_PROMPT = `Analyze the following text and identify knowledge artifacts worth studying/memorizing. For each, provide structured data.

Types to detect:
- SEQUENCE: integer sequences (look for patterns like "1, 1, 2, 3, 5, 8" or references to named sequences). Include the terms you can see and suggest an OEIS ID if recognizable.
- THEOREM: named theorems, lemmas, propositions with their statements.
- FORMULA: important equations or formulas.
- CONSTANT: mathematical/physical constants (π, e, c, Avogadro's number, etc.)
- ALGORITHM: named algorithms or computational methods.
- VOCABULARY: important domain-specific terms with definitions.
- EVENT: historical events with dates and significance.
- CONCEPT: general important concepts worth remembering.

Return a JSON array. Each item must have:
{
  "pin_type": "sequence|theorem|formula|constant|algorithm|vocabulary|event|concept",
  "title": "short name",
  "description": "1-2 sentence explanation",
  "source_text": "exact quote from the text that contains this",
  "metadata": { ... type-specific fields ... },
  "external_id": "e.g. A000045 for OEIS, or null",
  "importance": "high|medium|low"
}

For SEQUENCE metadata include: { "terms": [numbers], "oeis_id": "Axxxxxx or null", "formula": "if known" }
For THEOREM metadata include: { "statement": "formal statement", "conditions": "when it applies" }
For FORMULA metadata include: { "latex": "LaTeX representation", "variables": {"x": "description"} }

Return ONLY the JSON array, no other text. If nothing notable is found, return [].`

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const { db, userId } = await requireAuth(req)

    const { action, bookId, pageNum, pageText, concept, pinId, oeisQuery } = await req.json()

    // ── SCAN: Detect concepts on a page ──
    if (action === 'scan') {
      if (!pageText?.trim()) return corsResponse({ concepts: [] })

      const model = await getDefault(db, 'analysis_model')
      const useOpenRouter = model.includes('/')
      const apiUrl = useOpenRouter ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions'
      const apiKey = useOpenRouter ? Deno.env.get('OPENROUTER_API_KEY') : Deno.env.get('OPENAI_API_KEY')
      const headers: Record<string, string> = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
      if (useOpenRouter) { headers['HTTP-Referer'] = 'https://aireadalong.com' }

      const res = await fetch(apiUrl, {
        method: 'POST', headers,
        body: JSON.stringify({
          model, temperature: 0.3, max_tokens: 2000,
          messages: [
            { role: 'system', content: DETECT_PROMPT },
            { role: 'user', content: pageText.slice(0, 5000) },
          ],
        }),
      })

      if (!res.ok) throw new Error(`LLM error: ${res.status}`)
      const data = await res.json()
      const raw = data.choices?.[0]?.message?.content || '[]'

      // Parse JSON from response
      let concepts: any[] = []
      try {
        let clean = raw.trim()
        const fenceMatch = clean.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (fenceMatch) clean = fenceMatch[1].trim()
        if (!clean.startsWith('[')) {
          const arrStart = clean.indexOf('[')
          if (arrStart >= 0) clean = clean.slice(arrStart)
        }
        concepts = JSON.parse(clean)
        if (!Array.isArray(concepts)) concepts = []
      } catch { concepts = [] }

      // Enrich sequences with OEIS data
      for (const c of concepts) {
        if (c.pin_type === 'sequence' && c.metadata?.terms?.length >= 3) {
          try {
            const oeis = await lookupOEIS(c.metadata.terms, c.metadata.oeis_id)
            if (oeis) {
              c.metadata.oeis_id = oeis.id
              c.metadata.oeis_name = oeis.name
              c.metadata.oeis_formula = oeis.formula
              c.external_id = oeis.id
              c.external_url = `https://oeis.org/${oeis.id}`
              if (!c.description || c.description.length < oeis.name.length) {
                c.description = oeis.name
              }
            }
          } catch {}
        }
      }

      // Log usage
      if (data.usage) {
        const cost = (data.usage.prompt_tokens / 1e6) * 0.15 + (data.usage.completion_tokens / 1e6) * 0.60
        await db.from('api_usage').insert({
          user_id: userId, api_provider: useOpenRouter ? 'openrouter' : 'openai', model,
          endpoint_type: 'chat', request_type: 'concept_detection',
          input_tokens: data.usage.prompt_tokens, output_tokens: data.usage.completion_tokens,
          base_cost: cost, markup_multiplier: 2.0, book_id: bookId, page_num: pageNum,
        }).catch(() => {})
      }

      // Check which concepts are already pinned
      const { data: existing } = await db.from('concept_pins')
        .select('title, pin_type')
        .eq('user_id', userId).eq('book_id', bookId)

      const pinnedSet = new Set((existing || []).map((e: any) => `${e.pin_type}:${e.title}`))
      for (const c of concepts) {
        c.already_pinned = pinnedSet.has(`${c.pin_type}:${c.title}`)
      }

      return corsResponse({ concepts })
    }

    // ── PIN: Save a concept and generate flashcards ──
    if (action === 'pin') {
      if (!concept) return corsError('concept required')

      const { data: pin } = await db.from('concept_pins').insert({
        user_id: userId, book_id: bookId, page_num: pageNum,
        pin_type: concept.pin_type || 'concept',
        title: concept.title,
        description: concept.description,
        source_text: concept.source_text,
        metadata: concept.metadata || {},
        external_url: concept.external_url || null,
        external_source: concept.external_id ? (concept.pin_type === 'sequence' ? 'oeis' : null) : null,
      }).select().single()

      if (!pin) return corsError('Failed to save pin')

      // Generate flashcards based on pin type
      const cards = generateCards(pin)
      if (cards.length > 0) {
        const { error: cardErr } = await db.from('flashcards').insert(
          cards.map(c => ({
            user_id: userId, book_id: bookId, page_num: pageNum,
            front: c.front, back: c.back, source_text: concept.source_text,
            topic_tag: concept.title, pin_id: pin.id, card_type: c.card_type,
          }))
        )
        if (!cardErr) {
          await db.from('concept_pins').update({ cards_generated: true, card_count: cards.length }).eq('id', pin.id)
        }
      }

      return corsResponse({ pin, cards_generated: cards.length })
    }

    // ── UNPIN: Remove a pin and its cards ──
    if (action === 'unpin') {
      if (!pinId) return corsError('pinId required')
      await db.from('flashcards').delete().eq('pin_id', pinId).eq('user_id', userId)
      await db.from('concept_pins').delete().eq('id', pinId).eq('user_id', userId)
      return corsResponse({ ok: true })
    }

    // ── LIST: Get pins for a book ──
    if (action === 'list') {
      const { data: pins } = await db.from('concept_pins')
        .select('*')
        .eq('user_id', userId)
        .eq('book_id', bookId || 0)
        .order('pinned_at', { ascending: false })

      return corsResponse({ pins: pins || [] })
    }

    // ── OEIS: Direct OEIS lookup ──
    if (action === 'oeis') {
      if (!oeisQuery) return corsError('oeisQuery required (sequence ID or comma-separated terms)')
      const terms = oeisQuery.startsWith('A')
        ? null
        : oeisQuery.split(',').map((t: string) => parseInt(t.trim())).filter((n: number) => !isNaN(n))
      const result = await lookupOEIS(terms, oeisQuery.startsWith('A') ? oeisQuery : null)
      return corsResponse({ result })
    }

    return corsError('Unknown action. Use: scan, pin, unpin, list, oeis')
  } catch (error: any) {
    console.error('concept-detect error:', error)
    return corsError(error.message || 'Internal error', 500)
  }
})

// ── OEIS lookup ──
async function lookupOEIS(terms?: number[] | null, id?: string | null): Promise<{
  id: string; name: string; terms: number[]; formula: string | null; url: string
} | null> {
  try {
    let url: string
    if (id) {
      url = `https://oeis.org/search?fmt=json&q=id:${id}`
    } else if (terms && terms.length >= 3) {
      url = `https://oeis.org/search?fmt=json&q=${terms.join(',')}`
    } else {
      return null
    }

    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const result = data.results?.[0]
    if (!result) return null

    return {
      id: `A${String(result.number).padStart(6, '0')}`,
      name: result.name || '',
      terms: (result.data || '').split(',').slice(0, 15).map(Number),
      formula: result.formula?.[0] || null,
      url: `https://oeis.org/A${String(result.number).padStart(6, '0')}`,
    }
  } catch {
    return null
  }
}

// ── Generate flashcards from a pin ──
function generateCards(pin: any): { front: string; back: string; card_type: string }[] {
  const cards: { front: string; back: string; card_type: string }[] = []
  const meta = pin.metadata || {}

  switch (pin.pin_type) {
    case 'sequence': {
      const terms = meta.terms || []
      if (terms.length >= 4) {
        // Card 1: What comes next?
        const shown = terms.slice(0, -2)
        const answer = terms.slice(-2)
        cards.push({
          front: `What are the next two terms?\n${shown.join(', ')}, ?, ?`,
          back: `${shown.join(', ')}, **${answer.join(', ')}**\n\n${pin.title}${meta.oeis_id ? ` (${meta.oeis_id})` : ''}${meta.formula ? `\nFormula: ${meta.formula}` : ''}`,
          card_type: 'next_term',
        })
        // Card 2: Name this sequence
        cards.push({
          front: `Name this sequence:\n${terms.slice(0, 8).join(', ')}, ...`,
          back: `**${pin.title}**${meta.oeis_id ? ` — ${meta.oeis_id}` : ''}\n\n${pin.description || ''}`,
          card_type: 'name_sequence',
        })
      }
      if (meta.formula) {
        cards.push({
          front: `What is the formula for the ${pin.title}?`,
          back: `${meta.formula}`,
          card_type: 'formula',
        })
      }
      break
    }
    case 'theorem': {
      cards.push({
        front: `State the **${pin.title}**`,
        back: meta.statement || pin.description || '',
        card_type: 'state_theorem',
      })
      if (meta.conditions) {
        cards.push({
          front: `When does the **${pin.title}** apply?`,
          back: meta.conditions,
          card_type: 'conditions',
        })
      }
      break
    }
    case 'formula': {
      cards.push({
        front: `What is the formula for **${pin.title}**?`,
        back: `${meta.latex || pin.description || ''}${meta.variables ? '\n\nVariables: ' + Object.entries(meta.variables).map(([k, v]) => `${k} = ${v}`).join(', ') : ''}`,
        card_type: 'formula',
      })
      break
    }
    case 'constant': {
      cards.push({
        front: `What is the value of **${pin.title}**${meta.symbol ? ` (${meta.symbol})` : ''}?`,
        back: `${meta.value || pin.description}${meta.domain ? `\nDomain: ${meta.domain}` : ''}`,
        card_type: 'value',
      })
      break
    }
    case 'vocabulary': {
      cards.push({
        front: `Define: **${pin.title}**`,
        back: meta.definition || pin.description || '',
        card_type: 'definition',
      })
      break
    }
    case 'event': {
      cards.push({
        front: `What happened: **${pin.title}**?`,
        back: `${meta.date ? `Date: ${meta.date}\n\n` : ''}${pin.description || meta.significance || ''}`,
        card_type: 'event',
      })
      if (meta.date) {
        cards.push({
          front: `When did **${pin.title}** occur?`,
          back: meta.date,
          card_type: 'date',
        })
      }
      break
    }
    default: {
      cards.push({
        front: `What is **${pin.title}**?`,
        back: pin.description || '',
        card_type: 'concept',
      })
    }
  }

  return cards
}
