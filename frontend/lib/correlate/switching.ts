/**
 * Switching games mid-session.
 *
 * Designed in reports/2026-10-28-game-switching.md; this is that design built.
 * A game of Tag hands off to Embodiment partway through a chain, the chain's
 * last offering becomes the new game's opening move, and both halves stay on
 * the record as what they actually were.
 *
 * Three facts shape everything here, and all three come from the code rather
 * than from the idea:
 *
 * 1. **A turn records its own game** (`listen_turns.mode`, migration 76).
 *    Without it a switch retroactively relabels every turn already played,
 *    which is the one form of this feature that really does break the promise
 *    `rules` makes — see the migration's header.
 *
 * 2. **`seedWorld` decides compatibility.** Seven games start as blank
 *    collections and the content arrives from play; four ship an authored
 *    premise the game is *about*. Switching into the first kind is clean — the
 *    world is supposed to start empty, so starting it empty is not a degraded
 *    version of anything. Switching into the second has no honest answer:
 *    inject Duel's apartment and a scene from 2022 arrives from nowhere
 *    mid-chain, drop it and Duel has nothing to score.
 *
 * 3. **The switch is a branch, so replay starts in the right place for free.**
 *    `worldFor` replays `world_delta` from the game's seed along the path
 *    rather than trusting stored state. Replaying Tag's `chain` deltas onto
 *    Embodiment's `{learned, sensations}` seed produces a world that is neither
 *    game's, so replay has to begin at the switch. The boundary this file
 *    computes is what it begins at.
 *
 * Pure and dependency-free, like graph.ts and for the same reason: the engine,
 * the board and the prompt builder all need exactly this arithmetic and none of
 * them should be the one that owns it.
 */

import { GAMES, GAME_LIST, getGame } from './games'
import type { CorrelationGame, CorrelationTurn } from './types'

/**
 * World keys the engine maintains rather than the game, so they never count
 * against a shape comparison.
 *
 * `facts` accumulates in `mergeWorld` for every game whether or not the game
 * declares it. `mediaVisited` is written into every turn's delta by the turn
 * route's `visitedAfter`, so a destination that declares it always gets it
 * regardless of what the source declared — which is the whole reason
 * `tag` → `chain` counts as carrying verbatim despite `chain` declaring one key
 * more.
 */
export const ENGINE_WORLD_KEYS = ['facts', 'mediaVisited'] as const

/**
 * Does this seed value carry content somebody authored?
 *
 * The test is what a *premise* looks like, not what a type looks like:
 *
 *  - a non-empty string is authored prose (Duel's scene, Navigation's door)
 *  - a non-empty array is an authored list (Transformation's invariants,
 *    Investigation's open questions)
 *  - a number is a counter, never a premise — Prediction's `{hits: 0,
 *    misses: 0}` is an empty scoreboard, not content
 *  - null and empty collections are the blank the game is meant to start as
 *
 * Numbers being excluded is the one judgement in here, and it is the one that
 * decides Prediction's class. A zeroed record is the same kind of thing as an
 * empty array: a shape with nothing in it yet.
 */
function isAuthored(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'number' || typeof value === 'boolean') return false
  if (value && typeof value === 'object') return Object.values(value).some(isAuthored)
  return false
}

/** The seed keys that ship authored content, so a refusal can name them. */
export function authoredSeedKeys(game: CorrelationGame): string[] {
  return Object.entries(game.seedWorld)
    .filter(([, v]) => isAuthored(v))
    .map(([k]) => k)
}

/**
 * True when the world starts as blank collections and the content arrives from
 * play. Seven of eleven, as of 2026-10-29.
 *
 * Derived rather than listed, which is the point: a twelfth game with an
 * authored premise lands in tier 4 by existing, instead of by somebody
 * remembering to add it to a table.
 */
export function isEmptySeeded(game: CorrelationGame): boolean {
  return authoredSeedKeys(game).length === 0
}

/** The world keys a game owns, excluding the ones the engine maintains. */
function ownKeys(game: CorrelationGame): string[] {
  return game.worldKeys.map(k => k.key).filter(k => !ENGINE_WORLD_KEYS.includes(k as any))
}

