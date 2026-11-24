import { NextRequest, NextResponse } from 'next/server'
import { checkQuota, getUserFromToken, logUsage } from '@/lib/apiQuota'
import { regionBy } from '@/lib/concepts/armature'
import {
  parseRollExpression, splitRollRequest, splitWorkRequest, tablePrompt, type TableTurn,
} from '@/lib/concepts/narrate'
import {
  fairDraw, normalizeCharacter, rollFor, sheetFor, type Tag, type Tier,
} from '@/lib/concepts/rpg'

/**
 * One turn at the table: the player says what they do, the game master answers.
 *
 * POST { regionId, character, held[], log[], action?, resolved?, ruled? }
 *   → 200 { text, roll?, work?, source }
 *
 * ── THE SERVER ROLLS, NOT THE MODEL AND NOT THE BROWSER ───────────────────
 *
 * The game master returns a tag expression and stops; this route parses it and
 * rolls it with `fairDraw`. Both halves of that matter and for different
 * reasons.
 *
 * Not the model, because a game master that writes its own numbers is a game
 * master whose dice are prose — it will roll what the scene wants, every time,
 * and the tag system becomes decoration.
 *
 * Not the browser, because a roll the player owns is a roll the player can
 * retake. That is tolerable in a single-player game and still not what a table
 * is: the dice being outside your reach is the entire reason anybody trusts
 * them.
 *
 * ── IT STILL CANNOT MOVE ANYBODY ──────────────────────────────────────────
 *
 * Like /api/learn/narrate, this reads and writes no journey. The traversal in
 * `concept_traversals` is untouched: no sentence a player types and no number
 * these dice produce can open a prerequisite, reach a concept, or rule on an
 * answer. Dice settle what happens in the fiction. What you know is settled by
 * the verifier, on work, one tab away.
 *
 * `held` arrives from the client and is used only as FLAVOUR — the names on
 * the character sheet the model is shown. A caller could inflate it and the
 * only consequence is a game master that mentions tags they have not earned,
 * which changes nothing about the map, the roads, or what the practice engine
 * will give them. It is not a gate, so it does not need to be trusted like one.
 */

export const dynamic = 'force-dynamic'

const MODEL = process.env.NARRATE_MODEL || process.env.CORRELATE_MODEL || 'anthropic/claude-haiku-4-5'
const MAX_TOKENS = 500
/** Enough rope for a scene, not enough to paste a chapter into the context. */
const MAX_ACTION = 600

/**
 * The work a `WORK:` request resolves to, or null when there is none here.
 *
 * Mirrors the task fields the practice panel is given, and withholds the same
 * one: the reference answer stays on the server. A table that held the answer
 * is a table that can be read.
 */
interface TableWork {
  taskId: string
  conceptId: string
  conceptName: string
  subjectId: string
  kind: string
  prompt: string
  given: string
  form: unknown
  at: Record<string, string> | null
  variables: { name: string; assumptions?: Record<string, boolean> }[]
  domainConditions: string[]
}

/**
 * Choose the work, from the scheduler rather than from the story.
 *
 * docs/RPG_AND_THE_GRAPH.md §3: "A model asked to invent a task will invent
 * one that sounds good, and the engine's task selection is doing real work —
 * introducibility, interference, cooldown, the mastery floor." So the GM says
 * that work is needed and this decides what it is, through the same
 * `assemble()` the Practice tab calls.
 *
 * ── THE SUBJECT IS THE PLACE'S ────────────────────────────────────────────
 *
 * Work in Krull is Krull's mathematics. A region declares its authored
 * subjects in `armature.ts`, and only 5 of the 21 have any — so a `WORK:` in
 * one of the other sixteen resolves to NOTHING, deliberately, and the caller
 * says so rather than reaching for another region's material.
 *
 * That is §8's first option ("say so") and it is also the only honest answer:
 * a commission in a region with nothing recorded is the failure mode that
 * whole section exists to avoid. It doubles as the demand signal §8 wants —
 * a `WORK:` that found nothing is a player asking for material in a named
 * place, which is a more specific authoring request than any heuristic.
 *
 * ── AND IT MAY STILL COME BACK EMPTY ──────────────────────────────────────
 *
 * Even in an authored region, `assemble()` can return nothing: everything may
 * be on cooldown, or blocked behind an unmet prerequisite. Null again, and
 * the scene stands on its own. A table that invented a problem because the
 * scheduler had none would be the exact thing this function exists to stop.
 */
