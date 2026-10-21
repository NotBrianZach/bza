/**
 * The third judge.
 *
 * `Judge = 'player' | 'narrator' | 'verifier'`. The first two are interpretive —
 * one is you ruling and the interpreter arguing, the other is an in-fiction
 * interpreter whose ruling sticks. Mechanical judgement is a third kind and it is
 * genuinely new code rather than a data edit, which is the one place the
 * correlation engine's modes-as-data design does not absorb this feature. Hence
 * this file, and hence a sibling engine rather than a twelfth game.
 *
 * ── What is ruled, and in what order ──────────────────────────────────────
 *
 * A `transform_to_form` answer makes two independent claims, and both have to
 * hold: that it is equivalent to what was asked, and that it is in the form that
 * was asked for. Form is checked **first**, locally, by forms.ts, and that order
 * is a pedagogical decision rather than an optimisation:
 *
 *   A learner asked to decompose a fraction who hands the fraction back has
 *   written something perfectly equivalent. Telling them "equivalent" is true and
 *   useless. Telling them "you have not decomposed it" is the whole feedback.
 *
 * It also means a form failure never costs a worker call and never degrades to
 * inconclusive — it is settled on this side of the wire.
 *
 * ── The one honest limitation, stated up front ────────────────────────────
 *
 * Equivalence needs a CAS and the browser has none, so it is a call to the
 * math-workbench worker (see the `math` project). When `MATH_WORKBENCH_URL` is
 * unset or the call fails, the ruling is `inconclusive` — never `correct` and
 * never `incorrect`. That is not a graceful degradation bolted on; it is the
 * design working. An engine that cannot settle a question has said nothing about
 * the learner, and the only truthful ruling is that nothing was settled.
 *
 * Which means the inconclusive path is the **default** path until a worker is
 * deployed, and is therefore the one path that cannot rot unnoticed. That was the
 * reason to wire it this way round.
 */

import { parseFailure, parsedTree, renderExpr, symbolsIn, tryParse, type ExprNode } from './expr'
import { checkDenominatorDegree, checkForm, FORM_LABELS, type FormCheck } from './forms'
import { exactValue, sameValue, showExact, substitute } from './numerals'
import { primaryVariable } from './tasks'
import type { PracticeTask, Verdict } from './types'

/**
 * Re-exported because the exact-arithmetic helpers were defined here before the
 * generators needed them too, and a caller asking the verifier what a tree is
 * worth is still asking a reasonable question of the right module.
 */
export { exactValue, sameValue, showExact, substitute } from './numerals'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface VerifierConfig {
  /** Absent means no equivalence check is possible. Everything rules inconclusive. */
  url: string | null
  token: string | null
  timeoutMs: number
}

export function verifierConfig(): VerifierConfig {
  const raw = (process.env.MATH_WORKBENCH_URL ?? '').trim()
  return {
    url: raw ? raw.replace(/\/+$/, '') : null,
    token: (process.env.MATH_WORKBENCH_TOKEN ?? '').trim() || null,
    // The worker's own default is 10s and its ceiling is 120s. 15s here because a
    // `simplify` on a nested rational can genuinely take ten, and a timeout is an
    // inconclusive ruling — an impatient ceiling manufactures them.
    timeoutMs: Number(process.env.MATH_WORKBENCH_TIMEOUT_MS ?? 15_000),
  }
}

// ---------------------------------------------------------------------------
// The result of asking for a ruling
// ---------------------------------------------------------------------------

/**
 * Why this is a union and not just a Verdict.
 *
 * An answer that does not parse has made no mathematical claim, so there is
 * nothing to rule and no observation to record. Folding it into `inconclusive`
 * would be wrong in both directions: it would send every typo to human review,
 * and it would let a mistyped answer sit in the evidence record as though the
 * engine had failed to settle something. A learner whose input could not be read
 * should simply be shown where, and asked again.
 */