/**
 * How compatible one game is with another, as an ordered pair.
 *
 *  1 — **carries verbatim.** Both empty-seeded, and the destination asks for no
 *      world key the source did not keep. The chain genuinely continues rather
 *      than restarting: no replay boundary, and spent relations do not clear.
 *      `tag` ↔ `chain` is the only such pair, and the two differ in exactly one
 *      field (`declaredRelation`), which makes them a good mechanism test and a
 *      poor test of the general case.
 *  2 — **clean handoff, fresh world.** The destination is empty-seeded. The
 *      last offering on the table becomes the opening move, which is already
 *      how every game starts. This is the tier worth building and the one
 *      Tag → Embodiment lives in.
 *  3 — **defensible but lossy.** Both premise-seeded and sharing a world shape:
 *      `duel` ↔ `transformation`, which both turn on `scene`. Reachable only
 *      between two already-running games, and each direction needs a decision
 *      about the destination's standing premise. Computed, deliberately not
 *      offered — see `switchTargets`.
 *  4 — **do not offer.** Any other switch into a premise-seeded game. There is
 *      no honest answer to where the premise came from.
 *
 * Null when the two are the same game, or either id is unknown.
 *
 * One deviation from the report, which listed `navigation` ↔ `construction` as
 * tier 3: `construction` is empty-seeded (`placeName: null`, three empty
 * arrays), so `navigation` → `construction` is an ordinary clean handoff and
 * comes out tier 2 here. The reverse is tier 4, because Navigation ships a
 * door. The report's own seeding rule says so; its tier table grouped the pair
 * by world shape and contradicted itself. Deriving the tiers is what surfaced
 * it.
 */
export function switchTier(fromId: string, toId: string): 1 | 2 | 3 | 4 | null {
  const from = getGame(fromId)
  const to = getGame(toId)
  if (!from || !to || from.id === to.id) return null

  if (isEmptySeeded(to)) {
    if (isEmptySeeded(from)) {
      const carries = ownKeys(to).every(k => ownKeys(from).includes(k))
      if (carries) return 1
    }
    return 2
  }

  if (!isEmptySeeded(from) && ownKeys(to).some(k => ownKeys(from).includes(k))) return 3

  return 4
}

/**
 * The games a player may switch into from here, in registry order.
 *
 * Tiers 1, 2 and 3. Tier 4 is the only class with no honest form: its
 * destination ships a premise about a scene that has nothing to do with what
 * you were playing, and there is no answer to where that premise came from.
 *
 * Tier 3 was withheld on the first pass and is admitted now that the premise
 * question has an answer — see `derivedSeedKeys`. The distinction that made it
 * answerable is that a tier-3 destination's premise is not arbitrary: it is
 * *about* a scene the source game also has, so the scene carries and only the
 * keys written about it need authoring.
 */
export function switchTargets(fromId: string): CorrelationGame[] {
  return GAME_LIST.filter(g => canSwitch(fromId, g.id))
}

export function canSwitch(fromId: string, toId: string): boolean {
  const tier = switchTier(fromId, toId)
  return tier === 1 || tier === 2 || tier === 3
}

/**
 * The game every chain starts as, and the one the picker leads with.
 *
 * Tag, because its rules land in one sentence and because every other
 * empty-seeded game is now reachable from inside it. That second clause is what
 * makes this a structural fact rather than an editorial preference.
 */
export const ENTRY_GAME_ID = 'tag'

/**
 * The games worth *starting*, as opposed to the games worth playing.
 *
 * Before switching existed these were the same set and the picker was eleven
 * cards. They are not the same set any more: six of the eleven are reachable from
 * a game of Tag by switching, so offering them as separate starts asks the player
 * to make a decision up front that they can now make mid-chain, with the
 * advantage of having something on the table to carry into it. Eleven cards also
 * read as eleven unrelated games, which is the opposite of what the seeding split
 * says is true — seven of them are one exchange with different rules.
 *
 * So: Tag, plus everything a game of Tag cannot become. Derived from `canSwitch`
 * rather than listed, which means the two lists cannot disagree and a twelfth
 * game lands in whichever is correct by existing. Today that is Tag and the four
 * premise-seeded games, because a premise cannot be conjured mid-chain — exactly
 * the tier-4 refusal, read as a product decision instead of an error message.
 */
