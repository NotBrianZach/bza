/**
 * Probe mode — questions about a concept's edges rather than a derivation's steps.
 *
 * ── Why this is a separate module and not a prompt tweak ──────────────────
 *
 * `socratic.ts` walks a worked example: it takes one subgoal and asks it back.
 * Its prompt says "turn the named move into a question" and "point AT the move,
 * never past it", and a two-sentence budget keeps it there. That is the right
 * design for being led through a derivation, and it has a ceiling built into
 * it — every question's scope is one step of one example, so the best possible
 * output is a well-phrased restatement of the next move. No amount of prompt
 * rewriting lifts that ceiling, because the ceiling is the chain: a step is all
 * the context a step question has.
 *
 * A probe asks about the concept instead. Its material is the GRAPH — the edges
 * the ontology already carries — so its scope is the relationship between two
 * concepts rather than the mechanics of one move. That is what makes it capable
 * of testing where an understanding stops.
 *
 * ── Three kinds, each from an edge that already exists ────────────────────
 *
 *  - `boundary` ← `interferes_with`. Two concepts learners confuse for each
 *    other. 13 such edges, 7 with both ends authored. The highest-value kind:
 *    an `interferes_with` edge is a recorded observation that these two
 *    specifically get mixed up, which is exactly a known limit of
 *    understanding.
 *  - `generalisation` ← `encompasses`. Anchored on the NARROWER end, asking
 *    about the wider one, because "you can do this — what does the broader
 *    case need that this did not" is the direction that builds an intuition.
 *    27 usable.
 *  - `necessity` ← `prerequisite`. "Why does this depend on that; what breaks
 *    without it." 64 usable. The most plentiful and the least sharp, so it
 *    sorts last.
 *
 * `caveat` is deliberately NOT a source, despite reading like one. It is a note
 * about whether the concept's `scope.match` reliably identifies theorems —
 * "Wikipedia has no field for ‘is about the domain of a rational expression’".
 * It is a statement about the provider's categories, not about mathematics, and
 * a probe built on it would ask the learner about Wikipedia.
 *
 * ── The answer-blindness guarantee, carried over ──────────────────────────
 *
 * `SocraticContext` cannot carry the asked step's `establishes`, and the point
 * of that is structural rather than instructional: the model cannot leak what
 * it was never given, and an instruction not to leak is defeated by one
 * careless edit to a prompt string.
 *
 * `ProbeContext` keeps the same shape of guarantee against the same hazard. For
 * a boundary probe the answer is the edge's `rationale` — "cancelling is legal
 * across a product and illegal across a sum" — so `ProbeContext` is incapable
 * of carrying `rationale`. The model is told THAT two concepts are confused and
 * must work out the distinction from their objectives, which means it cannot
 * quote the discriminating sentence, because it never had it.
 *
 * This costs something and the cost is worth naming: an authored rationale is
 * sharper than a model's reconstruction of it, so a probe is a weaker question
 * than it could be. The alternative is a prompt that holds the answer and is
 * asked not to say it, and that failure is invisible — a leaked answer reads as
 * a perfectly good question. Same trade `socratic.ts` already made.
 *
 * ── A probe records nothing ───────────────────────────────────────────────
 *
 * Same as a walk, for the same reasons, and more obviously: a boundary question
 * has no single correct answer to rule against. `Observation` requires a
 * `Verdict`, so there is no write path here and no table. Rulings come from the
 * verifier, on a task, against an exact answer.
 *
 * Everything here is pure. The module decides WHICH probe and builds the
 * prompt; `/api/learn/probe` owns the one fetch.
 */

import { conceptById, edgesOfKind, isTeachable } from './registry'
import type { Prompt } from './socratic'
import type { ConceptOntology } from './types'

/** Which edge a probe came from. Reported to the surface, never averaged away. */
export type ProbeKind = 'boundary' | 'generalisation' | 'necessity'

