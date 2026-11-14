import { NextRequest, NextResponse } from 'next/server'
import { checkQuota, getUserFromToken, logUsage } from '@/lib/apiQuota'
import { MATHEMATICS } from '@/lib/concepts/atlas'
import { conceptById } from '@/lib/concepts/registry'
import { chainForPoint, promptFor, unphrasedQuestion, type Phrasing } from '@/lib/concepts/socratic'

/**
 * One Socratic question, for one step of one worked example.
 *
 * ── Why this route is so small ────────────────────────────────────────────
 *
 * Everything structural about a walk — which chains a concept has, what the
 * step establishes, where the walk ends — is in `lib/concepts/`, which is pure
 * and imported by the browser already. So the client needs nothing from a
 * server to walk a chain. The one thing it cannot do is hold an API key.
 *
 * That is all this is: the phrasing leg. It takes a step, builds the
 * answer-blind context itself, and returns a sentence plus which of the three
 * sources it came from.
 *
 * ── The step is resolved HERE, from an id ─────────────────────────────────
 *
 * The body carries `pointId` and `position`, never a context the client
 * assembled. One authority for "what may the asker see", and it is the same
 * `socraticContext` the test suite asserts over every node in every subject.
 * A route that accepted a pre-built context would be a second path to the
 * model with no such guarantee, and the failure would be invisible: a leaked
 * answer reads as a perfectly good question.
 *
 * ── An authored question never reaches the model ──────────────────────────
 *
 * 101 of 352 steps carry a hand-written `socratic` phrasing. Those are
 * returned verbatim, before auth even matters for cost: no call, no quota, no
 * paraphrase. Spending a token to reword an author's question makes it worse.
 *
 * ── Unconfigured says so, rather than failing ─────────────────────────────
 *
 * With no API key the walk still works, from the step's own words
 * (`unphrasedQuestion`), labelled `unphrased` so the surface can say the
 * question was not phrased by a tutor. Same discipline as `verifierConfig` in
 * verify.ts: an engine with a piece missing reports which piece, and the rest
 * of it keeps working.
 *
 * POST { pointId, position, mode?: 'ask' | 'nudge', answer?, subjectName? }
 *   → 200 { question, source, position, steps, remaining, verbatim, note? }
 *   → 404 when the point or the position names nothing
 */

export const dynamic = 'force-dynamic'

/**
 * Same shape as the correlate routes, so one env var moves every model at once,
 * with a per-surface override above it.
 *
 * The override exists because this is the one surface where a cheaper model is
 * actively dangerous rather than merely worse: the failure mode of a weak model
 * here is a question that telegraphs its own answer, which looks fine and
 * teaches nothing. If that shows up, `SOCRATIC_MODEL` is the knob, and it can
 * be raised without moving /play's eleven games.
 */
const MODEL = process.env.SOCRATIC_MODEL || process.env.CORRELATE_MODEL || 'anthropic/claude-haiku-4-5'

/** Two sentences. A budget this tight is itself part of the instruction. */
const MAX_TOKENS = 220

export async function POST(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Body must be JSON' }, { status: 400 })
  }

  const pointId = typeof body.pointId === 'string' ? body.pointId : ''
  const position = Number(body.position)
  const mode = body.mode === 'nudge' ? 'nudge' : 'ask'
  const answer = typeof body.answer === 'string' ? body.answer : ''

  if (!Number.isInteger(position) || position < 0) {
    return NextResponse.json({ error: 'position must be a non-negative integer' }, { status: 400 })
  }

  const chain = chainForPoint(MATHEMATICS, pointId)
  if (!chain) {
    return NextResponse.json(
      { error: `nothing to lead through on "${pointId}" — it has no worked example` },
      { status: 404 },
    )
  }

  const built = promptFor(chain, position, mode, answer, conceptById(MATHEMATICS, chain.conceptId)?.name)
  if (!built) {
    return NextResponse.json(
      { error: `step ${position} is past the end of this derivation (${chain.questions.length} steps)` },
      { status: 404 },
    )
  }
  const { prompt, context } = built

  const base = {
    position,
    steps: chain.questions.length,
    remaining: context.remaining,
    verbatim: context.verbatim,
  }
  const reply = (question: string, source: Phrasing, note?: string) =>
    NextResponse.json({ ...base, question, source, ...(note ? { note } : {}) })

  /*
   * The author's own sentence, used as written.
   *
   * Before the quota check on purpose: this costs nothing, and a learner at
   * their monthly limit should still be able to walk the 101 steps that need
   * no model at all. Only `nudge` overrides it — asking for a smaller way in
   * is a request the authored sentence cannot answer, since there is exactly
   * one of it.
   */
  if (mode === 'ask' && context.verbatim) {
    return reply(context.ask, 'authored')
  }

  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) {
    return reply(
      unphrasedQuestion(context),
      'unphrased',
      'No tutor is configured here (OPENROUTER_API_KEY is unset), so this is the step in its own '
      + 'words rather than a question phrased for you. Everything else about the walk is unaffected.',
    )
  }

  const quota = await checkQuota(userId)
  if (quota) {
    return reply(
      unphrasedQuestion(context),
      'unphrased',
      `${quota} The walk still works — this is the step in its own words.`,
    )
  }

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
        // Some variety across repeat walks of the same step, nothing more. The
        // prompt does the work; a high temperature here buys a differently
        // worded question, not a better one.
        temperature: 0.4,
      }),
    })

    if (!res.ok) {
      return reply(
        unphrasedQuestion(context),
        'unphrased',
        `The tutor could not be reached (${res.status}), so this is the step in its own words.`,
      )
    }

    const data = await res.json() as {
      choices?: { message?: { content?: string } }[]
      usage?: Record<string, number>
    }
    const content = data.choices?.[0]?.message?.content?.trim() ?? ''

    if (!content) {
      return reply(
        unphrasedQuestion(context),
        'unphrased',
        'The tutor returned nothing, so this is the step in its own words.',
      )
    }

    await logUsage(userId, 0.0004, { model, endpoint: 'learn-socratic' }, {
      input: data.usage?.prompt_tokens,
      output: data.usage?.completion_tokens,
    })

    return reply(content, 'tutor')
  } catch {
    return reply(
      unphrasedQuestion(context),
      'unphrased',
      'The tutor could not be reached, so this is the step in its own words.',
    )
  }
}
