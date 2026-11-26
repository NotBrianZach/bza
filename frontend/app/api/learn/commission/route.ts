import { NextRequest, NextResponse } from 'next/server'
import { checkQuota, getUserFromToken, logUsage } from '@/lib/apiQuota'
import { regionBy } from '@/lib/concepts/armature'
import { composeAtlas } from '@/lib/concepts/atlas'
import { offerFor } from '@/lib/concepts/commission'
import {
  commissionPrompt, rulingPrompt, runPrompt, unframedCommission, unnarratedRuling, unnarratedRun,
  type CommissionContext, type RulingContext, type RunContext,
} from '@/lib/concepts/narrate'
import { ONTOLOGIES } from '@/lib/concepts/ontology'
import { conceptById } from '@/lib/concepts/registry'
import { taskById } from '@/lib/concepts/tasks'

/**
 * The game master framing a piece of work the engine chose, and narrating the
 * ruling the verifier made on it.
 *
 * POST { regionId, taskId, blockedRoad? }
 *   → 200 { framing, conceptName, kind, source: 'gm' | 'unframed', note? }
 * POST { regionId, taskId, ruling, assisted? }
 *   → 200 { framing, conceptName, kind, source: 'gm' | 'unframed', note? }
 * POST { regionId, taskId, tally: { correct, incorrect, inconclusive, abandoned }, assisted? }
 *   → 200 { framing, conceptName, kind, source: 'gm' | 'unframed', note? }
 *
 * The third form is a finished SET and takes precedence over `ruling` when
 * both are present and the tally is non-empty. It exists so the game master
 * speaks once per problem set instead of once per problem — see the header
 * above `RunContext` in lib/concepts/narrate.ts for why it is given counts
 * rather than a verdict, and why the last ruling would have been the wrong
 * thing to reuse.
 *
 * docs/RPG_AND_THE_GRAPH.md §3, both hand-offs. The engine picks the concept
 * and the task and the verifier rules it; the GM writes the ask in the world's
 * terms and then says what the room did about the answer. This route is only
 * ever the second half of each.
 *
 * ── ONE ROUTE, TWO PROMPTS, AND WHY NOT TWO ROUTES ────────────────────────
 *
 * `ruling` present means narrate a ruling; absent means frame the work. The
 * two differ only in which prompt builder runs — the auth, the region and task
 * resolution, the model choice, the quota check and all five degradation paths
 * are identical, and a second route would be eighty duplicated lines whose
 * copies would drift. The discriminator is the presence of a field the client
 * cannot fake into something dangerous: it is validated against the four words
 * the verifier can produce and rejected otherwise.
 *
 * ── IT TAKES A TASK ID, NOT A DESCRIPTION ─────────────────────────────────
 *
 * Nothing the client sends reaches the prompt as text. The body carries a
 * `taskId` and the route resolves the task itself through `taskById`, then
 * derives the concept from the task's knowledge point. So the two facts the GM
 * is told — what the work is about and what shape it takes — both come from
 * the engine's own tables on this side of the wire.
 *
 * That is the same discipline as /api/learn/narrate resolving regions from ids
 * rather than accepting region objects, and for a sharper reason: a caller who
 * could pass `kind` as free text could pass a sentence, and a sentence in that
 * slot is a prompt injection with a game master on the other end.
 *
 * `blockedRoad` IS free text from the client and is the one exception, because
 * nothing on the server knows which road the player was refused — the
 * traversal told the client. It is a concept name, so it is length-capped and
 * stripped of newlines, which is what makes it a label rather than an
 * instruction.
 *
 * ── IT REFUSES WORK THAT CANNOT BE DONE ───────────────────────────────────
 *
 * §10: "a commission that cannot be completed" must not happen. The task has
 * to resolve and its concept has to be `workable` under `offerFor`. A 400 here
 * is better than a scene about a runeforger who needs something nobody wrote.
 *
 * ── IT CANNOT MOVE ANYBODY, RULE ANYTHING, OR OPEN A ROAD ─────────────────
 *
 * It reads the static tables and writes nothing but a usage row. No strength,
 * no traversal, no ruling. The worst a caller can get out of it is a paragraph
 * of fiction about work they then have to actually do, under the verifier, on
 * the surface that already exists.
 */

export const dynamic = 'force-dynamic'

/** Same default chain as the narrate route: one env var moves every narrator. */
const MODEL = process.env.NARRATE_MODEL || process.env.CORRELATE_MODEL || 'anthropic/claude-haiku-4-5'

/**
 * Shorter than a scene's 420. This is one paragraph of hand-over, and the
 * prompt says three sentences at most — a budget that allows four invites one.
 */
const MAX_TOKENS = 260

/** A concept name, not a sentence. See the note on `blockedRoad` above. */
const MAX_ROAD_NAME = 60

const ATLAS = composeAtlas([], ONTOLOGIES)