/**
 * One probe a learner could be asked, as a pair of concept ids.
 *
 * Ids rather than resolved concepts so that selecting is separable from
 * phrasing: `probesFor` can be called over a whole frontier cheaply, and only
 * the chosen one is turned into a context.
 */
export interface ProbeTarget {
  kind: ProbeKind
  /** The concept the learner has been working. The question is anchored here. */
  anchorId: string
  /** The far end of the edge. */
  otherId: string
}

/**
 * Everything the asking model gets, and nothing it must not have.
 *
 * There is no `rationale` field and there must never be one — see the header.
 * The test suite asserts its absence against the edge's own `rationale`,
 * because this is the invariant whose violation would be invisible in the
 * output.
 */
export interface ProbeContext {
  kind: ProbeKind
  anchor: { name: string; objectives: string[] }
  other: { name: string; objectives: string[] }
}

/** A concept's objective statements, which are the only prose it carries. */
function objectivesOf(o: ConceptOntology, id: string): string[] {
  return (conceptById(o, id)?.objectives ?? []).map(ob => ob.statement)
}

/**
 * Every probe anchored on one concept, sharpest kind first.
 *
 * Both endpoints must be teachable. A probe about a mapped-but-unwritten
 * concept would be asking the learner to compare against something the app
 * has nothing to say about, which is the same overstatement as inventing a
 * walk for an unwritten node.
 *
 * `interferes_with` is symmetric and stated once, so it is matched on either
 * end. The other two are directional and anchored deliberately: the narrower
 * end of `encompasses`, and the dependent end of `prerequisite`.
 */
export function probesFor(o: ConceptOntology, conceptId: string): ProbeTarget[] {
  if (!isTeachable(o, conceptId)) return []
  const usable = (id: string) => id !== conceptId && isTeachable(o, id)

  const boundary = edgesOfKind(o, 'interferes_with')
    .flatMap(e =>
      e.from === conceptId ? [e.to]
      : e.to === conceptId ? [e.from]
      : [])
    .filter(usable)
    .map(otherId => ({ kind: 'boundary' as const, anchorId: conceptId, otherId }))

  // Anchored on `to`, the narrower end: `from` encompasses `to`, so `from` is
  // the wider idea and the probe asks outward from what the learner can do.
  const generalisation = edgesOfKind(o, 'encompasses')
    .filter(e => e.to === conceptId)
    .map(e => e.from)
    .filter(usable)
    .map(otherId => ({ kind: 'generalisation' as const, anchorId: conceptId, otherId }))

  // Anchored on `to`, the dependent end: `from` is the prerequisite.
  const necessity = edgesOfKind(o, 'prerequisite')
    .filter(e => e.to === conceptId)
    .map(e => e.from)
    .filter(usable)
    .map(otherId => ({ kind: 'necessity' as const, anchorId: conceptId, otherId }))

  return [...boundary, ...generalisation, ...necessity]
}

