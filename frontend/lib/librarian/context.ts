/**
 * What the librarian is allowed to know, and how it is told.
 *
 * The library chat had one source of context: the user's books and the concepts
 * extracted from them. Two more now exist in the app and the librarian could
 * see neither — the suggested feed, and the practice state. A reading companion
 * that cannot answer "why is this in my feed" or "what should I work on" is
 * missing the two questions a person would most want to ask it.
 *
 * ── The rule this module exists to enforce ────────────────────────────────
 *
 * **The librarian may only say what the engines already decided.** Every number
 * and every reason in the context it receives was computed by the scorer, the
 * selector or the practice scheduler, and the prompt tells the model in so many
 * words that it must not invent a connection the context does not contain.
 *
 * That is not a politeness. Both subsystems are built around a refusal to
 * fabricate: `explainDiscovery` returns null rather than inventing a bridge,
 * `scoreItem` withholds `bridgeFrom` below 0.15, the practice verifier rules
 * `inconclusive` rather than guessing, and `DigestGap` reports a short bucket
 * instead of filling it quietly. A chat layer that cheerfully improvised over
 * the top of all that would undo every one of those decisions at the last
 * step — and it would be the layer the user actually reads.
 *
 * So the context is built from stored explanations, never regenerated, and the
 * absences are stated. "No digest has been generated yet" and "this item
 * matched none of your interests" are both in the context as facts, because a
 * model given no feed section will helpfully imagine one.
 */

import { describe, measure } from '@/lib/suggest/metrics'
import {
  loadFeedback, loadLatestDigest, loadSettings, previousClusterIds,
} from '@/lib/suggest/store'
import { RATIONAL_EXPRESSIONS } from '@/lib/concepts/ontology'
import { ONTOLOGIES } from '@/lib/concepts/ontology'
import { conceptById } from '@/lib/concepts/registry'
import { assemble, MASTERY_FLOOR, summarise } from '@/lib/concepts/scheduling'
import { loadStrengths, loadTraversal, pendingReviewCount } from '@/lib/concepts/store'
import { frontier, openingDoors } from '@/lib/concepts/traversal'
import { verifierConfig } from '@/lib/concepts/verify'

// ---------------------------------------------------------------------------
// Feed
// ---------------------------------------------------------------------------

/**
 * The current digest, as prose the model can quote back.
 *
 * Each item carries its bucket, its source, and the scorer's OWN explanation of
 * why it is there. The `because` strings are the ones stored at selection time —
 * so if the user asks "why this one", the answer the librarian gives is the
 * answer the UI would show, rather than a second opinion that happens to differ.
 *
 * Back-filled items are marked in the text. A model told that an item is in the
 * "outside-the-map discovery" slot will explain it as a discovery pick; if it
 * was actually a stand-in because nothing qualified, that explanation is a
 * fabrication the model had no way to avoid.
 */