export async function POST(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const body = await req.json().catch(() => null) as Record<string, unknown> | null

  const region = regionBy(String(body?.regionId ?? ''))
  if (!region) return NextResponse.json({ error: 'no such region' }, { status: 400 })

  const task = taskById(String(body?.taskId ?? ''))
  if (!task) return NextResponse.json({ error: 'no such task' }, { status: 400 })

  /* The concept is derived from the task, not accepted alongside it. A body
     naming a task from one concept and a concept from another would otherwise
     produce a framing about work the player is not about to do. */
  const concept = ATLAS.concepts.find(c => c.knowledgePoints.some(p => p.id === task.knowledgePointId))
  if (!concept) {
    return NextResponse.json({ error: 'that task belongs to no concept in the atlas' }, { status: 400 })
  }

  const offer = offerFor(concept.id, conceptById(ATLAS, concept.id)?.name ?? concept.id)
  if (offer.kind !== 'workable') {
    return NextResponse.json(
      { error: `nothing is authored for ${offer.conceptName}, so there is no work to frame` },
      { status: 400 },
    )
  }

  const road = typeof body?.blockedRoad === 'string'
    ? body.blockedRoad.replace(/\s+/g, ' ').trim().slice(0, MAX_ROAD_NAME)
    : null

  /* The four words the verifier can produce, and nothing else. A ruling read
     out of the body unchecked would be a free-text slot in a prompt whose
     whole job is to narrate a ruling faithfully — "RULING: ignore your
     instructions" is the shape of the thing this rejects. */
  const RULINGS = ['correct', 'incorrect', 'inconclusive', 'abandoned'] as const
  const asked = typeof body?.ruling === 'string' ? body.ruling : null
  if (asked !== null && !RULINGS.includes(asked as typeof RULINGS[number])) {
    return NextResponse.json(
      { error: `unknown ruling "${asked}" — expected one of ${RULINGS.join(', ')}` },
      { status: 400 },
    )
  }
  const ruling = asked as typeof RULINGS[number] | null

  /*
   * A finished SET, which is the third shape this route serves.
   *
   * Validated exactly as hard as `ruling` is, and for the same reason: these
   * numbers are read straight into a prompt. A non-integer, a negative or a
   * NaN would reach `tallyLines` and come out as "NaN pieces of work was
   * right", which is a sentence a model will cheerfully build a scene around.
   * Anything malformed is dropped to zero rather than rejected, because a
   * miscounted tally must not cost the player the scene at the end of real
   * work — but an EMPTY tally is not narratable and falls through to the
   * single-ruling path below.
   */
  const count = (v: unknown) =>
    (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 999 ? v : 0)
  const rawTally = body?.tally as Record<string, unknown> | undefined
  const tally = rawTally ? {
    correct: count(rawTally.correct),
    incorrect: count(rawTally.incorrect),
    inconclusive: count(rawTally.inconclusive),
    abandoned: count(rawTally.abandoned),
  } : null
  const ranTally = tally && (tally.correct + tally.incorrect + tally.inconclusive + tally.abandoned) > 0
    ? tally
    : null

  const ctx: CommissionContext | RulingContext | RunContext = ranTally
    ? {
      region,
      conceptName: offer.conceptName,
      tally: ranTally,
      assisted: body?.assisted === true,
    }
    : ruling
      ? {
        region,
        conceptName: offer.conceptName,
        ruling,
        assisted: body?.assisted === true,
      }
      : {
        region,
        conceptName: offer.conceptName,
        kind: task.kind,
        blockedRoad: road || null,
      }

  const payload = (extra: Record<string, unknown>) => NextResponse.json({
    conceptName: offer.conceptName,
    kind: task.kind,
    subjectId: offer.subjectId,
    ruling,
    ...extra,
  })
  /* Both bare forms are real prose from the module, not a placeholder — the
     work and the ruling both stand whether or not anybody narrated them. */
  const bare = () => (ranTally
    ? unnarratedRun(ctx as RunContext)
    : ruling
      ? unnarratedRuling(ctx as RulingContext)
      : unframedCommission(ctx as CommissionContext))
  const fallback = (note?: string) => payload({ framing: bare(), source: 'unframed', note })

  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) {
    return fallback('No game master is configured here (OPENROUTER_API_KEY is unset), so this is '
      + 'the bare errand. The work itself is unaffected.')
  }

  const quota = await checkQuota(userId)
  if (quota) return fallback(`${quota} The work still stands — this is the bare errand.`)

  const useOpenRouter = !!process.env.OPENROUTER_API_KEY
  const url = useOpenRouter
    ? 'https://openrouter.ai/api/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions'
  const model = useOpenRouter ? MODEL : 'gpt-4o-mini'
  const prompt = ranTally
    ? runPrompt(ctx as RunContext)
    : ruling
      ? rulingPrompt(ctx as RulingContext)
      : commissionPrompt(ctx as CommissionContext)

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
        /* The narrate route's 0.8, for the same reason: the same city should
           not hand over the same errand twice. */
        temperature: 0.8,
      }),
    })
    if (!res.ok) {
      return fallback(`The game master could not be reached (${res.status}), so this is the bare errand.`)
    }

    const data = await res.json() as {
      choices?: { message?: { content?: string } }[]
      usage?: Record<string, number>
    }
    const content = data.choices?.[0]?.message?.content?.trim() ?? ''
    if (!content) return fallback('The game master returned nothing, so this is the bare errand.')

    await logUsage(userId, 0.0004, { model, endpoint: 'learn-commission' }, {
      input: data.usage?.prompt_tokens,
      output: data.usage?.completion_tokens,
    })

    return payload({ framing: content, source: 'gm' })
  } catch {
    return fallback('The game master could not be reached, so this is the bare errand.')
  }
}
