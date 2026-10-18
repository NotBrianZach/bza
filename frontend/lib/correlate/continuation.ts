/**
 * Self-reply — the partner answering its own last offering.
 *
 * Every turn until now had the same shape: the player offers, the partner reads it
 * and answers. That makes the player the only thing that can advance a chain, and
 * it is a real constraint rather than a neutral one. A chain is a conversation
 * between two readers, and sometimes the interesting thing to do is to stand back
 * and watch the other one carry on — to see where its own answer takes it when
 * nobody redirects it. That is what this is: the partner takes a turn in which the
 * move is *its own previous reply*.
 *
 * Why this lives in its own module rather than in `tuning.ts`.
 *
 * Tuning answers "what should my partner reach for". This answers "who takes the
 * next turn", which is a different question about a different part of the loop —
 * the same reason media and relations are two registries instead of one. The stored
 * *value* does ride along inside `Tuning`, because it is something the player asks
 * of their partner and adjusts between turns and the plumbing for that already
 * exists; but the rules are here, and the most important of them is the one below.
 *
 * **Continuation is never told to the interpreter.** `describeTuning` does not
 * mention it and a test asserts it does not. A model told "the player intends to
 * let you run three times" writes toward a monologue: it holds material back, it
 * sets things up, it stops answering the thing in front of it. Each self-reply is
 * asked for on its own, as a turn, with no knowledge of whether another is coming.
 *
 * Two structural guards, and they are the same two the rest of the engine uses:
 *
 *  1. **The depth is derived from the log, not from the request.** `selfRepliesSince`
 *     counts the trailing partner-authored turns on the branch, exactly as
 *     `spentRelations` reads the relation column rather than trusting a world-state
 *     field the model was asked to maintain. A client that asks for a fourth
 *     consecutive self-reply is refused by arithmetic.
 *  2. **The relation rule does the rest for free.** A self-reply is a turn, so the
 *     relation it uses is recorded on it, so the no-repeated-relation rule applies
 *     to it. The partner cannot answer itself twice the same way, which is precisely
 *     the failure mode — a partner agreeing with itself in a slowly narrowing circle
 *     is the self-reply equivalent of an invented track.
 */

import type { CorrelationTurn, MoveBy } from './types'

/** How many times in a row the partner may carry on by itself. */
export type ContinuationDepth = 0 | 1 | 2 | 3

export const CONTINUATION_OFF: ContinuationDepth = 0

/**
 * The hard cap on consecutive self-replies, enforced server-side from the log.
 *
 * Three, because the thing being bounded is not cost but drift: by the fourth
 * consecutive turn the partner is answering its own answer to its own answer, every
 * step locally reasonable, and the chain has stopped being about anything the player
 * put into it. The player re-entering is not an interruption of the run — it is what
 * makes the run worth having happened.
 */
export const MAX_SELF_REPLIES = 3

/**
 * Radio — the partner carrying on with nobody waiting to stop it.
 *
 * `MAX_SELF_REPLIES` bounds a *run*: a stretch the partner takes between two of the
 * player's moves. The bound exists because the player coming back is what makes the
 * run worth having happened. Radio is the case where the player has said in advance
 * that they are not coming back for a while — they want the chain to keep playing
 * the way a station keeps playing. Capping that at three is not protecting them from
 * drift; it is refusing the thing they asked for.
 *
 * So radio lifts the cap, and the honest thing to record is what that costs.
 *
 *  - **The arithmetic guard becomes advisory.** The cap was derived from the log
 *    rather than taken from the request precisely so that no client could talk its
 *    way past it. Radio arrives *in* the request, inside the tuning, like every
 *    other thing a player asks of their partner — so under radio the server is
 *    taking the client's word for it. That is a real reduction in what this module
 *    guarantees, chosen deliberately, not an oversight to be tidied up later.
 *  - **The relation rule is what is left.** It still applies to every self-reply,
 *    because a self-reply is a turn and the relation it used is recorded on it. The
 *    partner still cannot answer itself the same way twice in a row, and that is now
 *    the only structural thing between a long run and a slowly narrowing circle.
 *
 * It is a separate flag rather than a fifth `ContinuationDepth` because it answers a
 * different question. Continuation asks "how many turns after mine"; radio asks "do
 * you need me at all". Widening the depth union would also have put a non-numeric
 * value into the arithmetic that reads it as a count.
 */
export interface ContinuationOptions {
  /** The player has asked the partner to carry on without them. */
  radio?: boolean
}

export const RADIO_LABEL = 'Keep going'

export const RADIO_HINT =
  'It answers itself for as long as you let it, and plays each answer as it arrives. ' +
  'Your move whenever you want it back — anything you play lands in the chain and it ' +
  'carries on from there.'

/**
 * What radio needs from the session before it can play anything.
 *
 * Audio is the only medium with a timeline of its own, so it is the only one a run
 * can advance by itself; a radio over paintings and passages is a slideshow nobody
 * asked for. Returned as a sentence rather than a boolean because the fix is a
 * specific thing the player has to go and do — turn music back on — and a disabled
 * control that does not say why is the worse failure.
 */