export type Ruling =
  | { status: 'unreadable'; message: string; position: number }
  | { status: 'ruled'; verdict: Verdict; /** The answer as parsed, echoed back. */ asRead: string }

// ---------------------------------------------------------------------------
// The worker call
// ---------------------------------------------------------------------------

interface WorkerReply {
  status?: string
  run_id?: string | number
  cached?: boolean
  engine_version?: string
  environment_hash?: string
  error?: { code?: string; message?: string }
  result?: {
    verdict?: string
    method?: string
    status?: string
    evidence_kind?: string
    retained_conditions?: string[]
    unresolved_obligations?: string[]
    warnings?: string[]
    counterexample?: { point?: string; difference?: string }
    display?: string
    latex?: string
  }
}

/**
 * One `evaluate` request, in the worker's own protocol.
 *
 * The body is byte-for-byte the message the stdio worker reads on stdin — the
 * HTTP adapter in the `math` project is a transport and adds no schema of its own.
 * That is deliberate: two schemas would mean two places for the expression
 * contract to drift, and the expression contract is the security boundary.
 */
export async function callWorker(
  operation: string,
  inputs: Record<string, unknown>,
  config: VerifierConfig = verifierConfig(),
): Promise<{ ok: true; reply: WorkerReply } | { ok: false; reason: string }> {
  if (!config.url) return { ok: false, reason: 'no worker is configured (MATH_WORKBENCH_URL is unset)' }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), config.timeoutMs)
  try {
    const response = await fetch(`${config.url}/evaluate`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(config.token ? { Authorization: `Bearer ${config.token}` } : {}),
      },
      body: JSON.stringify({
        protocol_version: 1,
        request_id: `bza-${operation}`,
        method: 'evaluate',
        operation,
        inputs,
        // Leave headroom under our own abort, so a worker that is merely slow
        // reports its own timeout — which names the operation — rather than
        // surfacing as a bare network abort.
        timeout_ms: Math.max(1000, config.timeoutMs - 2000),
      }),
    })
    if (!response.ok) {
      return { ok: false, reason: `the worker answered HTTP ${response.status}` }
    }
    return { ok: true, reply: (await response.json()) as WorkerReply }
  } catch (e) {
    const aborted = e instanceof Error && e.name === 'AbortError'
    return {
      ok: false,
      reason: aborted
        ? `the worker did not answer within ${config.timeoutMs} ms`
        : `the worker could not be reached (${e instanceof Error ? e.message : 'unknown error'})`,
    }
  } finally {
    clearTimeout(timer)
  }
}

export type WorkerCall = { ok: true; reply: WorkerReply } | { ok: false; reason: string }

/**
 * Accessors for a `callWorker` result, for the reason given on `parsedTree` in
 * expr.ts: this union does not narrow on `.ok` when these modules are compiled
 * standalone, which the test harness does, and the resulting TS2339 wall makes a
 * passing suite look broken.
 */
const callReason = (call: WorkerCall): string | null => ('reason' in call ? call.reason : null)
const callReply = (call: WorkerCall): WorkerReply | null => ('reply' in call ? call.reply : null)

/** Dedupe while keeping order: the author's own conditions first, the engine's after. */
function mergeConditions(authored: string[], retained: string[]): string[] {
  const out: string[] = []
  for (const c of [...authored, ...retained]) {
    const text = c.trim()
    if (text && !out.includes(text)) out.push(text)
  }
  return out
}

function evidenceOf(reply: WorkerReply): Verdict['evidence'] {
  return {
    runId: reply.run_id,
    engineVersion: reply.engine_version,
    environmentHash: reply.environment_hash,
    evidenceKind: reply.result?.evidence_kind,
    cached: reply.cached,
  }
}

// ---------------------------------------------------------------------------
// Ruling a transform_to_form answer
// ---------------------------------------------------------------------------