export function startableGames(): CorrelationGame[] {
  return GAME_LIST.filter(g => g.id === ENTRY_GAME_ID || !canSwitch(ENTRY_GAME_ID, g.id))
}

/**
 * The games you reach by switching rather than by starting.
 *
 * Named for the picker, which has to say where they went. A list that silently
 * dropped six games would be worse than the eleven-card version: a player who
 * knows Embodiment exists and cannot find it has been told nothing, whereas
 * "these are inside Tag" is the whole mechanism in four words.
 */
export function switchOnlyGames(): CorrelationGame[] {
  const startable = new Set(startableGames().map(g => g.id))
  return GAME_LIST.filter(g => !startable.has(g.id))
}

/**
 * The destination's world keys that the source also keeps, and therefore has a
 * live value for.
 *
 * `duel` ↔ `transformation` is the whole of this today: both turn on `scene`,
 * and the scene the player has been playing is what crosses. Everything else in
 * either game's world is written *about* its own scene and cannot.
 */
export function carriedSeedKeys(fromId: string, toId: string): string[] {
  const from = getGame(fromId)
  const to = getGame(toId)
  if (!from || !to) return []
  return ownKeys(to).filter(k => ownKeys(from).includes(k))
}

/**
 * The destination's *authored* keys that nothing can carry, and which therefore
 * have to be written for the scene that did.
 *
 * This is the question that kept tier 3 closed, and naming it this precisely is
 * what opened it. The problem was never `scene` — a drifted scene is still a
 * scene and crosses fine. It was `invariants`:
 *
 *   transformation.seedWorld.invariants = ['There is still one man waiting.']
 *
 * which is a true statement about a bus shelter and a meaningless one about an
 * apartment in 2022. Both available options were bad — keep it and the world
 * asserts something false, drop it and Transformation has lost the thing it
 * tracks, since `invariants` is "what has survived every transformation so far"
 * and an empty one gives the first transformation nothing to preserve against.
 *
 * So the third option: author it, for the scene that actually arrived. That is a
 * model call producing *seed* content, which the engine does nowhere else —
 * every seed in the registry is written by hand, and `worldFor` only ever folds
 * deltas onto one. The route makes the call; see `switchSeed` for where the
 * result goes, and `buildSeedPrompt` for what is asked.
 *
 * Empty for `transformation` → `duel`, which is the easy direction: Duel's only
 * authored key is `scene`, and `score` and `established` are supposed to start
 * empty. That asymmetry is real and worth knowing — one direction of the only
 * tier-3 pair needed no new mechanism at all.
 */
export function derivedSeedKeys(fromId: string, toId: string): string[] {
  const to = getGame(toId)
  if (!to) return []
  const carried = carriedSeedKeys(fromId, toId)
  return authoredSeedKeys(to).filter(k => !carried.includes(k))
}

/** The `worldKeys` entries for the keys that need authoring, descriptions and all. */
export function derivedSeedSpec(fromId: string, toId: string): { key: string; description: string }[] {
  const to = getGame(toId)
  if (!to) return []
  const wanted = derivedSeedKeys(fromId, toId)
  return to.worldKeys.filter(k => wanted.includes(k.key))
}

/**
 * The world the new game's replay folds onto.
 *
 * Tiers 1 and 2 fold onto the destination's own seed, unchanged: tier 1 because
 * the shapes match and the existing deltas apply, tier 2 because starting empty
 * is where the destination is supposed to start.
 *
 * Tier 3 is the one that needs a seed built for the occasion — the carried keys
 * taken from the world as it stood, and the authored ones supplied by `derived`.
 * A key missing from `derived` falls back to the destination's canned value,
 * which is the wrong content but a shaped one; the route refuses the switch
 * rather than relying on that, and the fallback exists so this stays a pure
 * function with no failure mode of its own.
 *
 * Durability is not this function's job and is worth saying so nothing goes
 * looking for it: the route writes the result into the switching turn's
 * `world_delta`, exactly the way `mediaVisited` is written, so every later fold
 * reproduces it from the row rather than needing the seed recomputed.
 */
