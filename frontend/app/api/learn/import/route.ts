import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'
import { getUserFromToken } from '@/lib/apiQuota'
import {
  emitDraftModule, importArchive, importPromotionRate, summariseImport,
  type ScrapedArchive, type ScrapedEdge, type ScrapedStep, type ScrapedTopic,
} from '@/lib/concepts/import'
import { RATIONAL_EXPRESSIONS } from '@/lib/concepts/ontology'

/**
 * Read a `.bza` scrape into a reviewable ontology draft. Writes nothing.
 *
 * ── Why this route cannot be an "import" in the usual sense ────────────────
 *
 * The ontology is `lib/concepts/ontology.ts`, a module under version control.
 * There is no table to insert into, so this route cannot apply anything — and
 * that is the right shape rather than a limitation worked around. What arrives is
 * a curriculum graph inferred from CSS classes and the text around a link
 * (`extractPrerequisiteGraph` in the scraper); what it produces is a proposal.
 * A proposal belongs in code review, where a human reads the rationale on each
 * edge, and not behind a migration that has already happened by the time anybody
 * looks.
 *
 * So the response is a report plus `module`: the draft as TypeScript source, for
 * the author to read and commit. The existing `/api/import/math-academy` route is
 * the one that *does* write, and it writes the scrape as a **reading book** — a
 * different and complementary use of the same archive. Neither supersedes the
 * other and this one deliberately does not touch what that one creates.
 *
 * ── What it is safe to send ────────────────────────────────────────────────
 *
 * Auth is required, because a scrape is the learner's own account data and the
 * report quotes it back. Nothing is persisted, so there is no row to own, but an
 * unauthenticated ZIP endpoint that runs a decompressor is not something to
 * leave open.
 *
 * `MAX_BYTES` bounds the upload, and the three archive members are read by name
 * rather than by walking the ZIP, so a crafted archive with ten thousand entries
 * costs one lookup each. Missing members are not an error: a scrape of a single
 * lesson has `content/steps.json` and no `graph/` at all, which imports to
 * concepts with no edges and is a perfectly honest result.
 *
 * POST /api/learn/import      body: the raw .bza bytes
 */

export const dynamic = 'force-dynamic'

/** 32 MB. A scrape of a whole course with images runs to a few MB. */
const MAX_BYTES = 32 * 1024 * 1024

const ONTOLOGY = RATIONAL_EXPRESSIONS

/**
 * Read one JSON member, tolerating its absence.
 *
 * Returns `undefined` for a missing member and records a parse failure separately,
 * because those two mean different things to whoever sent the archive: one is a
 * scrape that did not cover that page, the other is a corrupt file.
 */
async function readJson(
  zip: JSZip,
  path: string,
  problems: string[],
): Promise<unknown | undefined> {
  const file = zip.file(path)
  if (!file) return undefined
  try {
    return JSON.parse(await file.async('text'))
  } catch {
    problems.push(`${path} is not valid JSON and was skipped`)
    return undefined
  }
}

export async function POST(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const declared = Number(req.headers.get('content-length') ?? 0)
  if (Number.isFinite(declared) && declared > MAX_BYTES) {
    return NextResponse.json({ error: `Archive is larger than ${MAX_BYTES} bytes` }, { status: 413 })
  }

  const bytes = await req.arrayBuffer()
  if (bytes.byteLength === 0) {
    return NextResponse.json({ error: 'Empty request body' }, { status: 400 })
  }
  if (bytes.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: `Archive is larger than ${MAX_BYTES} bytes` }, { status: 413 })
  }

  let zip: JSZip
  try {
    zip = await JSZip.loadAsync(bytes)
  } catch {
    return NextResponse.json({ error: 'Not a readable ZIP archive' }, { status: 400 })
  }

  const problems: string[] = []
  const manifest = (await readJson(zip, 'manifest.json', problems)) as
    | ScrapedArchive['manifest']
    | undefined
  const topics = (await readJson(zip, 'graph/topics.json', problems)) as
    | Record<string, ScrapedTopic>
    | undefined
  const edges = await readJson(zip, 'graph/edges.json', problems)
  const steps = await readJson(zip, 'content/steps.json', problems)

  // Shape guards rather than trust. The scraper writes these files, but this
  // route's input is whatever was uploaded, and an object where an array belongs
  // would otherwise surface as a TypeError three call frames in.
  const archive: ScrapedArchive = {
    manifest: manifest && typeof manifest === 'object' ? manifest : undefined,
    graph: {
      topics: topics && typeof topics === 'object' && !Array.isArray(topics) ? topics : undefined,
      edges: Array.isArray(edges) ? (edges as ScrapedEdge[]) : undefined,
    },
    steps: Array.isArray(steps) ? (steps as ScrapedStep[]) : undefined,
  }
  if (topics !== undefined && (typeof topics !== 'object' || Array.isArray(topics))) {
    problems.push('graph/topics.json is not an object keyed by topic id and was skipped')
  }
  if (edges !== undefined && !Array.isArray(edges)) {
    problems.push('graph/edges.json is not an array and was skipped')
  }
  if (steps !== undefined && !Array.isArray(steps)) {
    problems.push('content/steps.json is not an array and was skipped')
  }
  if (!archive.graph?.topics && !archive.graph?.edges && !archive.steps) {
    return NextResponse.json(
      {
        error:
          'The archive carries none of graph/topics.json, graph/edges.json or ' +
          'content/steps.json, so there is nothing to draft from.',
        problems,
      },
      { status: 400 },
    )
  }

  const subjectId = req.nextUrl.searchParams.get('subject') ?? ONTOLOGY.subject.id
  const imported = importArchive(archive, subjectId)

  return NextResponse.json({
    /**
     * Stated in the response rather than only in this comment, so a client cannot
     * present the result as a completed import.
     */
    applied: false,
    appliedNote:
      'Nothing was written. The ontology is a TypeScript module, so promoting any of ' +
      'this means authoring it into lib/concepts/ontology.ts by hand — see `blocking` ' +
      'on each draft for what that requires.',
    subjectId,
    counts: imported.counts,
    summary: summariseImport(imported),
    parseRate: imported.parseRate,
    /** Concept-level promotion, against the ontology as it ships today. */
    promotion: importPromotionRate(imported, ONTOLOGY),
    /** Edge-level: every one of these is a candidate and gates nothing. */
    edges: imported.edges,
    concepts: imported.concepts,
    rejected: imported.rejected,
    cycles: imported.cycles,
    provenance: imported.provenance,
    /** Problems with the upload itself, as distinct from problems with the scrape. */
    problems,
    /** The draft as TypeScript source. This is the output worth reading. */
    module: emitDraftModule(imported),
  })
}
