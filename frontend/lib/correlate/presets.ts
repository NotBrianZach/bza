/**
 * Partners you can pick, as opposed to partners you have to build.
 *
 * ── What was already there, and what was missing ──────────────────────────
 *
 * PresetPicker and `correlate_presets` already let a player save the current
 * settings under a name and recall one. The machinery was complete. What it had
 * no answer for is the first game: the list starts empty, so the only way to get
 * a preset is to build one by hand out of seven axes, twelve shares and a scope
 * per medium — which is the exact work a preset exists to spare you. "Select
 * from presets" was reachable only by people who no longer needed it.
 *
 * So these are the starters. They ship as code rather than as rows, for the same
 * reason the media, relation, tuning and scope registries do: a registry is
 * extended by whoever writes the registry, it needs no migration, and it cannot
 * be half-deleted by one user's stray click. Recalling one copies its values
 * onto the session exactly as recalling a saved preset does — so a player who
 * wants a variant picks the nearest starter, adjusts, and saves it under their
 * own name. Nothing here is editable in place, and nothing here competes with
 * what they saved.
 *
 * ── A PRESET SETS WHAT THE PARTNER REACHES FOR, AND NOTHING ELSE ──────────
 *
 * Three fields of `Tuning` are deliberately left alone, and the line is the one
 * tuning.ts already draws:
 *
 *   `continuation` and `radio` govern *who takes the next turn*. They are not
 *   instructions to the interpreter — tuning.ts excludes them from
 *   `describeTuning` for exactly that reason. Picking a mood should not quietly
 *   hand the partner the wheel, and "Deep cut" turning on a radio run nobody
 *   asked for is a worse surprise than any axis could be.
 *
 *   `notes` is the player's own words. A preset writing into it would put words
 *   in their mouth, and — worse — overwrite whatever they had typed there. The
 *   field is capped precisely because past a few sentences it stops weighting
 *   and starts being a second persona; a preset spending that budget on the
 *   player's behalf is the one thing it must not do.
 *
 * A preset IS complete over the two fields it does govern. Every axis it does
 * not name goes back to that axis's neutral rather than staying wherever the
 * last preset left it, because otherwise picking A then B gives a blend of the
 * two and "select a partner" stops being deterministic.
 *
 * ── THE SHARE ARITHMETIC, WHICH IS THE WHOLE TRAP ─────────────────────────
 *
 * A share is a RAW WEIGHT over the non-muted media, so leaning toward a medium
 * means muting the rest. Set `music: 90` and leave the other eleven absent —
 * absent is `DEFAULT_SHARE`, 50 — and music gets 90/640, fourteen per cent.
 * That gap between the control and the arithmetic is what tuning.ts §16a was
 * written about, and a preset is the easiest possible place to reintroduce it,
 * because "lean toward music" is such a natural thing to write.
 *
 * `leans` therefore means *the complete set of live media*. `presetTuning`
 * mutes every medium not named, which is the same rule `startingTuning` applies
 * to `STARTING_SHARES`, and it is not a coincidence that they match — they are
 * the same claim about what a weighting means.
 *
 * A preset with no `leans` says nothing about media and leaves the session's own
 * weighting alone. That is a real option and some of these use it: how talkative
 * a partner is has nothing to do with which catalogues it reaches into.
 *
 * ── Why these eight ───────────────────────────────────────────────────────
 *
 * They are chosen to be genuinely different partners rather than a spread of
 * adjectives, and two of them exist to answer complaints the engine has earned:
 *
 *  - `plain-speaker` and `concrete` both push against the drift toward abstract
 *    readings. That drift is not a tuning fault — music and artwork arrive at
 *    the interpreter as a *name*, never as audio or pixels, so a reading of them
 *    has nothing concrete to hold on to and reaches for the idea instead. Low
 *    `abstraction` plus low `obliquity` is the only lever a player has against
 *    it, and nothing in the UI previously told them so.
 *  - `sceptic` is the counterweight to `STARTING_AXES`, which opens at
 *    `friction: 0` — "take the most generous available reading and extend it".
 *    That is the right first impression and the wrong partner to keep forever.
 */

