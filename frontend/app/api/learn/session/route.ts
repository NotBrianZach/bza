import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/apiQuota'
import { RATIONAL_EXPRESSIONS } from '@/lib/concepts/ontology'
import { parseTaskId } from '@/lib/concepts/generators'
import { getOntology, ONTOLOGIES } from '@/lib/concepts/ontology'
import { conceptById } from '@/lib/concepts/registry'
import { assemble, summarise } from '@/lib/concepts/scheduling'
import { liveClaims, loadStrengths, loadTraversal, pendingReviewCount } from '@/lib/concepts/store'
import { frontier, openingDoors, traversalProgress } from '@/lib/concepts/traversal'
import { verifierConfig } from '@/lib/concepts/verify'

/**
 * One practice set, plus enough state for the page to explain itself.
 *
 * `skipped` and `blocked` are returned to the client rather than filtered out
 * server-side, which is the point of the scheduler reporting them at all: a set
 * of four tasks when eight were asked for reads as "that is all there is", and
 * the real cause — an interference, a concept not yet introducible, a cooldown —
 * is the most useful thing the scheduler knows. No silent caps.
 *
 * `verifier.configured` is also told to the client, honestly. When no worker is
 * reachable every submission rules inconclusive, and a learner should be told
 * that before they spend twenty minutes on a set that cannot be marked — not
 * discover it one ruling at a time.
 *
 * GET /api/learn/session?size=8
 */

export const dynamic = 'force-dynamic'

/**
 * The subject a learner lands on with no `?subject=`.
 *
 * It MUST be the one at the bottom of the prerequisite order, and since
 * ontology-arithmetic.ts was authored that is no longer rational expressions.
 * Leaving the old default in place was an outright regression rather than a
 * stale preference: arithmetic now gates both algebra subjects through
 * `algebra-foundations.links`, so a cold account asking for rational
 * expressions gets an assembly of ZERO tasks and a `blocked` list — a correct
 * answer from `assemble`, and an empty page as a first impression.
 *
 * Taken from `ONTOLOGIES[0]` rather than named directly, because that array's
 * order is already documented as the curriculum order and two places
 * disagreeing about which subject comes first is the bug this comment exists
 * to prevent. `RATIONAL_EXPRESSIONS` is still imported — the verify and review
 * routes use it as their own fallback.
 */
const DEFAULT_ONTOLOGY = ONTOLOGIES[0] ?? RATIONAL_EXPRESSIONS