/**
 * Rule one `transform_to_form` submission.
 *
 * Three steps, and `brokeAt.step` names which one failed, because "wrong" without
 * a location is the feedback the correlation engine's salvage stage exists to
 * avoid giving and this engine has no excuse for:
 *
 *   0  the submission could not be read          → not a ruling at all
 *   1  the answer is not in the form asked for   → settled locally
 *   2  the answer is not equivalent              → settled by the worker
 */
export async function ruleTransform(
  task: PracticeTask,
  answer: string,
  config: VerifierConfig = verifierConfig(),
): Promise<Ruling> {
  const symbols = task.variables.map(v => v.name)
  const parsed = tryParse(answer, symbols)
  const failure = parseFailure(parsed)
  if (failure) return { status: 'unreadable', ...failure }
  const tree = parsedTree(parsed)
  if (!tree) return { status: 'unreadable', message: 'could not be read', position: 0 }
  const asRead = renderExpr(tree)
  const authored = task.domainConditions ?? []

  // ── step 1: the form, and the reduction bound if the task asserts one ──
  //
  // Both are local, both are shape claims, and both are collected before any
  // worker call — so an answer that has not been rewritten at all never costs a
  // round trip and never degrades to inconclusive.
  const checks: FormCheck[] = []
  if (task.form) checks.push(checkForm(tree, task.form, primaryVariable(task)))
  if (typeof task.maxDenominatorDegree === 'number') {
    checks.push(checkDenominatorDegree(tree, primaryVariable(task), task.maxDenominatorDegree))
  }

  const refused = checks.find(c => c.held === false)
  if (refused) {
    return {
      status: 'ruled',
      asRead,
      verdict: {
        ruling: 'incorrect',
        method: task.form
          ? `shape check against "${FORM_LABELS[task.form]}" — equivalence was not checked`
          : 'shape check — equivalence was not checked',
        brokeAt: { step: 1, detail: refused.detail },
        conditions: authored,
      },
    }
  }

  /** Set when a shape check could not rule. Carried to step 2, never treated as a pass. */
  const abstained = checks.find(c => c.held === null) ?? null

  // ── step 2: equivalence ───────────────────────────────────────────────
  const reference = tryParse(task.reference, symbols)
  const referenceFailure = parseFailure(reference)
  const referenceTree = parsedTree(reference)
  if (referenceFailure || !referenceTree) {
    // An authoring fault, not a learner fault. Ruling it against the learner
    // would be the worst available outcome, so it is inconclusive and says whose
    // fault it is.
    return {
      status: 'ruled',
      asRead,
      verdict: {
        ruling: 'inconclusive',
        method: `the task's own reference answer does not parse (${referenceFailure?.message ?? 'unreadable'}) — this is an authoring fault, not yours`,
        conditions: authored,
      },
    }
  }

  const call = await callWorker('equivalent', {
    expression: tree as unknown as Record<string, unknown>,
    other: referenceTree as unknown as Record<string, unknown>,
    variables: task.variables.map(v => ({ name: v.name, assumptions: v.assumptions ?? {} })),
    domain_conditions: authored,
    params: { symbol: primaryVariable(task) },
  }, config)

  const failedBecause = callReason(call)
  const reply = callReply(call)
  // An empty body is folded in here rather than thrown. A worker that answered
  // with nothing has settled nothing, which is precisely an inconclusive ruling —
  // raising would turn a strange response into a 500 and lose the ruling.
  if (failedBecause || !reply) {
    return {
      status: 'ruled',
      asRead,
      verdict: {
        ruling: 'inconclusive',
        method: `equivalence was not checked: ${failedBecause ?? 'the worker answered with an empty body'}`,
        conditions: authored,
      },
    }
  }

  const result = reply.result ?? {}
  const conditions = mergeConditions(authored, result.retained_conditions ?? [])

  // A transport-level non-answer. The worker distinguishes these from an
  // inconclusive *mathematical* result, and so does the method string.
  if (reply.status === 'timeout' || reply.status === 'engine_error' || reply.status === 'cancelled') {
    return {
      status: 'ruled',
      asRead,
      verdict: {
        ruling: 'inconclusive',
        method: `the worker returned ${reply.status}${reply.error?.message ? `: ${reply.error.message}` : ''}`,
        conditions,
        evidence: evidenceOf(reply),
      },
    }
  }
  if (reply.status === 'error' || reply.status === 'unsupported_operation') {
    return {
      status: 'ruled',
      asRead,
      verdict: {
        ruling: 'inconclusive',
        method: `the worker refused the request: ${reply.error?.message ?? reply.status}`,
        conditions,
        evidence: evidenceOf(reply),
      },
    }
  }

  if (result.verdict === 'counterexample_found') {
    const point = result.counterexample?.point
    const difference = result.counterexample?.difference
    return {
      status: 'ruled',
      asRead,
      verdict: {
        ruling: 'incorrect',
        method: result.method ?? 'substitution at sampled points',
        brokeAt: {
          step: 2,
          detail: point
            ? `the two expressions differ at ${point}${difference ? `, by ${difference}` : ''}`
            : 'a point was found where the two expressions differ',
        },
        conditions,
        evidence: evidenceOf(reply),
      },
    }
  }

  if (result.verdict === 'supported') {
    // Equivalent — but if a shape check abstained, the answer is not yet
    // established as correct, because being in the demanded shape was half of
    // what was asked. Abstaining here rather than passing is the rule from
    // forms.ts carried through: a check that could not run must never be read as
    // a check that passed.
    if (abstained) {
      return {
        status: 'ruled',
        asRead,
        verdict: {
          ruling: 'inconclusive',
          method:
            `equivalence holds (${result.method ?? 'simplify(difference) == 0'}), but whether this ` +
            `answer has the shape that was asked for could not be determined: ${abstained.detail}`,
          conditions,
          evidence: evidenceOf(reply),
        },
      }
    }
    const shape = checks.map(c => c.detail).join('; ')
    return {
      status: 'ruled',
      asRead,
      verdict: {
        ruling: 'correct',
        method: shape
          ? `${result.method ?? 'simplify(difference) == 0'}, and in shape (${shape})`
          : (result.method ?? 'simplify(difference) == 0'),
        conditions,
        evidence: evidenceOf(reply),
      },
    }
  }

  // The worker's own inconclusive. It names what it tried, and it carries the
  // obligation text, because "no counterexample was found" is not evidence of
  // anything and the learner is entitled to know that is what happened.
  const obligations = result.unresolved_obligations ?? []
  return {
    status: 'ruled',
    asRead,
    verdict: {
      ruling: 'inconclusive',
      method:
        `${result.method ?? 'the engine did not settle the equivalence'}` +
        (obligations.length > 0 ? ` — ${obligations.join('; ')}` : ''),
      conditions,
      evidence: evidenceOf(reply),
    },
  }
}