export async function feedContext(userId: string): Promise<string> {
  let digest: Awaited<ReturnType<typeof loadLatestDigest>>
  try {
    digest = await loadLatestDigest(userId)
  } catch (e) {
    // Said, not swallowed. A librarian that silently omits the feed section
    // will answer feed questions from imagination.
    return `SUGGESTED FEED: could not be loaded (${e instanceof Error ? e.message : 'unknown error'}). Tell the user you cannot see their feed right now rather than guessing at it.`
  }

  if (!digest) {
    return 'SUGGESTED FEED: none has been generated yet. If they ask about it, say so and offer to build one — do not describe a feed they do not have.'
  }

  const lines: string[] = [
    `SUGGESTED FEED (generated ${digest.generatedAt}, ${digest.items.length} item${digest.items.length === 1 ? '' : 's'}):`,
    '',
  ]

  const BUCKET_LABEL: Record<string, string> = {
    core: 'core interest',
    adjacent: 'adjacent discovery',
    outside: 'outside-the-map discovery',
    context: 'context and background',
    local: 'local or regional',
  }

  for (const item of digest.items) {
    const role = item.backfilled
      ? `${BUCKET_LABEL[item.bucket] ?? item.bucket} slot, BUT BACK-FILLED — it did not qualify for this bucket, it is standing in because nothing did`
      : (BUCKET_LABEL[item.bucket] ?? item.bucket)

    lines.push(`- "${item.title}" — ${item.feedName}, ${item.articleType.replace(/_/g, ' ')}`)
    lines.push(`  role: ${role}`)
    lines.push(`  url: ${item.url}`)
    if (item.matchedInterests.length > 0) {
      lines.push(`  matched interests: ${item.matchedInterests.join(', ')}`)
    } else {
      lines.push('  matched interests: none — it is not here because of an interest')
    }
    if (item.bridgeFrom) {
      lines.push(`  bridge: connects ${item.bridgeFrom}${item.bridgeTo ? ` to ${item.bridgeTo}` : ''}`)
    }
    const parts = Object.entries(item.parts)
      .map(([k, v]) => `${k} ${typeof v === 'number' ? v.toFixed(2) : v}`)
      .join(', ')
    lines.push(`  scores: ${parts}`)
    // The stored per-part reasons. This is the whole point of the section: the
    // librarian's answer to "why is this here" is the scorer's answer.
    for (const [part, why] of Object.entries(item.because)) {
      if (why) lines.push(`  why ${part}: ${why}`)
    }
    lines.push('')
  }

  if (digest.gaps.length > 0) {
    lines.push('FEED GAPS — buckets that could not be filled. These are real shortfalls, not ranking opinions:')
    for (const g of digest.gaps as { bucket: string; wanted: number; filled: number; reason: string; backfilled: number }[]) {
      lines.push(`- ${g.bucket}: ${g.filled} of ${g.wanted} wanted${g.backfilled ? `, ${g.backfilled} back-filled` : ''} — ${g.reason}`)
    }
    lines.push('')
  }
  if (digest.notes.length > 0) {
    lines.push('FEED NOTES:')
    for (const n of digest.notes) lines.push(`- ${n}`)
    lines.push('')
  }

  // The measurements, so "is my feed any good" is answerable from numbers
  // rather than from the model's impression of the item list.
  try {
    const [feedback, previous, settings] = await Promise.all([
      loadFeedback(userId),
      previousClusterIds(userId, digest.digestId),
      loadSettings(userId),
    ])
    const m = measure({
      shown: digest.items,
      feedback,
      previousClusterIds: previous,
      desiredTopics: settings.desiredTopics,
    })
    lines.push('HOW THE FEED IS MEASURING. Each of these is a separate measurement; there is deliberately no overall score, and you must not compute one:')
    for (const line of describe(m)) lines.push(`- ${line}`)
    lines.push('')
  } catch {
    lines.push('FEED MEASUREMENTS: could not be computed this time. Do not estimate them.')
    lines.push('')
  }

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Practice
// ---------------------------------------------------------------------------

/**
 * The learner's practice state across every shipped subject.
 *
 * Every subject, not just the default one, because `ONTOLOGIES` has two now and
 * a librarian that could only see rational expressions would answer "what
 * should I work on" with half the curriculum missing — and would do so
 * confidently.
 *
 * Three things are included that a naive summary would leave out, and each is
 * the most useful thing in its section:
 *
 *  - **What is BLOCKED and by what.** "You cannot start partial fractions yet
 *    because factoring quadratics is not demonstrated" is an actionable answer.
 *    A list of what is available is not.
 *  - **The review queue count.** Those rows are the engine's own failures to
 *    rule, and they are the most informative rows in the table.
 *  - **Whether the verifier is configured.** If no worker is reachable, every
 *    `transform_to_form` submission rules inconclusive. A librarian encouraging
 *    a learner into a practice set that cannot be marked is worse than one that
 *    says the grading is down.
 */
export async function practiceContext(userId: string): Promise<string> {
  const now = new Date().toISOString()
  const lines: string[] = ['PRACTICE STATE:', '']

  let configured = false
  try {
    configured = !!verifierConfig().url
  } catch {
    configured = false
  }
  lines.push(configured
    ? '- The equivalence verifier is reachable, so rewrite-into-a-form tasks can be graded.'
    : '- The equivalence verifier is NOT reachable. Every rewrite-into-a-form submission will rule "inconclusive" — tell them this before suggesting that kind of practice. Exact-arithmetic tasks (evaluate) are unaffected.')

  let awaitingReview = 0
  try {
    awaitingReview = await pendingReviewCount(userId)
  } catch {
    awaitingReview = 0
  }
  if (awaitingReview > 0) {
    lines.push(`- ${awaitingReview} answer${awaitingReview === 1 ? '' : 's'} could not be ruled by the engine and are waiting in the review queue. These are the engine's failures, not the learner's — do not describe them as mistakes.`)
  }
  lines.push('')

  // Fall back to the default ontology if the registry is somehow empty, so a
  // packaging mistake degrades to one subject rather than to silence.
  const subjects = ONTOLOGIES.length > 0 ? ONTOLOGIES : [RATIONAL_EXPRESSIONS]

  for (const ontology of subjects) {
    let strengths
    let world
    try {
      ;[strengths, world] = await Promise.all([
        loadStrengths(userId),
        loadTraversal(userId, ontology.subject.id),
      ])
    } catch (e) {
      lines.push(`SUBJECT "${ontology.subject.name}": state could not be loaded (${e instanceof Error ? e.message : 'unknown'}). Say you cannot see it rather than guessing.`)
      lines.push('')
      continue
    }

    const progress = summarise(ontology, strengths, now)
    const name = (id: string) => conceptById(ontology, id)?.name ?? id

    lines.push(`SUBJECT "${ontology.subject.name}" (id ${ontology.subject.id}):`)
    lines.push(`- ${progress.demonstrated} of ${progress.points} knowledge points demonstrated unaided; ${progress.assistedOnly} only with help.`)
    lines.push(`- ${progress.strongConcepts} of ${ontology.concepts.length} concepts are at or above the mastery floor (${MASTERY_FLOOR}).`)

    // An assisted-only point is the single most useful thing to surface: it
    // looks like progress in any count that adds the two together, and it is
    // exactly where the learner is fragile.
    if (progress.assistedOnly > 0) {
      lines.push(`- Those ${progress.assistedOnly} assisted-only point${progress.assistedOnly === 1 ? '' : 's'} are where they are weakest: they got there with a hint and have not done it alone.`)
    }

    const reached = world.route.length > 0 ? world.route : undefined
    try {
      const assembly = assemble({
        ontology, strengths, now, size: 6, reached, variantSeed: 1,
      })
      if (assembly.tasks.length > 0) {
        lines.push(`- Available to practise now: ${[...new Set(assembly.tasks.map(t => name(
          ontology.concepts.find(c => c.knowledgePoints.some(p => p.id === t.knowledgePointId))?.id ?? '',
        )))].filter(Boolean).join(', ')}.`)
      } else {
        lines.push('- Nothing is available to practise right now.')
      }
      if (assembly.blocked.length > 0) {
        lines.push('- Blocked, and by what:')
        for (const b of assembly.blocked) {
          lines.push(`  - ${name(b.conceptId)} needs ${b.missing.map(name).join(', ')} first.`)
        }
      }
      if (assembly.skipped.length > 0) {
        // The scheduler's own reasons, verbatim. A summary of them would be the
        // place a cooldown turned into "they have mastered it".
        lines.push(`- The scheduler also set aside ${assembly.skipped.length} candidate${assembly.skipped.length === 1 ? '' : 's'}, each with a stated reason (cooldown, interference, or an unverifiable task kind).`)
      }
    } catch (e) {
      lines.push(`- A practice set could not be assembled (${e instanceof Error ? e.message : 'unknown'}).`)
    }

    const open = world.route.length === 0
      ? openingDoors(ontology, world)
      : frontier(ontology, world)
    if (world.here) {
      lines.push(`- They are currently at "${name(world.here)}" in this subject's traversal, having reached ${world.route.length} concept${world.route.length === 1 ? '' : 's'}.`)
    } else {
      lines.push('- They have not started walking this subject yet.')
    }
    if (open.length > 0) {
      lines.push(`- Open next: ${open.map(name).join(', ')}.`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// The instruction
// ---------------------------------------------------------------------------

/**
 * The paragraph that turns the context into a constraint.
 *
 * Worth reading as carefully as the code. Each sentence closes off a specific
 * fabrication that a model handed this context will otherwise produce, and all
 * four have been observed in this app's other LLM surfaces:
 *
 *  1. Inventing a reason an item appeared, when the real reason is in `because`
 *     and is less flattering ("it is here because nothing else qualified").
 *  2. Turning the six separate measurements into an overall verdict, which is
 *     precisely what §6 warns against.
 *  3. Describing a back-filled discovery slot as a discovery pick.
 *  4. Calling an inconclusive ruling a wrong answer.
 */
export const GROUNDING_RULES = `
HOW TO USE THE FEED AND PRACTICE SECTIONS ABOVE — these are hard rules, not style preferences:

- Only state reasons that appear in the context. Every item carries the scorer's own "why" lines; quote or paraphrase those. If the context gives no reason for something, say you do not know why rather than constructing one.
- Do not invent a connection between an item and an interest. If "matched interests: none" is stated, the item is not there because of an interest, and saying otherwise is a fabrication the user has no way to check.
- Never combine the feed measurements into a single score, grade or verdict. They are kept separate on purpose: a feed can become more clickable while becoming less useful, and one number hides exactly that.
- If an item is marked BACK-FILLED, do not describe it as a discovery pick or a match. It is a stand-in for a slot nothing qualified for. Say that plainly if asked.
- An "inconclusive" practice ruling means the engine could not decide. It is not a wrong answer and must never be described as one.
- If a section says a thing could not be loaded, or has not been generated, tell the user that. Do not fill the gap.
`.trim()

// ---------------------------------------------------------------------------
// When to load it at all
// ---------------------------------------------------------------------------

/**
 * Words that mean the conversation is about the suggested feed.
 *
 * Loading the feed and practice sections costs two rounds of database reads and
 * a meaningful number of tokens on every message, which is not worth paying
 * when somebody is asking about a book. So the default is OFF and these decide.
 *
 * The failure mode is deliberately one-sided. A missed trigger means the
 * librarian says it has not looked and offers to — mildly annoying, honest, and
 * recoverable in one more message. The reverse (loading nothing but letting the
 * model answer anyway) is the fabrication the whole grounding design exists to
 * prevent, so `NOT_LOADED_NOTICE` closes it off explicitly.
 */
const FEED_TRIGGERS = new RegExp([
  // Nouns for the thing itself. `\w*` not `\b` on every one of these: a
  // trailing `\b` does NOT match before a plural's "s", so `\bheadline\b`
  // silently misses "any good headlines?" — which is how a person actually
  // asks. Caught by the phrasing test.
  '\\b(feed\\w*|digest\\w*|headline\\w*|news|article\\w*|rss|subscri\\w*|source\\w*|discovery|bucket\\w*)',
  // Asking why something was served.
  '\\b(worth seeing|why (is|was|did|am i|are these)|recommend\\w*|suggest\\w*)\\b',
  // "What should I read" — as a PHRASE, never the bare word "read". "What else
  // have I read by her" is a library question and must not trigger the reads.
  '\\b(what (should i|to) read|anything (good )?to read|what\'?s worth reading)\\b',
].join('|'), 'i')

/** Words that mean it is about the practice engine. */
// Same plural rule as FEED_TRIGGERS — `\w*` on every noun, because
// "polynomials" and "concepts" are how these get said.
const PRACTICE_TRIGGERS = new RegExp([
  '\\b(practi[cs]\\w*|math\\w*|exercise\\w*|problem set\\w*|concept\\w*|master\\w*)',
  '\\b(review queue|blocked|prerequisite\\w*|study\\w*|revis\\w*|quiz\\w*)',
  '\\b(algebra\\w*|logarithm\\w*|exponent\\w*|polynomial\\w*|fraction\\w*|quadratic\\w*)',
  '\\b(what should i (work|do|learn|study))\\b',
].join('|'), 'i')

/**
 * Which sections this conversation needs.
 *
 * Scans a WINDOW of recent messages rather than only the latest one, because
 * follow-ups carry no keywords. "Why that one?" after a question about the feed
 * is the commonest second message there is, and gating on the last message
 * alone would drop the context exactly when it was most needed.
 *
 * Both roles are scanned: an assistant turn that discussed the feed is as good
 * a signal that the thread is about the feed as a user turn asking about it.
 */
export function sectionsNeeded(
  messages: { role: string; content: string }[], windowSize = 6,
): { feed: boolean; practice: boolean } {
  const recent = messages.slice(-windowSize).map(m => m.content ?? '').join('\n')
  return {
    feed: FEED_TRIGGERS.test(recent),
    practice: PRACTICE_TRIGGERS.test(recent),
  }
}

/**
 * What to tell the model when a section was not loaded.
 *
 * Required, not optional. An absent feed section reads to a model as "there is
 * nothing to say about the feed", and it will then answer from imagination —
 * which is the one thing this module exists to stop. Saying "you have not
 * looked" is both true and actionable.
 */
export function notLoadedNotice(missing: { feed: boolean; practice: boolean }): string {
  const parts: string[] = []
  if (missing.feed) parts.push('their suggested feed')
  if (missing.practice) parts.push('their maths practice state')
  if (parts.length === 0) return ''
  return `YOU HAVE NOT LOADED ${parts.join(' or ')} this turn, because the conversation did not appear to be about ${parts.length > 1 ? 'them' : 'it'}. You therefore know NOTHING about ${parts.length > 1 ? 'them' : 'it'} right now — not that ${parts.length > 1 ? 'they are' : 'it is'} empty, and not what ${parts.length > 1 ? 'they contain' : 'it contains'}. If asked, say you need to look it up and invite them to ask again directly. Do not guess, and do not state or imply that nothing is there.`
}

/**
 * Everything, assembled.
 *
 * The two halves are fetched concurrently and each handles its own failure, so
 * a feed outage does not cost the librarian its view of the practice state —
 * which is the kind of coupling that makes one broken table look like a broken
 * assistant.
 *
 * `want` is now REQUIRED to opt in. It used to default to loading both, which
 * meant every message in every library chat paid for two rounds of reads.
 */
export async function librarianContext(
  userId: string, want: { feed?: boolean; practice?: boolean } = {},
): Promise<string> {
  const wantFeed = want.feed ?? false
  const wantPractice = want.practice ?? false

  const [feed, practice] = await Promise.all([
    wantFeed ? feedContext(userId) : Promise.resolve(''),
    wantPractice ? practiceContext(userId) : Promise.resolve(''),
  ])

  const sections = [feed, practice].filter(s => s.trim().length > 0)
  const notice = notLoadedNotice({ feed: !wantFeed, practice: !wantPractice })

  if (sections.length === 0) return notice
  return [...sections, GROUNDING_RULES, notice].filter(s => s.trim().length > 0).join('\n\n')
}