async function pickWork(userId: string, region: { id: string }): Promise<TableWork | null> {
  const { regions } = await import('@/lib/concepts/armature')
  const { getOntology } = await import('@/lib/concepts/ontology')
  const { conceptById } = await import('@/lib/concepts/registry')
  const { assemble } = await import('@/lib/concepts/scheduling')
  const { liveClaims, loadJourney, loadStrengths } = await import('@/lib/concepts/store')

  const placed = regions().find(r => r.id === region.id)
  const authored = placed?.authored ?? []
  if (authored.length === 0) return null

  const now = new Date().toISOString()
  const [strengths, world] = await Promise.all([
    loadStrengths(userId),
    loadJourney(userId),
  ])

  for (const subjectId of authored) {
    const ontology = getOntology(subjectId)
    if (!ontology) continue
    let claimed: Set<string> | undefined
    try {
      claimed = await liveClaims(userId, subjectId)
    } catch {
      claimed = undefined
    }
    /*
     * `reached`, derived exactly as /api/learn/session derives it, including
     * the empty-means-undefined rule: `reached` is a HARD filter in
     * `assemble`, so an empty array would serve nothing at all, and "has not
     * reached anything in THIS subject" has to fall back to the mastery floor
     * rather than to silence.
     *
     * Passing it matters more here than it looks. Omitting it would make work
     * at the table LOOSER than work on the Practice tab for the same player —
     * the table could pose a concept they have not reached in the traversal,
     * while the tab would not. A surface inside the fiction being the lax one
     * is precisely backwards.
     */
    const reachedHere = world.route.filter(id => conceptById(ontology, id))
    const reached = reachedHere.length > 0 ? reachedHere : undefined
    /* size 1: the table seats one problem at a time. A scene with a queue
       behind it would be a practice set wearing a costume. */
    const assembly = assemble({ ontology, strengths, now, size: 1, reached, claimed })
    const task = assembly.tasks[0]
    if (!task) continue
    const concept = ontology.concepts.find(
      c => c.knowledgePoints.some(p => p.id === task.knowledgePointId))
    if (!concept) continue
    return {
      taskId: task.id,
      conceptId: concept.id,
      conceptName: conceptById(ontology, concept.id)?.name ?? concept.id,
      subjectId,
      kind: task.kind,
      prompt: task.prompt,
      given: task.given,
      form: task.form ?? null,
      at: task.at ?? null,
      variables: task.variables,
      domainConditions: task.domainConditions ?? [],
    }
  }
  return null
}