// ---------------------------------------------------------------------------
// Ruling an evaluate answer
// ---------------------------------------------------------------------------

/** An authoring fault is inconclusive and says whose fault it is. Never scored. */
function authoringFault(detail: string, asRead: string, conditions: string[]): Ruling {
  return {
    status: 'ruled',
    asRead,
    verdict: {
      ruling: 'inconclusive',
      method: `${detail} — this is an authoring fault, not yours`,
      conditions,
    },
  }
}

/**
 * Rule one `evaluate` submission.
 *
 * ── Why this one is settled locally and `transform_to_form` is not ─────────
 *
 * `transform_to_form` accepts *any* expression equivalent to the reference, so
 * deciding it needs a CAS. An `evaluate` task asks for one number, and two
 * rational numbers can be compared exactly with bigint arithmetic — which is not
 * CAS work, and pretending it were would make every evaluate task rule
 * `inconclusive` on a deployment with no worker.
 *
 * That matters more than it sounds, because of a specific property of the worker:
 * `op_equivalent` only looks for a counterexample when the difference still has a
 * free symbol (`ops.py`: `_sample_counterexample(...) if symbol is not None`).
 * After substituting the inputs there is no free symbol left, so a plainly wrong
 * numeric answer would come back `inconclusive` rather than `incorrect` — "not
 * settled" for answering 3 when the value is 0. Routing the rational case through
 * local exact arithmetic is what avoids that, and the worker remains the fallback
 * for the answers that genuinely need it (`sqrt(4)`, `pi - pi`).
 *
 * ── It checks the author too ───────────────────────────────────────────────
 *
 * Because the value is computable here, the task's own `reference` can be
 * *re-derived* from its `given` at its `at` rather than trusted. A disagreement
 * rules `inconclusive` and blames the author. `ruleTransform` can only do this
 * for a reference that fails to parse; here a reference that parses and is simply
 * wrong is caught as well, which is the stronger check and the one an authored
 * task set actually needs.
 *
 * Three steps, and `brokeAt.step` names which:
 *
 *   0  the submission could not be read              → not a ruling at all
 *   1  the answer is not a number                    → settled locally
 *   2  the answer is the wrong number                → settled locally, exactly
 */
