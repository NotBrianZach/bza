import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/apiQuota'
import { tryParse, renderExpr } from '@/lib/concepts/expr'
import { callWorker, verifierConfig } from '@/lib/concepts/verify'

/**
 * Exact computation, and the return leg the LaTeX pipeline was missing.
 *
 * ── WHY THIS ROUTE EXISTS ─────────────────────────────────────────────────
 *
 * bza already had most of a LaTeX pipeline: katex and rehype-katex for rendering,
 * typst.ts with its web compiler for real typesetting in the browser,
 * /api/typst-ai, and the Mathpix routes for image→LaTeX ingest. Every one of those
 * is an *inbound* leg — text or an image becomes LaTeX and gets displayed.
 *
 * Nothing fed computed output back in. The worker already returns a `latex` field
 * on every result (`OpResult.latex`, set by `_render` in worker/mathwb/ops.py), so
 * the gap really was one field wide: something had to ask it for an answer and
 * hand the LaTeX back to the editor. That is this route.
 *
 * ── WHY IT IS A WORKER CALL AND NOT A BROWSER LIBRARY ─────────────────────
 *
 * The project has no CAS. No SymPy, no symbolic engine of any kind — the
 * typesetting and rendering stack is extensive and computes nothing. Two options:
 * call the worker, or run SymPy in the browser via Pyodide.
 *
 * Pyodide is tens of megabytes, and it would duplicate the run ledger: the same
 * computation would have two provenance stories and no single authority for "what
 * was computed and under which assumptions". The worker keeps one authority, and
 * every response here carries its `runId` so a result pasted into a document can
 * be traced back to the run that produced it. That is a provenance decision
 * rather than a performance one, and it is the reason to accept a network hop.
 *
 * POST { expression, operation?, variables?, domainConditions?, params? }
 *   → 200 { configured, display, latex, exact, evidenceKind, conditions[], warnings[], runId }
 */

export const dynamic = 'force-dynamic'

/**
 * Operations this route will pass through.
 *
 * An allow-list rather than the worker's whole table, because this endpoint is
 * reachable by any signed-in user and the operations differ enormously in cost —
 * `integrate` and `limit` can occupy a SymPy process for the full timeout, and the
 * worker is single-threaded by design (see worker/mathwb/http.py). These are the
 * ones a workbench buffer actually asks for.
 */
const ALLOWED = new Set([
  'simplify', 'factor', 'expand', 'cancel', 'apart', 'diff', 'approximate', 'equivalent',
])

export async function POST(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Body must be JSON' }, { status: 400 })
  }

  const config = verifierConfig()
  if (!config.url) {
    // Said plainly rather than failed. A buffer with no worker configured is a
    // perfectly usable editor; it just cannot compute, and the honest response is
    // to say which of the two it is.
    return NextResponse.json({
      configured: false,
      error:
        'No computation worker is configured (MATH_WORKBENCH_URL is unset), so nothing exact ' +
        'can be computed. Rendering and typesetting are unaffected.',
    })
  }

  const operation = typeof body.operation === 'string' ? body.operation : 'simplify'
  if (!ALLOWED.has(operation)) {
    return NextResponse.json(
      { error: `operation "${operation}" is not available here (allowed: ${[...ALLOWED].sort().join(', ')})` },
      { status: 400 },
    )
  }

  const variables = Array.isArray(body.variables)
    ? (body.variables as unknown[])
        .filter((v): v is Record<string, unknown> => !!v && typeof v === 'object')
        .map(v => ({
          name: String(v.name ?? ''),
          assumptions: (v.assumptions && typeof v.assumptions === 'object'
            ? v.assumptions
            : {}) as Record<string, boolean>,
        }))
        .filter(v => /^[A-Za-z_][A-Za-z0-9_]*$/.test(v.name))
    : []

  const symbols = variables.map(v => v.name)

  // The expression arrives as text and is parsed here, never forwarded as a
  // string. This is the security boundary of the whole arrangement: the worker
  // takes a tree of tagged nodes precisely so that no caller can hand Python's
  // parser an arbitrary program. A route that passed a string through would undo
  // it for every other caller too.
  const source = typeof body.expression === 'string' ? body.expression : ''
  const parsed = tryParse(source, symbols)
  if (!parsed.ok) {
    return NextResponse.json({
      configured: true,
      error: `could not read the expression: ${parsed.message}`,
      position: parsed.position,
    }, { status: 400 })
  }

  const inputs: Record<string, unknown> = {
    expression: parsed.tree,
    variables,
    domain_conditions: Array.isArray(body.domainConditions)
      ? (body.domainConditions as unknown[]).filter((c): c is string => typeof c === 'string')
      : [],
    params: (body.params && typeof body.params === 'object' ? body.params : {}) as Record<string, unknown>,
  }

  // `equivalent` needs a second expression, and it is the one operation here
  // whose request shape differs. Refusing early beats a worker-side
  // invalid_input, which would arrive as an opaque 200.
  if (operation === 'equivalent') {
    const other = typeof body.other === 'string' ? tryParse(body.other, symbols) : null
    if (!other || !other.ok) {
      return NextResponse.json({
        configured: true,
        error: other
          ? `could not read the second expression: ${other.message}`
          : 'the equivalent operation needs a second expression in `other`',
      }, { status: 400 })
    }
    inputs.other = other.tree
  }

  const call = await callWorker(operation, inputs, config)
  if (!call.ok) {
    return NextResponse.json({ configured: true, error: call.reason }, { status: 502 })
  }

  const { reply } = call
  const result = reply.result ?? {}

  return NextResponse.json({
    configured: true,
    // The echo of what was parsed. Seeing `(1/2)*x` when you typed `1/2x` is how
    // you find out the parser read you differently than you meant, and finding
    // that out next to the answer is the whole value of showing it.
    asRead: renderExpr(parsed.tree),
    status: reply.status ?? 'ok',
    operation,
    display: result.display ?? null,
    /** The return leg. This is the field the pipeline was missing. */
    latex: result.latex ?? null,
    /** sympy.srepr — losslessly rebuildable, for anything that wants to compute on it again. */
    exact: (result as { exact?: string }).exact ?? null,
    /**
     * What the result is *entitled* to claim. A SymPy call returning an answer is
     * a `symbolic_result` under recorded assumptions; it is not a proof, and
     * nothing labels it one. Passed through rather than interpreted.
     */
    evidenceKind: result.evidence_kind ?? null,
    /**
     * Domain exclusions that survived the operation. This is the field that keeps
     * `(x^2-1)/(x-1) → x+1` honest, and a client that drops it has rendered a
     * false statement beautifully.
     */
    conditions: result.retained_conditions ?? [],
    unresolvedObligations: result.unresolved_obligations ?? [],
    warnings: result.warnings ?? [],
    verdict: result.verdict ?? null,
    method: result.method ?? null,
    error: reply.error?.message ?? null,
    provenance: {
      runId: reply.run_id ?? null,
      cached: reply.cached ?? null,
      engineVersion: reply.engine_version ?? null,
      environmentHash: reply.environment_hash ?? null,
    },
  })
}