export function radioRefusal(media: readonly string[]): string | null {
  return media.includes('music')
    ? null
    : 'Radio plays what it finds, and music is the only thing here with sound. Put ' +
      'music back in play for this game and it can start.'
}

export const CONTINUATION_LABELS: Record<ContinuationDepth, string> = {
  0: 'Off',
  1: 'Once',
  2: 'Twice',
  3: 'Three times',
}

/** Player-facing explanation of each stop, shown under the control. */
export const CONTINUATION_HINTS: Record<ContinuationDepth, string> = {
  0: 'It waits for you. You can still ask it to carry on, one turn at a time.',
  1: 'After your move it takes one more turn, answering its own answer.',
  2: 'Two turns of its own after each of yours.',
  3: 'Three — the most it may ever take in a row.',
}

export const CONTINUATION_STOPS: ContinuationDepth[] = [0, 1, 2, 3]

/** Who authored a turn's move. Absent on every row written before migration 59. */
export function moverOf(turn: Pick<CorrelationTurn, 'move_by'> | null): MoveBy {
  return turn?.move_by === 'partner' ? 'partner' : 'player'
}

export function isSelfReply(turn: Pick<CorrelationTurn, 'move_by'> | null): boolean {
  return moverOf(turn) === 'partner'
}

/**
 * How many partner-authored turns sit at the end of this branch.
 *
 * The depth of the current run, and therefore what the cap is measured against.
 * Counted from the tail backwards and stopped by the first turn the player took, so
 * a player move anywhere resets it — which is the whole mechanism: the cap bounds a
 * run, not a game.
 *
 * Illegal turns are counted like any other. A move that was turned away is still a
 * turn the partner spent, and skipping it would let a rejected self-reply buy an
 * extra one.
 */
export function selfRepliesSince(path: CorrelationTurn[]): number {
  let n = 0
  for (let i = path.length - 1; i >= 0; i--) {
    if (!isSelfReply(path[i])) break
    n++
  }
  return n
}

/**
 * What the player may still ask for, given where the branch stands.
 *
 * `Infinity` under radio rather than a large number, so a caller that wants to show
 * a count has to notice the case and say something else instead of rendering it.
 */
export function selfRepliesLeft(
  path: CorrelationTurn[],
  opts: ContinuationOptions = {},
): number {
  if (opts.radio) return Infinity
  return Math.max(0, MAX_SELF_REPLIES - selfRepliesSince(path))
}

/**
 * Why the partner cannot answer itself here, or null when it can.
 *
 * One function, used by the route to refuse and by the board to disable the
 * control, so the two cannot disagree about what is available — and the sentence a
 * player reads is the sentence the server would have sent.
 */
export function selfReplyRefusal(
  parent: CorrelationTurn | null,
  path: CorrelationTurn[],
  opts: ContinuationOptions = {},
): string | null {
  if (!parent) {
    return 'There is nothing on the table for it to answer. Open with something first.'
  }
  if (!parent.legal) {
    return 'That move was turned away, so there is nothing there to answer.'
  }
  if (!parent.reply_offering) {
    return 'That exchange has no answer of its own, so there is nothing for it to carry on from.'
  }
  // Skipped under radio, which is the one case where the player has already said
  // they are not waiting to take the next turn. The three refusals above still
  // apply: they are about there being nothing on the table to answer, which radio
  // does not change.
  if (!opts.radio && selfRepliesSince(path) >= MAX_SELF_REPLIES) {
    return `It has taken ${MAX_SELF_REPLIES} turns in a row. Your move next — a run any longer ` +
      `than this stops being about anything you put in.`
  }
  return null
}

/**
 * What the interpreter is told when the move it is reading is its own.
 *
 * Deliberately shaped like an instruction to answer rather than permission to
 * continue. The failure this text exists to prevent is the partner treating the turn
 * as a second attempt at the same answer — elaborating, qualifying, agreeing with
 * itself — instead of doing to its own offering what it would do to a player's.
 *
 * It says nothing about how many turns are coming, because it does not know: see the
 * module comment.
 */
export const SELF_REPLY_GUIDANCE =
  'ANSWERING YOURSELF\n' +
  'The offering you are reading is your own, from the exchange just above. The player ' +
  'has stood back for this turn and asked you to carry on alone.\n' +
  '- This is not another go at the same answer. Do not elaborate it, qualify it, or ' +
  'explain it again. Read it the way you would read a move someone else had played, ' +
  'and answer it with something new.\n' +
  '- Answer what your own offering left out. You chose it, so you know what it does ' +
  'not do; that absence is the most honest thing here to answer.\n' +
  '- You may narrow what you are answering. Set "reframing" to the part of your own ' +
  'offering now in play — a detail of it rather than the whole — and answer that part. ' +
  'Leave it out if the whole of it is still the thing on the table.\n' +
  '- Do not agree with yourself. Two offerings of yours in a row that say the same ' +
  'thing in two media is not a connection, it is a restatement.\n' +
  '- You are not ruling on anything this turn. No move has been claimed, so there is ' +
  'nothing to judge legal or illegal — only something to answer.'