export async function ruleEvaluate(
  task: PracticeTask,
  answer: string,
  config: VerifierConfig = verifierConfig(),
): Promise<Ruling> {
  const symbols = task.variables.map(v => v.name)
  const parsed = tryParse(answer, symbols)
  const failure = parseFailure(parsed)
  if (failure) return { status: 'unreadable', ...failure }
  const answerTree = parsedTree(parsed)
  if (!answerTree) return { status: 'unreadable', message: 'could not be read', position: 0 }
  const asRead = renderExpr(answerTree)
  const authored = task.domainConditions ?? []

  // ── step 1: it has to be a number ─────────────────────────────────────
  //
  // Local, and the analogue of the form check: a learner who hands back an
  // expression in x has not evaluated anything, and "that is not a number yet"
  // is the whole feedback. No worker call, and no route to inconclusive.
  const mentioned = symbolsIn(answerTree)
  if (mentioned.length > 0) {
    return {
      status: 'ruled',
      asRead,
      verdict: {
        ruling: 'incorrect',
        method: 'the answer still contains a variable — equivalence was not checked',
        brokeAt: {
          step: 1,
          detail:
            `an evaluate task asks for a value, and this still mentions ` +
            `${mentioned.join(' and ')}. Substitute the stated inputs and compute.`,
        },
        conditions: authored,
      },
    }
  }

  // ── the author's side of the task, validated before the learner's ──────
  const at = task.at ?? {}
  const names = Object.keys(at)
  if (names.length === 0) {
    return authoringFault('an evaluate task that states no inputs has no value to ask for', asRead, authored)
  }

  const atTrees: Record<string, ExprNode> = {}
  for (const [name, raw] of Object.entries(at)) {
    // No symbols declared: an input must be an exact numeral, not an expression.
    const valueTree = parsedTree(tryParse(raw, []))
    if (!valueTree || exactValue(valueTree) === null) {
      return authoringFault(`the input ${name} = ${raw} is not an exact numeral`, asRead, authored)
    }
    atTrees[name] = valueTree
  }

  const given = tryParse(task.given, symbols)
  const givenTree = parsedTree(given)
  if (!givenTree) {
    return authoringFault(
      `the task's own expression does not parse (${parseFailure(given)?.message ?? 'unreadable'})`,
      asRead, authored)
  }

  // Every symbol in the expression has to be given a value, or there is no single
  // number to ask for. A missing input is an authoring fault and not a hard
  // question.
  const uncovered = symbolsIn(givenTree).filter(s => !(s in atTrees))
  if (uncovered.length > 0) {
    return authoringFault(
      `the expression mentions ${uncovered.join(' and ')}, which the task's inputs do not give a value`,
      asRead,
      authored,
    )
  }

  const reference = tryParse(task.reference, symbols)
  const refTree = parsedTree(reference)
  if (!refTree) {
    return authoringFault(
      `the task's own reference answer does not parse (${parseFailure(reference)?.message ?? 'unreadable'})`,
      asRead, authored)
  }

  const target = substitute(givenTree, atTrees)
  const truth = exactValue(target)
  const claimed = exactValue(refTree)

  // The author re-derived rather than trusted. Only possible when both sides are
  // rational, which is every task in the shipped set.
  if (truth && claimed && !sameValue(truth, claimed)) {
    return authoringFault(
      `the task claims the answer is ${showExact(claimed)}, but its own expression at its own ` +
        `inputs is ${showExact(truth)}`,
      asRead,
      authored,
    )
  }

  // ── step 2: the right number, compared exactly ────────────────────────
  const answered = exactValue(answerTree)
  const expected = truth ?? claimed
  if (answered && expected) {
    const where = names.map(n => `${n} = ${at[n]}`).join(', ')
    if (sameValue(answered, expected)) {
      return {
        status: 'ruled',
        asRead,
        verdict: {
          ruling: 'correct',
          method: `exact rational comparison at ${where}`,
          conditions: authored,
        },
      }
    }
    return {
      status: 'ruled',
      asRead,
      verdict: {
        ruling: 'incorrect',
        method: `exact rational comparison at ${where}`,
        brokeAt: {
          step: 2,
          detail: `the value at ${where} is ${showExact(expected)}, and this is ${showExact(answered)}`,
        },
        conditions: authored,
      },
    }
  }

  // ── the fallback: an answer with no rational value ────────────────────
  //
  // `sqrt(4)` is a correct answer to a task whose value is 2 and has no rational
  // value here, so it goes to the worker. A wrong answer on this path can only
  // rule inconclusive, for the `_sample_counterexample` reason in the header —
  // which is honest, because nothing settled it.
  const call = await callWorker('equivalent', {
    expression: answerTree as unknown as Record<string, unknown>,
    other: target as unknown as Record<string, unknown>,
    variables: task.variables.map(v => ({ name: v.name, assumptions: v.assumptions ?? {} })),
    domain_conditions: authored,
  }, config)

  const failedBecause = callReason(call)
  const reply = callReply(call)
  if (failedBecause || !reply) {
    return {
      status: 'ruled',
      asRead,
      verdict: {
        ruling: 'inconclusive',
        method:
          `the answer has no exact rational value here, so it was sent for an equivalence ` +
          `check, which did not run: ${failedBecause ?? 'the worker answered with an empty body'}`,
        conditions: authored,
      },
    }
  }

  const result = reply.result ?? {}
  const conditions = mergeConditions(authored, result.retained_conditions ?? [])

  if (result.verdict === 'supported') {
    return {
      status: 'ruled',
      asRead,
      verdict: {
        ruling: 'correct',
        method: result.method ?? 'simplify(difference) == 0',
        conditions,
        evidence: evidenceOf(reply),
      },
    }
  }
  if (result.verdict === 'counterexample_found') {
    return {
      status: 'ruled',
      asRead,
      verdict: {
        ruling: 'incorrect',
        method: result.method ?? 'substitution at sampled points',
        brokeAt: { step: 2, detail: 'the answer differs from the value of the expression at the stated inputs' },
        conditions,
        evidence: evidenceOf(reply),
      },
    }
  }

  const obligations = result.unresolved_obligations ?? []
  return {
    status: 'ruled',
    asRead,
    verdict: {
      ruling: 'inconclusive',
      method:
        `${result.method ?? 'the engine did not settle whether this is the value'}` +
        (obligations.length > 0 ? ` — ${obligations.join('; ')}` : ''),
      conditions,
      evidence: evidenceOf(reply),
    },
  }
}