import { CONTINUATION_OFF } from './continuation'
import { getMedium } from './media'
import {
  DEFAULT_SHARE, MUTED_SHARE, TUNING_AXES, getAxis, type Tuning, type TuningAxisId,
} from './tuning'
import type { MediumId } from './types'

export interface PartnerPreset {
  id: string
  name: string
  /**
   * One line, addressed to the player: what this partner is like to play
   * against. Required, and it is the field that makes a preset pickable — a
   * name alone ("Deep cut") tells somebody nothing about what will change.
   */
  is: string
  /**
   * Axis positions, 0–4. An axis left out returns to its neutral.
   *
   * Named rather than numbered so a reader can tell what is being asked for
   * without holding the axis order in their head, and so adding an axis to the
   * registry does not silently shift every preset's values.
   */
  axes?: Partial<Record<TuningAxisId, number>>
  /**
   * The complete set of media this partner answers in, with their raw weights.
   *
   * EVERY MEDIUM NOT NAMED HERE IS MUTED. See the header — this is the one field
   * where the obvious reading is the wrong one. Omit it entirely to leave the
   * session's weighting untouched.
   */
  leans?: Partial<Record<MediumId, number>>
}

export const PARTNER_PRESETS: PartnerPreset[] = [
  {
    id: 'plain-speaker',
    name: 'Plain speaker',
    is: 'Says the connection outright, in a sentence, about things you can actually point at.',
    axes: { obliquity: 0, abstraction: 0, register: 0, breadth: 1 },
  },
  {
    id: 'sceptic',
    name: 'The sceptic',
    is: 'Argues with your reading instead of extending it, and makes you defend the move.',
    axes: { friction: 4, obliquity: 2, register: 1 },
  },
  {
    id: 'deep-cut',
    name: 'Deep cut',
    is: 'Reaches for what you have never met, from as far outside your tradition as it can get.',
    axes: { nostalgia: 0, provenance: 4, obliquity: 3 },
  },
  {
    id: 'comfort',
    name: 'Comfort',
    is: 'Stays close to home and goes with you — the remembered rather than the unencountered.',
    axes: { nostalgia: 4, friction: 0, provenance: 0, obliquity: 1 },
  },
  {
    id: 'essayist',
    name: 'The essayist',
    is: 'Takes the room to earn a claim: worked prose, a few paragraphs, the idea underneath.',
    axes: { register: 4, breadth: 4, abstraction: 3 },
  },
  {
    id: 'concrete',
    name: 'Concrete things',
    is: 'Answers what the move literally contains, never what it is doing underneath.',
    axes: { abstraction: 0, obliquity: 1, breadth: 1 },
  },
  {
    /**
     * The media a reader is answered best by. `passage` searches their own
     * library, which is the strongest connection this engine can make and also
     * the one medium `replyMediaFor` refuses to retry — it can come back empty
     * through nobody's fault. So it leads here but does not stand alone.
     */
    id: 'reading-companion',
    name: 'Reading companion',
    is: 'Answers in passages from your own library, with pictures and scenes behind them.',
    axes: { nostalgia: 3, abstraction: 1 },
    leans: { passage: 50, artwork: 25, scene: 15, music: 10 },
  },
  {
    /**
     * The composed four. These are the no-miss media — they are assembled rather
     * than fetched from a catalogue, so they cannot fail on somebody else's
     * uptime, which is why the turn route's last stage reaches them through a
     * mute. A preset that leans on them deliberately is the only one here that
     * never depends on Deezer or Cleveland.
     */
    id: 'body',
    name: 'Body',
    is: 'Answers with something to do rather than something to look at — a gesture, a stretch, a movement.',
    axes: { abstraction: 0, obliquity: 1 },
    leans: { gesture: 35, movement: 30, stretch: 20, exercise: 15 },
  },
]

export function getPreset(id: string): PartnerPreset | null {
  return PARTNER_PRESETS.find(p => p.id === id) ?? null
}