export async function POST(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const body = await req.json().catch(() => null) as Record<string, unknown> | null
  const region = regionBy(String(body?.regionId ?? ''))
  if (!region) return NextResponse.json({ error: 'no such region' }, { status: 400 })

  const action = String(body?.action ?? '').trim().slice(0, MAX_ACTION)
  const resolved = body?.resolved as TableTurn['roll'] | undefined
  /*
   * A ruling to narrate, validated against the four words the verifier can
   * produce. Same discipline as the commission route: this reaches a prompt,
   * so an unvalidated string here would be a free-text slot with a game
   * master on the other end.
   *
   * The CLIENT reporting the ruling is not a trust hole worth closing — it is
   * telling the table what the verify route already recorded, and a caller who
   * lied would get a paragraph of fiction about work whose real ruling is
   * already in `practice_observations`. Strength, the gate and the next
   * problem are all unaffected. Same reasoning the header gives for `held`.
   */
  const RULINGS = ['correct', 'incorrect', 'inconclusive', 'abandoned'] as const
  const rawRuled = body?.ruled as { conceptName?: unknown; ruling?: unknown; assisted?: unknown } | undefined
  const ruled = rawRuled && RULINGS.includes(rawRuled.ruling as typeof RULINGS[number])
    ? {
      conceptName: String(rawRuled.conceptName ?? 'the work').slice(0, 80),
      ruling: rawRuled.ruling as typeof RULINGS[number],
      assisted: rawRuled.assisted === true,
    }
    : undefined
  if (!action && !resolved && !ruled) {
    return NextResponse.json({ error: 'say what you do' }, { status: 400 })
  }

  /* Normalised, not cast. The cast was a claim about a request body. */
  const character = normalizeCharacter(body?.character)
  const held = Array.isArray(body?.held)
    ? (body.held as unknown[]).filter((h): h is string => typeof h === 'string')
    : []
  const log = Array.isArray(body?.log) ? (body.log as TableTurn[]) : []

  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({
      text: 'No game master is configured here (OPENROUTER_API_KEY is unset), so there is nobody '
        + 'to answer at the table. Travelling on the map still works.',
      source: 'unnarrated',
    })
  }

  const quota = await checkQuota(userId)
  if (quota) return NextResponse.json({ text: quota, source: 'unnarrated' })

  const prompt = tablePrompt({
    sheet: sheetFor(character, held, `${region.name} — ${region.epithet}`),
    region,
    log,
    action,
    resolved,
    ruled,
  })

  const useOpenRouter = !!process.env.OPENROUTER_API_KEY
  const url = useOpenRouter
    ? 'https://openrouter.ai/api/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions'
  const model = useOpenRouter ? MODEL : 'gpt-4o-mini'

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
        temperature: 0.85,
      }),
    })
    if (!res.ok) {
      return NextResponse.json({
        text: `The game master could not be reached (${res.status}). Nothing at the table has changed.`,
        source: 'unnarrated',
      })
    }

    const data = await res.json() as {
      choices?: { message?: { content?: string } }[]
      usage?: Record<string, number>
    }
    const content = data.choices?.[0]?.message?.content?.trim() ?? ''
    if (!content) {
      return NextResponse.json({
        text: 'The game master returned nothing. Nothing at the table has changed.',
        source: 'unnarrated',
      })
    }

    await logUsage(userId, 0.0008, { model, endpoint: 'learn-table' }, {
      input: data.usage?.prompt_tokens,
      output: data.usage?.completion_tokens,
    })

    /*
     * Work the GM asked for, chosen HERE.
     *
     * The fourth instance of the pattern this file already contains twice:
     * the model names what needs settling and something else settles it. A
     * roll is settled by `rollFor` below; work is settled by `assemble()`,
     * and in both cases the model has committed to its scene before it can
     * see the answer.
     *
     * Order matters: work is stripped first and wins. See splitWorkRequest
     * for why — a dropped roll costs a flourish, a dropped WORK: would turn a
     * scene that was meant to contain real mathematics into one that only
     * talks about it.
     */
    const asked = splitWorkRequest(content)
    const { text, expression } = splitRollRequest(asked.text)
    let work: Awaited<ReturnType<typeof pickWork>> = null
    /* `!ruled` dropped: a ruling turn may now carry the next piece of work,
       which is what lets an errand continue without the player restarting
       the thread. `!resolved` stays — a turn narrating dice is mid-exchange
       and stacking work onto it would make one turn settle two things. */
    if (asked.wantsWork && !resolved) {
      work = await pickWork(userId, region)
    }

    /*
     * A roll the GM asked for, rolled here. A malformed expression is dropped
     * rather than guessed at: the scene still stands, and inventing a reading
     * of something that did not parse would be the one dishonest thing this
     * route could do with dice.
     */
    let roll: TableTurn['roll'] | undefined
    if (expression && !resolved && !ruled && !asked.wantsWork) {
      const parsed = parseRollExpression(expression)
      if (parsed) {
        const tags: Tag[] = parsed.map(p => ({
          name: p.name, tier: (p.tier || '') as Tier, against: p.against,
        }))
        const result = rollFor(tags, fairDraw)
        roll = {
          expression,
          dice: result.dice,
          results: result.results,
          total: result.total,
          reading: result.reading,
        }
      }
    }

    return NextResponse.json({ text, roll, work, source: 'gm' })
  } catch {
    return NextResponse.json({
      text: 'The game master could not be reached. Nothing at the table has changed.',
      source: 'unnarrated',
    })
  }
}