export function switchSeed(
  fromId: string,
  toId: string,
  fromWorld: Record<string, any>,
  derived: Record<string, unknown> = {},
): Record<string, any> {
  const to = getGame(toId)
  if (!to) return {}
  if (switchTier(fromId, toId) !== 3) return { ...to.seedWorld }

  const seed: Record<string, any> = { ...to.seedWorld }
  for (const key of carriedSeedKeys(fromId, toId)) {
    if (fromWorld[key] !== undefined) seed[key] = fromWorld[key]
  }
  for (const key of derivedSeedKeys(fromId, toId)) {
    if (derived[key] !== undefined) seed[key] = derived[key]
  }
  return seed
}

/**
 * Whether a switch restarts the world replay — and therefore whether spent
 * relations clear at it.
 *
 * One boundary, two consequences, deliberately the same boundary for both:
 *
 *  - **Replay.** `worldFor` folds `world_delta` from the game's seed. Folding
 *    Tag's `chain` deltas onto Embodiment's seed gives a world that is neither
 *    game's, so a tier-2 switch has to restart the fold. A tier-1 switch must
 *    *not*: the keys are the same, the deltas apply, and restarting would throw
 *    away the chain the destination game is about to keep playing.
 *  - **Spent relations.** `buildUserPrompt` emits "RELATIONS JUST SPENT … A
 *    reply may not reuse these." Translation's relation set is exactly
 *    `['translation']`, so switching into it on a turn whose parent used
 *    `translation` would leave zero legal relations while the prompt
 *    simultaneously demands one and forbids the only one available. "Do not
 *    reuse the connection you just used" belongs to a game you have stopped
 *    playing, so it lapses — but only where the game really did change shape.
 *    Tag and Chain have identical relation sets and the same no-repeat rule, so
 *    clearing across that pair would drop a rule both games are still enforcing.
 */
function restartsReplay(fromId: string, toId: string): boolean {
  return switchTier(fromId, toId) !== 1
}

/** The game a turn was played under. Null `mode` means the session's own. */
export function modeOf(turn: CorrelationTurn, sessionMode: string): string {
  return turn.mode || sessionMode
}

/**
 * The game in force at the end of a path.
 *
 * Note what this reads and what it does not: the path, never the session row.
 * `listen_sessions.mode` stays as the game the session *started* as, which is
 * what keeps every existing read of it correct — the home page strip, the
 * session list, the analytics. The branch's game is a fact about the branch.
 */
export function modeAlong(path: CorrelationTurn[], sessionMode: string): string {
  return path.length > 0 ? modeOf(path[path.length - 1], sessionMode) : sessionMode
}

export interface SwitchBoundary {
  /** The turn that was played under the new game. */
  turn: CorrelationTurn
  from: string
  to: string
  tier: 1 | 2 | 3 | 4 | null
}

/**
 * Every switch on a path, oldest first.
 *
 * Includes tier-1 switches, which are not replay boundaries but are still the
 * player having changed games and still want saying so in the log.
 */
export function switchesAlong(path: CorrelationTurn[], sessionMode: string): SwitchBoundary[] {
  const found: SwitchBoundary[] = []
  let previous = sessionMode
  for (const turn of path) {
    const mode = modeOf(turn, sessionMode)
    if (mode !== previous) {
      found.push({ turn, from: previous, to: mode, tier: switchTier(previous, mode) })
      previous = mode
    }
  }
  return found
}

/**
 * The suffix of a path whose deltas and relations still apply to the game being
 * played now.
 *
 * The whole path when nothing switched, and when the only switches were tier 1.
 *
 * An illegal switching turn never reaches this function, and that is worth
 * stating because it looks like an omission. A move that was turned away is not
 * on anybody's path — `defaultParent` walks up past it and `pathTo` therefore
 * never contains it — so a switch carried by a move that failed does not stick.
 * The player is back where they were, playing what they were playing. That is
 * the honest outcome of "the switch is a move", and the graph gives it for free.
 */
