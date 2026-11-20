import { NextRequest, NextResponse } from 'next/server'
import { checkQuota, getUserFromToken, logUsage } from '@/lib/apiQuota'
import { regionBy } from '@/lib/concepts/armature'
import { scenePrompt, unnarratedScene, type SceneContext, type SceneKind } from '@/lib/concepts/narrate'

/**
 * One scene, for one move of a journey in RPG mode.
 *
 * POST { kind, regionId, fromRegionId?, offered?, arrivedAt?, missing?[], visited?[] }
 *   → 200 { scene, source: 'gm' | 'unnarrated', note? }
 *
 * ── THIS ROUTE CANNOT MOVE ANYBODY ────────────────────────────────────────
 *
 * It reads nothing and writes nothing. The journey lives in
 * `concept_traversals` and only /api/learn/traverse touches it, which is the
 * property that keeps the narration honest: a GM that could advance the world
 * would be a language model holding the gate that traversal.ts says must never
 * relax. Here the client has already been told what happened by the route that
 * decided it, and comes here only for words about it.
 *
 * The consequence worth stating plainly, because it looks like a weakness and
 * is the point: a caller could lie to this route about the outcome and get a
 * scene describing something that did not happen. It would still not have
 * moved — the map, the keys and the next refusal all come from the traversal,
 * which would be unchanged. The worst available outcome is a paragraph of
 * fiction, which is what this route produces on its best day.
 *
 * ── DEGRADATION ──────────────────────────────────────────────────────────
 *
 * No key, no quota, a bad response, no response: every path returns a real
 * scene from `unnarratedScene` and says which piece is missing. RPG mode is
 * playable with no model configured; it is simply not narrated. Same
 * discipline as the socratic route.
 */

export const dynamic = 'force-dynamic'

/**
 * `CORRELATE_MODEL` by default, so one env var still moves every narrating
 * surface at once. A separate knob exists because this one wants a writer
 * rather than a reasoner, and the cheap models are noticeably worse at two
 * paragraphs of restrained second person than they are at arithmetic.
 */
const MODEL = process.env.NARRATE_MODEL || process.env.CORRELATE_MODEL || 'anthropic/claude-haiku-4-5'

/**
 * Two short paragraphs, with room to finish the last sentence.
 *
 * Not tight: a truncated scene is worse than a short one, and some models —
 * DeepSeek V4 among them — spend tokens before the first word and return null
 * content rather than partial text if the budget runs out. See the note in
 * AiModelsSection.
 */
const MAX_TOKENS = 420

const KINDS: SceneKind[] = ['start', 'arrive', 'blocked', 'not-yours', 'spent']

export async function POST(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const body = await req.json().catch(() => null) as Record<string, unknown> | null
  const kind = String(body?.kind ?? '') as SceneKind
  if (!KINDS.includes(kind)) {
    return NextResponse.json(
      { error: `unknown scene kind "${kind}" — expected one of ${KINDS.join(', ')}` },
      { status: 400 },
    )
  }

  /* Regions are resolved from ids HERE rather than accepted as objects. A
     caller handing over a region could rename a place, move it, or rewrite
     what the setting says it is, and the scene would dutifully describe
     somewhere that does not exist. */
  const region = regionBy(String(body?.regionId ?? ''))
  if (!region) {
    return NextResponse.json({ error: 'no such region' }, { status: 400 })
  }
  const from = body?.fromRegionId ? regionBy(String(body.fromRegionId)) : null

  const ctx: SceneContext = {
    kind,
    region,
    from: from && from.id !== region.id ? from : null,
    offered: typeof body?.offered === 'string' ? body.offered : undefined,
    arrivedAt: typeof body?.arrivedAt === 'string' ? body.arrivedAt : undefined,
    missing: Array.isArray(body?.missing)
      ? (body.missing as unknown[]).filter((m): m is string => typeof m === 'string').slice(0, 6)
      : undefined,
    visited: Array.isArray(body?.visited)
      ? (body.visited as unknown[]).filter((v): v is string => typeof v === 'string').slice(-8)
      : undefined,
  }

  const fallback = (note?: string) =>
    NextResponse.json({ scene: unnarratedScene(ctx), source: 'unnarrated', note })

  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) {
    return fallback('No game master is configured here (OPENROUTER_API_KEY is unset), so this is '
      + 'the bare situation. The journey itself is unaffected.')
  }

  const quota = await checkQuota(userId)
  if (quota) return fallback(`${quota} The journey still works — this is the bare situation.`)

  const useOpenRouter = !!process.env.OPENROUTER_API_KEY
  const url = useOpenRouter
    ? 'https://openrouter.ai/api/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions'
  const model = useOpenRouter ? MODEL : 'gpt-4o-mini'
  const prompt = scenePrompt(ctx)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user },
        ],
        max_tokens: MAX_TOKENS,
        /* Higher than the socratic route's 0.4. That one wants one good
           question and repeatability; this one wants the same city to read
           differently on a second visit, which is most of what makes a place
           feel like a place. */
        temperature: 0.8,
      }),
    })
    if (!res.ok) {
      return fallback(`The game master could not be reached (${res.status}), so this is the bare situation.`)
    }

    const data = await res.json() as {
      choices?: { message?: { content?: string } }[]
      usage?: Record<string, number>
    }
    const content = data.choices?.[0]?.message?.content?.trim() ?? ''
    if (!content) {
      return fallback('The game master returned nothing, so this is the bare situation.')
    }

    await logUsage(userId, 0.0006, { model, endpoint: 'learn-narrate' }, {
      input: data.usage?.prompt_tokens,
      output: data.usage?.completion_tokens,
    })

    return NextResponse.json({ scene: content, source: 'gm' })
  } catch {
    return fallback('The game master could not be reached, so this is the bare situation.')
  }
}