/**
 * A preset, resolved against the media this game actually plays.
 *
 * `base` supplies the three fields a preset does not govern — see the header.
 * Passing the live tuning rather than `DEFAULT_TUNING` is what keeps a player's
 * own notes and their choice about who takes the next turn intact across a
 * change of partner.
 *
 * ── It degrades rather than overreaching ──────────────────────────────────
 *
 * If the game plays none of the media a preset leans on, the weighting is
 * dropped and the session's existing shares are kept. Muting eleven media in
 * favour of one that is not there is a contradiction: `weightedReplyMedia` would
 * ignore the mute anyway to keep its reply guarantee, so storing it would only
 * mislead whoever read the row. `startingTuning` makes the same call on the same
 * grounds.
 *
 * The axes still apply in that case. They are a claim about how the partner
 * answers, which is true whatever it answers in.
 *
 * Scopes are carried over from `base` untouched. A preset naming a region of a
 * medium is a reasonable future extension, but silently clearing a scope the
 * player had set would lose work they did deliberately, and silently setting one
 * would narrow the game in a way the preset's one-line description could not
 * honestly cover.
 */
export function presetTuning(
  preset: PartnerPreset, media: MediumId[], base: Tuning,
): Tuning {
  const axes: Partial<Record<TuningAxisId, number>> = {}
  for (const [id, value] of Object.entries(preset.axes ?? {})) {
    const axis = getAxis(id)
    // Unknown axis, or a value the registry would reject: skipped rather than
    // clamped. A preset is authored, not user input — a bad value is a bug to be
    // caught by the test suite, and clamping it would hide that.
    if (!axis || typeof value !== 'number') continue
    if (!Number.isInteger(value) || value < 0 || value >= TUNING_AXES[axis.id].labels.length) continue
    axes[axis.id] = value
  }

  const shares: Partial<Record<MediumId, number>> = { ...base.shares }
  const leans = preset.leans
  if (leans && media.some(m => leans[m] !== undefined && getMedium(m))) {
    // Rebuilt from nothing, not merged: `leans` is the complete set of live
    // media, so a medium the base had weighted and the preset does not name has
    // to end up muted rather than keeping its old weight.
    for (const key of Object.keys(shares)) delete shares[key as MediumId]
    for (const m of media) shares[m] = leans[m] ?? MUTED_SHARE
  }

  return {
    shares,
    axes,
    // The player's, not the preset's.
    scopes: base.scopes,
    continuation: base.continuation ?? CONTINUATION_OFF,
    radio: base.radio ?? false,
    notes: base.notes ?? '',
  }
}

/**
 * The media a preset leans on that this game does not play, by plural name.
 *
 * For the picker to *say* what it is dropping. PresetPicker already does this
 * for saved presets (`missingMedia`) and the reason carries over unchanged: a
 * preset quietly doing less than its name promises is worse than one that says
 * which part of itself is unavailable here.
 */
export function presetMissingMedia(preset: PartnerPreset, media: MediumId[]): string[] {
  return Object.keys(preset.leans ?? {})
    .filter(m => !media.includes(m as MediumId))
    .map(m => getMedium(m)?.plural ?? m)
}

/** Shares as percentages of the live total, for showing what a preset will do. */
export function presetShareSummary(
  preset: PartnerPreset, media: MediumId[],
): { medium: MediumId; percent: number }[] {
  const leans = preset.leans
  if (!leans) return []
  const live = media.filter(m => (leans[m] ?? MUTED_SHARE) > MUTED_SHARE)
  const total = live.reduce((sum, m) => sum + (leans[m] ?? 0), 0)
  if (total <= 0) return []
  return live
    .map(m => ({ medium: m, percent: Math.round(100 * (leans[m] ?? 0) / total) }))
    .sort((a, b) => b.percent - a.percent)
}

/** True when a preset would change nothing about what the partner reaches for. */
export function presetSaysNothing(preset: PartnerPreset): boolean {
  const axesSaySomething = Object.entries(preset.axes ?? {})
    .some(([id, v]) => getAxis(id) && v !== getAxis(id)!.neutral)
  return !axesSaySomething && preset.leans === undefined
}

/** The default share, re-exported so the picker can describe a weight without importing tuning. */
export { DEFAULT_SHARE }