export function pathSinceSwitch(path: CorrelationTurn[], sessionMode: string): CorrelationTurn[] {
  let start = 0
  let previous = sessionMode
  path.forEach((turn, i) => {
    const mode = modeOf(turn, sessionMode)
    if (mode !== previous) {
      if (restartsReplay(previous, mode)) start = i
      previous = mode
    }
  })
  return start === 0 ? path : path.slice(start)
}

export interface BranchGame {
  /** The game this turn is played under. */
  mode: string
  /** Its definition, or null when the id is not in the registry. */
  game: CorrelationGame | null
  /**
   * The turns whose world deltas fold into this turn's world and whose
   * relations count as spent. The whole path when nothing changed shape.
   */
  since: CorrelationTurn[]
  /** The game being left behind, when this very turn is the switch. */
  switchedFrom: string | null
  /** Switches already on the path, oldest first. */
  boundaries: SwitchBoundary[]
}

/**
 * Which game is being played, and against how much of the path.
 *
 * The single resolver, called by the turn route, the board and the prompt
 * builder so none of them can disagree about what game a turn is. `switchTo` is
 * the player's request for *this* turn: it makes this turn the boundary, which
 * is why `since` collapses to nothing on a tier-2 switch — there is no history
 * in the new game's world yet, which is exactly what "the world starts as it was
 * designed to" means.
 *
 * An unrequested or impossible `switchTo` is ignored rather than refused, so a
 * stale control cannot wedge a game. The route refuses it properly first, with
 * a sentence, via `switchRefusal`.
 */
export function activeBranch(
  path: CorrelationTurn[],
  sessionMode: string,
  switchTo?: string | null,
): BranchGame {
  const boundaries = switchesAlong(path, sessionMode)
  const current = modeAlong(path, sessionMode)

  if (switchTo && switchTo !== current && canSwitch(current, switchTo)) {
    return {
      mode: switchTo,
      game: getGame(switchTo),
      since: restartsReplay(current, switchTo) ? [] : path,
      switchedFrom: current,
      boundaries,
    }
  }

  return {
    mode: current,
    game: getGame(current),
    since: pathSinceSwitch(path, sessionMode),
    switchedFrom: null,
    boundaries,
  }
}

/**
 * Why this switch cannot happen, or null when it can.
 *
 * One function for the control and the rule, the same arrangement
 * `selfReplyRefusal` has — so the player is shown the sentence the server would
 * have sent rather than a button that fails.
 */
export function switchRefusal(
  fromId: string,
  toId: string,
  opts: { onTable: boolean; selfReply?: boolean },
): string | null {
  const to = getGame(toId)
  if (!to) return `There is no game called "${toId}".`
  if (fromId === toId) return `You are already playing ${to.name}.`

  if (opts.selfReply) {
    return 'A switch is a move you make. The partner answering itself is not your turn to change ' +
      'the game in — play a move to switch.'
  }

  // The last offering is the new game's opening move, and that is the entire
  // carry: no world, no premise, nothing but the thing on the table. With
  // nothing on the table there is nothing for the new game to open on, and
  // "switching" would just be starting one.
  if (!opts.onTable) {
    return 'There is nothing on the table to carry into another game. A switch answers the last ' +
      'offering under new rules, so it needs one.'
  }

  const tier = switchTier(fromId, toId)
  if (tier === 4) {
    const keys = authoredSeedKeys(to)
    const named = keys.length > 0 ? ` its ${keys.join(', ')}` : ' its premise'
    return `${to.name} does not start empty — it ships${named}, and the game is about that. ` +
      'Dropping it would remove the thing the game is for, and injecting it mid-chain would ' +
      'contradict whatever you were just playing. You can start a new game of it instead.'
  }
  return tier === null ? `${to.name} cannot be switched into from here.` : null
}

export interface SwitchChange {
  /** What is changing, as a label. */
  what: string
  /** What it changes to, in the player's terms. */
  detail: string
}