// ---------------------------------------------------------------------------
// Ruling a counterexample answer
// ---------------------------------------------------------------------------

/**
 * Rule one `counterexample` submission.
 *
 * ── Why this kind is cheap here and expensive in general ──────────────────
 *
 * types.ts says `counterexample` is "machine-rulable when the claim is an
 * identity", and that qualifier is the whole design. Refuting an arbitrary
 * claim needs a theorem prover. Refuting a claimed *identity* needs only
 * substitution: hand back a point where the two sides differ. The parser
 * already produces an `equation` node, so the task's `given` carries the claim
 * verbatim and both sides are available as trees.
 *
 * So this is settled locally and exactly, for the same reason `ruleEvaluate` is
 * — comparing two rationals is arithmetic, not CAS work. And the asymmetry is
 * genuine rather than a shortcut: **a counterexample is cheap to verify and
 * expensive to find**, which is exactly the shape of task worth asking a learner
 * for.
 *
 * ── What counts as breaking the claim ─────────────────────────────────────
 *
 * The answer is a point. The claim breaks at that point when both sides have a
 * value there and the values differ. Three things are *not* counterexamples and
 * each is ruled separately rather than lumped into "wrong":
 *
 *   - a point where the two sides agree. The claim survives it.
 *   - a point where either side is undefined. `(x+3)/(x+5) = 3/5` is not refuted
 *     by x = −5; the left side has no value there, so nothing was compared. A
 *     learner who offers the excluded point has made a real and interesting
 *     error and deserves to be told which one it is.
 *   - an answer that is not a point at all.
 *
 * The middle one is why this does not simply reuse `agreeAtPoints`: that function
 * skips undefined points by design, which is right for proving an identity and
 * wrong for grading a single proposed witness.
 */
