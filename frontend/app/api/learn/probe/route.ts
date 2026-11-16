import { NextRequest, NextResponse } from 'next/server'
import { checkQuota, getUserFromToken, logUsage } from '@/lib/apiQuota'
import { MATHEMATICS } from '@/lib/concepts/atlas'
import {
  probeContext, probeNudgePrompt, probePrompt, type ProbeKind,
} from '@/lib/concepts/probe'

/**
 * One probe question, about the relationship between two concepts.
 *
 * The sibling of /api/learn/socratic, and small for the same reason:
 * everything structural — which probes exist for a concept, which end is
 * anchored, what the model may and may not see — lives in lib/concepts/probe.ts
 * and is pure and tested. This route is the phrasing leg and nothing else.
 *
 * ── Why there is no fallback here, unlike the socratic route ──────────────
 *
 * That route degrades to `unphrased`: with no model it prints the step's own
 * words, which is honest because a step HAS words — a move and what it
 * establishes, written by an author.
 *
 * A probe has no such text. Its question does not exist until something writes
 * it; the inputs are two concept names, their objectives, and the shape of an
 * edge. There is no authored sentence to fall back to, and the thing the fields
 * would compose into — "Order of operations and Negative numbers are confused;
 * why?" — is not a probe, it is the probe's own stage directions handed to the
 * learner.
 *
 * So when there is no model, or quota is spent, this route REFUSES and says
 * which piece is missing. The surface then offers the walk, which still works
 * without a model for the 101 authored steps. A mode that cannot run saying so
 * is better than a mode that fills the gap with its own scaffolding, which is
 * the same argument `visualRef` makes about placeholders.
 *
 * POST { anchorId, otherId, kind, subjectName? }
 *   → 200 { question, kind, anchorName, otherName }
 *   → 400 on a malformed body or an unknown kind
 *   → 404 when the pair names nothing probe-able
 *   → 503 when no tutor is configured or quota is spent, with `reason`
 */

export const dynamic = 'force-dynamic'

/** Same precedence as the socratic route, so one var moves every model. */
const MODEL = process.env.SOCRATIC_MODEL || process.env.CORRELATE_MODEL || 'anthropic/claude-haiku-4-5'

/**
 * Three sentences rather than socratic's two.
 *
 * A boundary probe often needs to put a specific case on the table before it
 * can ask which way it falls, and that setup is load-bearing rather than
 * padding. Still tight enough that the budget is itself part of the
 * instruction.
 */
const MAX_TOKENS = 300

const KINDS: ProbeKind[] = ['boundary', 'generalisation', 'necessity']

export async function POST(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Body must be JSON' }, { status: 400 })
  }

  const anchorId = typeof body.anchorId === 'string' ? body.anchorId : ''
  const otherId = typeof body.otherId === 'string' ? body.otherId : ''
  const kind = KINDS.find(k => k === body.kind)
  if (!kind) {
    return NextResponse.json(
      { error: `kind must be one of ${KINDS.join(', ')}` },
      { status: 400 },
    )
  }

  /*
   * The context is rebuilt here from ids rather than trusted from the body.
   * The client sends a pair it got from `probesFor`, but a client could send
   * any pair, and `probeContext` is what enforces that both ends are real and
   * teachable — and, more importantly, it is the only thing that decides what
   * the model is allowed to see. Accepting a context from the request would
   * move the answer-blindness guarantee to the client, where it is not a
   * guarantee at all.
   */
  const context = probeContext(MATHEMATICS, { kind, anchorId, otherId })
  if (!context) {
    return NextResponse.json(
      {
        error: `nothing to probe between "${anchorId}" and "${otherId}" — `
          + 'both must be concepts with material written',
      },
      { status: 404 },
    )
  }

  const subjectName = typeof body.subjectName === 'string' ? body.subjectName : undefined

  /*
   * `nudge` needs what was asked, not just the learner's words.
   *
   * Without `asked` the follow-up re-opens the boundary from scratch, which
   * reads as not having listened. An empty `answer` is the stuck case and is a
   * different ask, not a degenerate one — see probeNudgePrompt.
   */
  const mode = body.mode === 'nudge' ? 'nudge' : 'ask'
  const asked = typeof body.asked === 'string' ? body.asked : ''
  const answer = typeof body.answer === 'string' ? body.answer : ''
  if (mode === 'nudge' && !asked) {
    return NextResponse.json(
      { error: 'nudge needs `asked` — the question being followed up' },
      { status: 400 },
    )
  }

  const prompt = mode === 'nudge'
    ? probeNudgePrompt(context, asked, answer, subjectName)
    : probePrompt(context, subjectName)

  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'No tutor is configured here (OPENROUTER_API_KEY is unset), and a probe has no '
          + 'authored sentence to fall back to. Tutor mode\'s derivation walk still works.',
        reason: 'unconfigured',
      },
      { status: 503 },
    )
  }

  const quota = await checkQuota(userId)
  if (quota) {
    return NextResponse.json(
      {
        error: `${quota} A probe needs a model to exist at all, so there is nothing to show you `
          + 'here. Tutor mode\'s derivation walk still works — 101 of its steps need no model.',
        reason: 'quota',
      },
      { status: 503 },
    )
  }

  const useOpenRouter = !!process.env.OPENROUTER_API_KEY
  const url = useOpenRouter
    ? 'https://openrouter.ai/api/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions'
  const model = useOpenRouter ? MODEL : 'gpt-4o-mini'

  const unreachable = (detail: string) => NextResponse.json(
    { error: detail, reason: 'unreachable' },
    { status: 503 },
  )

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
        /*
         * Higher than the walk's 0.4, and for a reason rather than by feel.
         * A step question has one good shape — ask about this move — so
         * variety there is noise. A probe is a CHOICE of attack: which case to
         * put up, which direction to push. The same pair asked twice should be
         * able to come at it differently, because a learner who has seen one
         * boundary question about these two has not thereby understood the
         * boundary.
         */
        temperature: 0.7,
      }),
    })

    if (!res.ok) return unreachable(`The tutor could not be reached (${res.status}).`)

    const data = await res.json() as {
      choices?: { message?: { content?: string } }[]
      usage?: Record<string, number>
    }
    const question = data.choices?.[0]?.message?.content?.trim() ?? ''
    if (!question) return unreachable('The tutor returned nothing.')

    await logUsage(userId, 0.0006, { model, endpoint: `learn-probe-${mode}` }, {
      input: data.usage?.prompt_tokens,
      output: data.usage?.completion_tokens,
    })

    return NextResponse.json({
      question,
      kind,
      anchorName: context.anchor.name,
      otherName: context.other.name,
    })
  } catch {
    return unreachable('The tutor could not be reached.')
  }
}