/** Probes anchored anywhere in a set of concepts, deduplicated. */
export function probesAcross(o: ConceptOntology, conceptIds: string[]): ProbeTarget[] {
  const seen = new Set<string>()
  const out: ProbeTarget[] = []
  for (const id of conceptIds) {
    for (const p of probesFor(o, id)) {
      const key = `${p.kind}:${p.anchorId}:${p.otherId}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push(p)
    }
  }
  return out
}

/**
 * Resolve a target into what the model may see.
 *
 * Null when either end is unknown or unteachable, so a stale target cannot
 * produce a context with empty names in it.
 */
export function probeContext(o: ConceptOntology, t: ProbeTarget): ProbeContext | null {
  const anchor = conceptById(o, t.anchorId)
  const other = conceptById(o, t.otherId)
  if (!anchor || !other) return null
  if (!isTeachable(o, t.anchorId) || !isTeachable(o, t.otherId)) return null
  return {
    kind: t.kind,
    anchor: { name: anchor.name, objectives: objectivesOf(o, t.anchorId) },
    other: { name: other.name, objectives: objectivesOf(o, t.otherId) },
  }
}

// ---------------------------------------------------------------------------
// The prompt
// ---------------------------------------------------------------------------

/** Same renderer, same constraint as socratic.ts. */
const MATH_SYNTAX =
  'Wrap every mathematical expression in dollar signs, however simple — $3^3$, $x+y$, $n$ — '
  + 'because bare math is stripped by the renderer. Use standard LaTeX inside them. '
  + 'No headings, no lists, no bold.'

/** The rules no probe may relax. The parallel of socratic.ts's FLOOR. */
const FLOOR =
  'WHAT YOU HAVE, AND WHAT YOU DO NOT\n'
  + 'You are given two concepts, each with the objectives written for it, and the kind of '
  + 'relationship between them. You are NOT given an explanation of that relationship, and '
  + 'nothing will give you one. Where the relationship is a known confusion, the sentence '
  + 'describing what learners get wrong exists in the source and has been withheld from you '
  + 'deliberately: a tutor holding the discriminating sentence puts it in the question.\n\n'
  + 'THEREFORE, AND THESE ARE NOT STYLE PREFERENCES\n'
  + '- Ask exactly ONE question, and do not answer it. No preamble, no praise.\n'
  + '- Never say or imply whether the learner is right. You cannot know. Nothing in this '
  + 'conversation is recorded or marked; a verifier rules on exact answers to problems '
  + 'elsewhere.\n'
  + '- Do not offer multiple-choice options. A list of candidates contains the answer.\n'
  + '- Do not name the distinction and then ask the learner to confirm it. Naming it is '
  + 'answering it.\n'
  + '- Three sentences at most, and the question itself must be one of them.\n'
  + '- Ask about mathematics, never about this app, its curriculum, or how concepts are '
  + 'related in it. "Why is X a prerequisite of Y" is a question about a syllabus; "what '
  + 'would go wrong in Y if you could not do X" is a question about mathematics.'

/** Per-kind instruction. The whole point is that these are different asks. */
const BY_KIND: Record<ProbeKind, string> = {
  boundary:
    'These two concepts are ones learners reliably confuse for each other. Work out for '
    + 'yourself, from the objectives, where the line between them falls — then ask a question '
    + 'that would show whether the learner knows which side of it a case is on. The strongest '
    + 'form is a specific case chosen so that the two concepts would be handled differently, '
    + 'asked in a way that does not reveal which one applies.',
  generalisation:
    'The learner can already do the first concept. The second is the wider idea that contains '
    + 'it. Ask a question that makes them reach from what they can do into what the wider case '
    + 'additionally demands — what stops being true, what extra condition appears, what their '
    + 'existing method would fail to cover. Do not ask them to define the wider concept.',
  necessity:
    'The first concept depends on the second. Ask a question that makes the dependence visible '
    + 'as mathematics: a situation in the first concept that cannot be settled without the '
    + 'second, or what specifically would go wrong attempting it without. Never phrase this as '
    + 'a question about prerequisites or course order.',
}

function contextBlock(ctx: ProbeContext): string {
  const list = (xs: string[]) =>
    xs.length ? xs.map(s => `- ${s}`).join('\n') : '- (no objectives written)'
  const [first, second] = ctx.kind === 'boundary'
    ? ['ONE CONCEPT', 'THE OTHER CONCEPT']
    : ctx.kind === 'generalisation'
      ? ['WHAT THE LEARNER CAN DO', 'THE WIDER IDEA THAT CONTAINS IT']
      : ['THE CONCEPT IN QUESTION', 'WHAT IT DEPENDS ON']
  return (
    `${first}: ${ctx.anchor.name}\n${list(ctx.anchor.objectives)}\n\n`
    + `${second}: ${ctx.other.name}\n${list(ctx.other.objectives)}\n\n`
    + 'RELATIONSHIP\n'
    + (ctx.kind === 'boundary'
      ? 'Learners confuse these two for each other. You have not been told why.'
      : ctx.kind === 'generalisation'
        ? `Exercising ${ctx.other.name} exercises ${ctx.anchor.name}.`
        : `${ctx.other.name} must be solid before ${ctx.anchor.name} can be done.`)
  )
}

/**
 * Phrase one probe.
 *
 * No `verbatim` path, unlike `socraticPrompt`: there are no authored probes to
 * use as written. If probes are ever authored by hand they should take the same
 * route `socratic` does — used verbatim, never round-tripped through a model.
 */
export function probePrompt(ctx: ProbeContext, subjectName?: string): Prompt {
  return {
    system:
      'You are a Socratic tutor testing the edges of one learner\'s understanding'
      + `${subjectName ? ` in ${subjectName}` : ''}.\n\n`
      + 'You are NOT walking them through a derivation and must not ask about the next step of '
      + 'a procedure. Your question is about where an idea stops working, what it does not '
      + 'cover, or what it is being mistaken for.\n\n'
      + `${FLOOR}\n\n`
      + `${BY_KIND[ctx.kind]}\n\n`
      + `${MATH_SYNTAX}\n\n`
      + 'Reply with the question and nothing else.',
    user: contextBlock(ctx),
  }
}

/**
 * The reply turn: the learner has answered a probe, or said they are stuck.
 *
 * The guarantee is unchanged and it is still the missing field doing the work.
 * The learner's words are included; the edge's `rationale` still is not, and
 * `ProbeContext` still cannot carry one. So a model asked "was that right?" by
 * something that does not hold the distinction can only ask a better question
 * — which is the behaviour wanted anyway.
 *
 * Why this matters more here than on a walk: a walk has somewhere to go when
 * the learner is done — the next step, then a rulable problem. A probe has no
 * next step, so without a reply turn the panel is a question generator and the
 * learner's thinking goes nowhere. The follow-up IS the interaction.
 *
 * `asked` is carried so the follow-up can push on the SAME boundary rather than
 * drifting to a new one. Without it a model given only the learner's words
 * re-opens the topic from scratch, which reads as not having listened.
 */
export function probeNudgePrompt(
  ctx: ProbeContext,
  asked: string,
  learnerAnswer: string,
  subjectName?: string,
): Prompt {
  const said = learnerAnswer.trim().slice(0, 1200)
  const answered = said.length > 0
  return {
    system:
      'You are a Socratic tutor testing the edges of one learner\'s understanding'
      + `${subjectName ? ` in ${subjectName}` : ''}. `
      + (answered
        ? 'You asked them a question about where an idea stops working, and they have answered '
          + 'in their own words.\n\n'
        : 'You asked them a question about where an idea stops working, and they are stuck.\n\n')
      + `${FLOOR}\n\n`
      + (answered
        ? 'Push on the SAME boundary rather than moving to a new one. If what they said leaves '
          + 'the hard part untouched, ask the question that reaches it — often a case their '
          + 'answer would handle wrongly. If they have genuinely got it, ask what would happen '
          + 'to their reasoning in a case one step further out. Do not summarise what they said '
          + 'back to them, and do not tell them they were right.'
        : 'Make the same question smaller without answering it. Offer a concrete case to think '
          + 'about instead of the general question, or ask about the simplest instance where '
          + 'the issue still appears. Do not supply the distinction and do not restate the '
          + 'question in different words — a smaller question is a different question.')
      + '\n\n'
      + `${MATH_SYNTAX}\n\n`
      + 'Reply with the question and nothing else.',
    user:
      `${contextBlock(ctx)}\n\n`
      + `WHAT YOU ASKED\n${asked}\n\n`
      + (answered
        ? `WHAT THE LEARNER SAID\n${said}`
        : 'THE LEARNER SAID NOTHING AND ASKED FOR A SMALLER WAY IN.'),
  }
}