/**
 * Everything a switch changes that the player would otherwise find out by
 * playing into it.
 *
 * Written as data rather than prose so the control can render it and the prompt
 * can state it from one source. The four entries are the four fields the report
 * found carry real weight — the world, the legality gate, the relation set and
 * the declaration — plus the judge, which the report flagged as unexamined and
 * which is the one a player is most likely to be surprised by: it changes who
 * rules on their move.
 */
export function switchChanges(fromId: string, toId: string): SwitchChange[] {
  const from = getGame(fromId)
  const to = getGame(toId)
  if (!from || !to) return []

  const changes: SwitchChange[] = []
  const tier = switchTier(fromId, toId)

  if (tier === 1) {
    changes.push({ what: 'The world', detail: `Carries over — ${to.name} keeps the chain you have built.` })
  } else if (tier === 3) {
    const carried = carriedSeedKeys(fromId, toId)
    const derived = derivedSeedKeys(fromId, toId)
    changes.push({
      what: 'The world',
      detail: `Your ${carried.join(' and ')} crosses over as it stands. ${to.name} ` +
        (derived.length > 0
          ? `also keeps ${derived.join(' and ')}, which ${derived.length === 1 ? 'does' : 'do'} not ` +
            `exist yet for this scene — ${derived.length === 1 ? 'it is' : 'they are'} written for it ` +
            `when you switch, rather than ${to.name}'s own opening scene arriving from nowhere.`
          // Derived rather than named, so a game added later does not need this
          // sentence edited — and so no game id appears in this file's copy.
          : `starts its ${ownKeys(to).filter(k => !authoredSeedKeys(to).includes(k)).join(' and ') || 'world'} ` +
            `from nothing, which is where ${to.name} is supposed to start them.`),
    })
  } else {
    changes.push({ what: 'The world', detail: `Starts fresh. ${to.name}'s world is meant to begin empty, and your last offering is its opening move. Nothing already recorded changes.` })
  }

  if (from.judge !== to.judge) {
    changes.push({
      what: 'Who rules',
      detail: to.judge === 'player'
        ? 'You do, from here on. It argues its side; whether a connection landed is your call.'
        : 'An interpreter does, from here on. It reads your move and the reading sticks.',
    })
  }

  if (from.declaredRelation !== to.declaredRelation) {
    changes.push({
      what: 'Naming the relation',
      detail: to.declaredRelation === 'required'
        ? 'Required from your next move. You name the connection before it is judged, and claiming one and making another is the way to lose a turn.'
        : to.declaredRelation === 'never'
          ? 'Stops being yours to name. The interpreter names the thread it sees.'
          : 'Optional — name it or let it be read.',
    })
  }

  if (!!from.enforcesConstraint !== !!to.enforcesConstraint) {
    changes.push({
      what: 'Being turned away',
      detail: to.enforcesConstraint
        ? 'Possible from here. A move that does not connect is refused rather than read generously.'
        : 'No longer possible. A move is read rather than judged, so nothing is refused.',
    })
  }

  const fromRelations = from.relations === 'all' ? null : from.relations
  const toRelations = to.relations === 'all' ? null : to.relations
  if (JSON.stringify(fromRelations) !== JSON.stringify(toRelations)) {
    changes.push({
      what: 'Relations in play',
      detail: toRelations === null
        ? 'All seven.'
        : `Only ${toRelations.join(', ')}.` +
          (tier !== 1
            ? ' The relation your last move spent is released, since not reusing it was the other game’s rule.'
            : ''),
    })
  }

  return changes
}

/**
 * One line naming what a turn's game was, for the log.
 *
 * Null when the turn was played under the game being played now, because then
 * it says nothing — a marker on every turn in an unswitched game is noise that
 * makes the real ones invisible.
 */
export function playedUnder(
  turn: CorrelationTurn,
  sessionMode: string,
  activeMode: string,
): CorrelationGame | null {
  const mode = modeOf(turn, sessionMode)
  if (mode === activeMode) return null
  return GAMES[mode] ?? null
}