export async function GET(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const requested = Number(req.nextUrl.searchParams.get('size') ?? 8)
  const size = Number.isFinite(requested) ? Math.max(1, Math.min(Math.trunc(requested), 20)) : 8
  const now = new Date().toISOString()

  /**
   * Which subject to practise. The build ships two, and without this parameter
   * the second was unreachable — authored, tested, and served to nobody.
   *
   * An unknown subject is a 404 rather than a silent fall back to the default: a
   * learner who asked for logarithms and silently got rational expressions would
   * have no way to tell, and the traversal state is keyed by subject id, so the
   * wrong one would be loaded and saved under the right-looking name.
   */
  const requestedSubject = req.nextUrl.searchParams.get('subject')
  const ONTOLOGY = requestedSubject ? getOntology(requestedSubject) : DEFAULT_ONTOLOGY
  if (!ONTOLOGY) {
    return NextResponse.json(
      {
        error: `No subject "${requestedSubject}"`,
        subjects: ONTOLOGIES.map(o => ({ id: o.subject.id, name: o.subject.name })),
      },
      { status: 404 },
    )
  }

  let strengths
  let world
  let awaitingReview = 0
  /** Concepts the learner says they already know. See /api/learn/claims. */
  let claimed: Set<string> = new Set()
  try {
    ;[strengths, world, awaitingReview] = await Promise.all([
      loadStrengths(userId),
      loadTraversal(userId, ONTOLOGY.subject.id),
      // Counted here so the tab can carry a badge. A review queue nobody can see
      // the size of is a review queue nobody works, and the rows in it are the
      // engine's own failures — the most informative ones in the table.
      pendingReviewCount(userId),
    ])
    claimed = await liveClaims(userId, ONTOLOGY.subject.id)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'could not load the practice state' },
      { status: 500 },
    )
  }

  // A learner who has not started a traversal is not restricted by it: the
  // mastery floor alone decides what is introducible, which is what makes
  // practice usable without walking the graph first. Supplying `reached` is
  // strictly narrower, never wider.
  const reached = world.route.length > 0 ? world.route : undefined
  /**
   * A fixed number, not a clock read.
   *
   * What makes a re-attempt a different instance is the learner's own attempt
   * count, which `assemble` mixes in per knowledge point — so determinism here is
   * free and worth having: the same history yields the same set, which means a
   * learner can be asked what they saw and the instance can be rebuilt from its
   * id. Bump this to reshuffle everybody's variants at once.
   */
  const VARIANT_SEED = 1

  const assembly = assemble({ ontology: ONTOLOGY, strengths, now, size, reached, variantSeed: VARIANT_SEED, claimed })
  const progress = summarise(ONTOLOGY, strengths, now, claimed)
  const name = (id: string) => conceptById(ONTOLOGY, id)?.name ?? id

  return NextResponse.json({
    subject: ONTOLOGY.subject,
    /** Every shipped subject, so the client can offer the choice rather than guess. */
    subjects: ONTOLOGIES.map(o => ({ id: o.subject.id, name: o.subject.name })),
    verifier: { configured: !!verifierConfig().url },
    awaitingReview,
    tasks: assembly.tasks.map(t => ({
      // The reference answer is withheld. It is the right-hand side of an
      // equivalence check and the client has no use for it until after a ruling —
      // and a client that holds it is a client that can be read.
      id: t.id,
      knowledgePointId: t.knowledgePointId,
      kind: t.kind,
      prompt: t.prompt,
      given: t.given,
      form: t.form ?? null,
      variables: t.variables,
      // `evaluate` only, and the learner cannot answer without it — the prompt
      // names the inputs in prose but the panel shows them next to the
      // expression, because reading an input out of a sentence is not the skill
      // being practised.
      at: t.at ?? null,
      domainConditions: t.domainConditions ?? [],
      /**
       * Whether this instance was generated rather than authored.
       *
       * Told to the client because it changes what a learner should expect: a
       * generated task's numbers will be different next time, and knowing that
       * is the difference between "I have seen this before" and "I am being
       * drilled on the same thing".
       */
      generated: parseTaskId(t.id) !== null,
      conceptId: ONTOLOGY.concepts.find(c => c.knowledgePoints.some(p => p.id === t.knowledgePointId))?.id ?? null,
    })),
    skipped: assembly.skipped,
    blocked: assembly.blocked.map(b => ({
      conceptId: b.conceptId,
      conceptName: name(b.conceptId),
      missing: b.missing.map(m => ({ conceptId: m, conceptName: name(m) })),
    })),
    progress,
    traversal: {
      ...traversalProgress(ONTOLOGY, world),
      here: world.here,
      hereName: world.here ? name(world.here) : null,
      route: world.route.map(id => ({ conceptId: id, conceptName: name(id) })),
      // `openings`, NOT `frontier`. traversalProgress() spread above already
      // returns `frontier` as a COUNT, and naming this list `frontier` silently
      // overwrote it with an array of {conceptId, conceptName}. TraversalMap
      // renders `{traversal.frontier} open`, so the practice tab — the default
      // tab — crashed with React error #31, "objects are not valid as a React
      // child", naming those exact two keys.
      //
      // It typechecked because the page declared the shape as
      // `TraversalView & { frontier: Named[] }`: an intersection makes frontier
      // `number & Named[]`, which is `never`, and `never` is assignable to the
      // `number` the component wants. The lie was in the type, so tsc agreed
      // with it.
      openings: (world.route.length === 0 ? openingDoors(ONTOLOGY, world) : frontier(ONTOLOGY, world))
        .map(id => ({ conceptId: id, conceptName: name(id) })),
    },
  })
}
