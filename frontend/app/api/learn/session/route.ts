import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/apiQuota'
import { RATIONAL_EXPRESSIONS } from '@/lib/concepts/ontology'
import { conceptById } from '@/lib/concepts/registry'
import { assemble, summarise } from '@/lib/concepts/scheduling'
import { loadStrengths, loadTraversal } from '@/lib/concepts/store'
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

const ONTOLOGY = RATIONAL_EXPRESSIONS

export async function GET(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const requested = Number(req.nextUrl.searchParams.get('size') ?? 8)
  const size = Number.isFinite(requested) ? Math.max(1, Math.min(Math.trunc(requested), 20)) : 8
  const now = new Date().toISOString()

  let strengths
  let world
  try {
    ;[strengths, world] = await Promise.all([
      loadStrengths(userId),
      loadTraversal(userId, ONTOLOGY.subject.id),
    ])
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
  const assembly = assemble({ ontology: ONTOLOGY, strengths, now, size, reached })
  const progress = summarise(ONTOLOGY, strengths, now)
  const name = (id: string) => conceptById(ONTOLOGY, id)?.name ?? id

  return NextResponse.json({
    subject: ONTOLOGY.subject,
    verifier: { configured: !!verifierConfig().url },
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
      domainConditions: t.domainConditions ?? [],
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
      frontier: (world.route.length === 0 ? openingDoors(ONTOLOGY, world) : frontier(ONTOLOGY, world))
        .map(id => ({ conceptId: id, conceptName: name(id) })),
    },
  })
}
