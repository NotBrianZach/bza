/**
 * The voices a partner can be read aloud in.
 *
 * ── Why this is its own leaf and not part of persona.ts ──────────────────
 *
 * The list started in `lib/persona.ts`, beside the rate/pitch table that uses
 * it, and that put the dependency the wrong way round: `tuning.ts` validates a
 * stored voice against this list, so `tuning.ts` had to import `persona.ts` —
 * which imports analytics and reads localStorage. A pure registry acquired a
 * browser dependency, and the standalone test harness noticed immediately by
 * failing to resolve the chain at all.
 *
 * So the data lives here, where both can reach it: the registry validates
 * against it and the speaking layer consumes it. Same shape as media, relations
 * and the tuning axes — declarative data in `lib/correlate`, with the parts that
 * touch the browser importing downward into it and never the reverse.
 *
 * `name` is deliberately the reader's own persona names rather than a second
 * vocabulary invented for voices: it is the same cast of eight, and renaming
 * them here would make them look like different things.
 */

export interface VoiceChoice {
  /** Matches a `PERSONA_VOICES` key in lib/persona.ts and the worker's `persona_id`. */
  id: string
  name: string
  /** One line, so a picker can say what it will sound like before you play it. */
  is: string
}

export const VOICE_CHOICES: VoiceChoice[] = [
  { id: 'librarian', name: 'Flirty Librarian', is: 'Warm and a little arch. The default.' },
  { id: 'sensei', name: 'Sensei', is: 'Slow and deliberate, leaves room after a sentence.' },
  { id: 'professor', name: 'Professor', is: 'Measured and low, as though reading from notes.' },
  { id: 'rival', name: 'Rival', is: 'Flat and unimpressed. Good for a Duel.' },
  { id: 'buddy', name: 'Study Buddy', is: 'Quick and bright, talks like a friend.' },
  { id: 'coach', name: 'Coach', is: 'Fast and emphatic. Hard to ignore.' },
  { id: 'tsundere', name: 'Tsundere', is: 'Brisk and high, reluctantly helpful.' },
  { id: 'custom', name: 'Plain', is: 'No character at all — the browser’s own voice.' },
]

export const VOICE_IDS: string[] = VOICE_CHOICES.map(v => v.id)

export function getVoice(id: string | null | undefined): VoiceChoice | null {
  if (!id) return null
  return VOICE_CHOICES.find(v => v.id === id) ?? null
}