export async function ruleCounterexample(
  task: PracticeTask,
  answer: string,
  _config: VerifierConfig = verifierConfig(),
): Promise<Ruling> {
  const symbols = task.variables.map(v => v.name)
  const variable = primaryVariable(task)
  const parsed = tryParse(answer, symbols)
  const failure = parseFailure(parsed)
  if (failure) return { status: 'unreadable', ...failure }
  const point = parsedTree(parsed)
  if (!point) return { status: 'unreadable', message: 'could not be read', position: 0 }
  const asRead = renderExpr(point)
  const authored = task.domainConditions ?? []

  // ── step 1: the answer has to be a point ──────────────────────────────
  const mentioned = symbolsIn(point)
  if (mentioned.length > 0) {
    return {
      status: 'ruled',
      asRead,
      verdict: {
        ruling: 'incorrect',
        method: 'the answer is not a single point',
        brokeAt: {
          step: 1,
          detail:
            `a counterexample is one value of ${variable}, and this still mentions ` +
            `${mentioned.join(' and ')}. Give a number that breaks the claim.`,
        },
        conditions: authored,
      },
    }
  }
  const at = exactValue(point)
  if (at === null) {
    return {
      status: 'ruled',
      asRead,
      verdict: {
        ruling: 'inconclusive',
        method: `"${asRead}" has no exact rational value, so it could not be substituted`,
        conditions: authored,
      },
    }
  }

  // ── the author's side: the claim has to be an identity ────────────────
  const claim = parsedTree(tryParse(task.given, symbols))
  if (!claim) {
    return authoringFault(
      `the task's own claim does not parse (${parseFailure(tryParse(task.given, symbols))?.message ?? 'unreadable'})`,
      asRead, authored)
  }
  if (claim.kind !== 'equation') {
    return authoringFault(
      'a counterexample task must state an equation to be broken, and this claim is not one',
      asRead, authored)
  }

  // ── step 2: does the claim actually break there ───────────────────────
  const substitution = { [variable]: point }
  const left = exactValue(substitute(claim.left, substitution))
  const right = exactValue(substitute(claim.right, substitution))

  if (left === null || right === null) {
    const which = left === null && right === null ? 'both sides' : left === null ? 'the left side' : 'the right side'
    return {
      status: 'ruled',
      asRead,
      verdict: {
        ruling: 'incorrect',
        method: 'substitution at the proposed point',
        brokeAt: {
          step: 2,
          detail:
            `at ${variable} = ${showExact(at)}, ${which} is undefined, so the two were never ` +
            `compared. An excluded point does not refute the claim — it is outside what the ` +
            `claim is about. Find a point where both sides have a value and they disagree.`,
        },
        conditions: authored,
      },
    }
  }

  if (sameValue(left, right)) {
    return {
      status: 'ruled',
      asRead,
      verdict: {
        ruling: 'incorrect',
        method: 'substitution at the proposed point',
        brokeAt: {
          step: 2,
          detail:
            `at ${variable} = ${showExact(at)} both sides equal ${showExact(left)}, so the claim ` +
            `survives this point. A counterexample has to make them differ.`,
        },
        conditions: authored,
      },
    }
  }

  return {
    status: 'ruled',
    asRead,
    verdict: {
      ruling: 'correct',
      method:
        `substitution at ${variable} = ${showExact(at)}: the left side is ${showExact(left)} ` +
        `and the right side is ${showExact(right)}, so the claim is false`,
      conditions: authored,
    },
  }
}

