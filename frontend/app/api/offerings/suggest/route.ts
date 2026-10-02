import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken, logUsage } from '@/lib/apiQuota'
import { createSupabaseServerClient } from '@/lib/supabaseServerClient'
import { getMedium } from '@/lib/correlate/media'
import { parseJsonObject } from '@/lib/correlate/prompt'
import {
  buildSuggestPrompt, buildSuggestSystemPrompt, describeDraftRejection, normalizeBrief,
  normalizeRejected, parseSuggestion,
} from '@/lib/offerings'
import type { MediumId } from '@/lib/correlate/types'

/**
 * Draft one composed offering for the player, from a one-line brief.
 *
 * The counterpart to /api/offerings/search, and the asymmetry between them is the
 * point. Search asks a catalogue what exists. This asks for something to be
 * written. A catalogued medium must never come through here — "suggest a song"
 * means "invent a track", and the entire search guard exists to stop that — so a
 * non-composed medium is a 400 rather than a fallback.
 *
 * Nothing is persisted. A draft is a value handed back to the picker's fields,
 * identical in kind to what the player would have typed, and it becomes a move only
 * when they submit one. That is what makes discarding free: there is no row to
 * delete, no relation spent, and no turn in the chain that has to be unwound.
 *
 * POST { medium, brief?, rejected?: string[] } -> { draft } | { error }
 */

const MODEL = process.env.LISTEN_MODEL || process.env.CORRELATE_MODEL || 'anthropic/claude-haiku-4-5'

/**
 * Two attempts, because the failure modes are transient in exactly the way a retry
 * fixes: a draft that came back as prose, or one that repeated a discarded title.
 * Beyond that it is not bad luck and asking again wastes the player's time.
 */
const MAX_ATTEMPTS = 2

async function resolveUserId(req: NextRequest): Promise<string | null> {
  const fromBearer = await getUserFromToken(req.headers.get('authorization'))
  if (fromBearer) return fromBearer

  let response = NextResponse.next()
  const supabase = createSupabaseServerClient(req, () => response, (r) => { response = r })
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Expected a JSON body' }, { status: 400 })
  }

  const mediumId = (body.medium ?? '') as MediumId
  const medium = getMedium(mediumId)
  if (!medium) return NextResponse.json({ error: `Unknown medium "${mediumId}"` }, { status: 400 })
  if (medium.origin !== 'composed') {
    return NextResponse.json(
      { error: `A ${medium.name} is looked up, not drafted — search for one instead.` },
      { status: 400 },
    )
  }

  const userId = await resolveUserId(req)
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Drafting is unavailable on this deployment. Write one yourself — the fields are the same.' },
      { status: 503 },
    )
  }
  const useOpenRouter = !!process.env.OPENROUTER_API_KEY
  const apiUrl = useOpenRouter
    ? 'https://openrouter.ai/api/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions'
  const modelId = useOpenRouter ? MODEL : 'gpt-4o-mini'

  const brief = normalizeBrief(body.brief)
  // Grows by one on every discard, so each attempt is constrained by every title
  // the player has already thrown away. Without this the button resamples the same
  // distribution and returns the same three answers.
  const rejected = normalizeRejected(body.rejected)

  const system = buildSuggestSystemPrompt()
  const user = buildSuggestPrompt({
    medium: mediumId,
    mediumName: medium.name,
    framingHint: medium.framingHint,
    brief,
    rejected,
  })

  let lastProblem = ''

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        ...(useOpenRouter
          ? { 'HTTP-Referer': 'https://aireadalong.com', 'X-Title': 'AI Play Along' }
          : {}),
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        max_tokens: 500,
        // Higher than the turn interpreter's. A draft the player can throw away for
        // free should reach further than a reply that lands in the permanent record.
        temperature: 1.0,
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.warn(`[suggest] HTTP ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`)
      return NextResponse.json(
        { error: 'Could not draft one just now. Try again, or write one yourself.' },
        { status: 502 },
      )
    }

    logUsage(userId, 0.001, { model: modelId, endpoint: 'offerings-suggest' })
    const data = await res.json()
    const raw = data?.choices?.[0]?.message?.content ?? ''

    const result = parseSuggestion(parseJsonObject(raw), { medium: mediumId, rejected })
    if (result.ok) {
      return NextResponse.json({ draft: result.draft, attempts: attempt })
    }

    lastProblem = describeDraftRejection(result.rejection)
    console.warn(`[suggest] ${mediumId} attempt ${attempt}/${MAX_ATTEMPTS}: ${lastProblem}`)
  }

  // The player gets a plain "try again", not the internal reason: every rejection
  // here is our draft failing our own guard, so correcting them would be blaming
  // them for it.
  return NextResponse.json(
    { error: 'Could not draft one that holds up. Try again, or write one yourself.' },
    { status: 502 },
  )
}
