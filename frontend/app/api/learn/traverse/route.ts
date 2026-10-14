import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/apiQuota'
import { RATIONAL_EXPRESSIONS } from '@/lib/concepts/ontology'
import { conceptById, prerequisitesOf } from '@/lib/concepts/registry'
import { conceptStrength, MASTERY_FLOOR, type StrengthTable } from '@/lib/concepts/scheduling'
import { loadStrengths, loadTraversal, saveTraversal } from '@/lib/concepts/store'
import {
  arrive, frontier, offerKey, openingDoors, traversalProgress, unmetPrerequisites,
  type TraversalWorld,
} from '@/lib/concepts/traversal'

/**
 * Walk the concept graph. `navigation`, with the doors being prerequisites.
 *
 * POST { start: conceptId }    the opening move only, and only to a root
 * POST { offer: conceptId }    offer a key you hold; the graph picks the door
 *
 * THE REFUSAL IS THE REPLY. In the correlation engine a checked scope is relaxed
 * at salvage, because a guarantee that every legal turn carries a real reply
 * outranks a preference about where to look. Here the opposite holds and it does
 * not bend: a door whose prerequisites are unmet does not open, and the answer is
 * a named list of what is missing. Serving a concept early is the failure the
 * ordering exists to prevent, so no stage of this route can override it — see the
 * inversion note in lib/concepts/traversal.ts.
 *
 * TWO GATES, NOT ONE. `offerKey` answers whether the *structure* permits an
 * arrival. The strength table answers whether the prerequisites are actually
 * strong. Both are checked, because reaching a concept you cannot support is the
 * same failure whichever gate let it through — and the two gates can genuinely
 * disagree: a learner who walked the graph months ago has the route and has lost
 * the strength.
 */

export const dynamic = 'force-dynamic'

const ONTOLOGY = RATIONAL_EXPRESSIONS

const name = (id: string) => conceptById(ONTOLOGY, id)?.name ?? id

/**
 * The one line that fixes a concept in the atlas.
 *
 * The first knowledge point's statement, because the author ordered them and the
 * first is what they chose to open with. `navigation`'s atlas holds one fixed
 * detail per place for the same reason: somewhere you have been is remembered by
 * the thing about it you can still see.
 */
function detailFor(conceptId: string): string {
  const concept = conceptById(ONTOLOGY, conceptId)
  const first = [...(concept?.knowledgePoints ?? [])].sort((a, b) => a.position - b.position)[0]
  return first?.statement ?? concept?.name ?? conceptId
}

/** Prerequisites of `conceptId` that are below the mastery floor right now. */
function weakPrerequisites(conceptId: string, strengths: StrengthTable, now: string): string[] {
  return prerequisitesOf(ONTOLOGY, conceptId)
    .filter(p => conceptStrength(ONTOLOGY, strengths, p, now) < MASTERY_FLOOR)
}

/** The world as the client needs it: progress, where you are, and what is open. */
function shape(world: TraversalWorld, extra: Record<string, unknown>) {
  return NextResponse.json({
    ...extra,
    world: {
      ...traversalProgress(ONTOLOGY, world),
      here: world.here,
      hereName: world.here ? name(world.here) : null,
      reached: world.reached.map(r => ({ ...r, conceptName: name(r.conceptId) })),
      route: world.route,
      frontier: (world.route.length === 0 ? openingDoors(ONTOLOGY, world) : frontier(ONTOLOGY, world))
        .map(id => ({ conceptId: id, conceptName: name(id) })),
    },
  })
}

export async function POST(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Body must be JSON' }, { status: 400 })
  }

  const subjectId = ONTOLOGY.subject.id
  const now = new Date().toISOString()

  let world: TraversalWorld
  let strengths: StrengthTable
  try {
    ;[world, strengths] = await Promise.all([
      loadTraversal(userId, subjectId),
      loadStrengths(userId),
    ])
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'could not load the traversal' },
      { status: 500 },
    )
  }

  // ── the opening move ───────────────────────────────────────────────────
  if (typeof body.start === 'string') {
    if (world.route.length > 0) {
      return NextResponse.json(
        { error: 'This traversal has already started. Offer a key instead.' },
        { status: 409 },
      )
    }
    const doors = openingDoors(ONTOLOGY, world)
    if (!doors.includes(body.start)) {
      const missing = unmetPrerequisites(ONTOLOGY, world, body.start)
      return NextResponse.json({
        error: missing.length > 0
          ? `${name(body.start)} is not somewhere you can start — it rests on ${missing.map(name).join(' and ')}.`
          : `${name(body.start)} is not a concept in this subject.`,
        openings: doors.map(id => ({ conceptId: id, conceptName: name(id) })),
      }, { status: 409 })
    }

    const next = arrive(world, body.start, detailFor(body.start))
    try {
      await saveTraversal(userId, subjectId, next)
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'could not save the traversal' },
        { status: 500 },
      )
    }
    return shape(next, {
      outcome: 'opens',
      door: body.start,
      doorName: name(body.start),
      because: 'A door with no building attached to it. Where to stand was the one choice you get.',
      detail: detailFor(body.start),
    })
  }

  // ── offer a key ────────────────────────────────────────────────────────
  if (typeof body.offer !== 'string') {
    return NextResponse.json({ error: 'Send { offer } or { start }' }, { status: 400 })
  }

  const outcome = offerKey(ONTOLOGY, world, body.offer)

  // Every non-opening outcome is a 200 with a reason, not an error status. A
  // refused key is an ordinary move here — "you pick the key, never the door"
  // means most keys will not fit — and an HTTP error would make the client treat
  // the game's own rule as a fault.
  if (outcome.kind !== 'opens') {
    const extra: Record<string, unknown> = { outcome: outcome.kind, because: outcome.because }
    if (outcome.kind === 'blocked') {
      extra.nearest = outcome.nearest
      extra.nearestName = name(outcome.nearest)
      extra.missing = outcome.missing.map(id => ({ conceptId: id, conceptName: name(id) }))
    }
    if (outcome.kind === 'interferes') {
      extra.door = outcome.door
      extra.doorName = name(outcome.door)
      extra.with = outcome.with
      extra.withName = name(outcome.with)
    }
    return shape(world, extra)
  }

  const weak = weakPrerequisites(outcome.door, strengths, now)
  if (weak.length > 0) {
    return shape(world, {
      outcome: 'blocked',
      nearest: outcome.door,
      nearestName: name(outcome.door),
      missing: weak.map(id => ({ conceptId: id, conceptName: name(id) })),
      because:
        `${name(outcome.door)} is structurally open, but ${weak.map(name).join(' and ')} ` +
        `${weak.length === 1 ? 'is' : 'are'} not strong enough yet. ` +
        `Practise ${weak.length === 1 ? 'it' : 'those'} first — the door does not open early.`,
    })
  }

  const next = arrive(world, outcome.door, detailFor(outcome.door))
  try {
    await saveTraversal(userId, subjectId, next)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'could not save the traversal' },
      { status: 500 },
    )
  }
  return shape(next, {
    outcome: 'opens',
    door: outcome.door,
    doorName: name(outcome.door),
    because: outcome.because,
    detail: detailFor(outcome.door),
  })
}