/**
 * Rule any submission the engine can rule, by kind.
 *
 * The dispatch lives here rather than in the route so there is one place that
 * knows which kinds are wired, and it throws for a kind rather than guessing —
 * `isVerifiableKind` says what *could* be ruled in principle, which is a
 * different claim from what has an implementation.
 */
export async function rule(
  task: PracticeTask,
  answer: string,
  config: VerifierConfig = verifierConfig(),
): Promise<Ruling | { status: 'unruled'; reason: string }> {
  switch (task.kind) {
    case 'transform_to_form':
      return ruleTransform(task, answer, config)
    case 'evaluate':
      return ruleEvaluate(task, answer, config)
    case 'counterexample':
      return ruleCounterexample(task, answer, config)
    default:
      return {
        status: 'unruled',
        reason: `kind "${task.kind}" has no verifier, so a submission cannot be ruled`,
      }
  }
}

// ---------------------------------------------------------------------------
// What happens to a ruling afterwards
// ---------------------------------------------------------------------------

/**
 * Does this verdict need a human to look at it?
 *
 * Only an inconclusive ruling that an engine actually attempted. An inconclusive
 * ruling produced because no worker is configured is an operational fact about
 * this deployment, not a mathematical question somebody should be asked to
 * adjudicate — queueing those would bury the real ones under the deployment's own
 * missing dependency.
 */
export function needsReview(verdict: Verdict): boolean {
  return verdict.ruling === 'inconclusive' && !!verdict.evidence?.runId
}

/**
 * Does this verdict move the learner's strength?
 *
 * Stated here as well as in scheduling.ts, on purpose. The rule — inconclusive is
 * never scored wrong — is the one most likely to be violated by a later
 * convenience, and the cheapest defence against that is for the rule to be
 * enforced at two independent places so a change to one of them fails a test
 * rather than quietly shipping.
 */
export function isScorable(verdict: Verdict): boolean {
  return verdict.ruling === 'correct' || verdict.ruling === 'incorrect'
}

/** For the UI: what to say above the result. */
export function rulingHeadline(verdict: Verdict): string {
  switch (verdict.ruling) {
    case 'correct': return 'Correct'
    case 'incorrect': return verdict.brokeAt ? 'Not right — here is the step that broke' : 'Not right'
    case 'inconclusive': return 'Not settled'
    case 'abandoned': return 'Left unanswered'
  }
}
