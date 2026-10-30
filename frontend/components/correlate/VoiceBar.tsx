'use client'

import { AlertTriangle, Ear, Loader2, Mic, MicOff, Volume2 } from 'lucide-react'
import { VOICE_COMMANDS, spokenMediaNames } from '@/lib/correlate/voice'
import type { VoiceControl } from './useVoiceControl'
import type { CorrelationGame, MediumId } from '@/lib/correlate/types'

/**
 * The voice mode control, and the only place a player learns what to say.
 *
 * Discoverability is the whole problem with a voice interface: an invisible
 * command set is one nobody uses, and a hands-free player is by definition not
 * reading. So the list is generated from `VOICE_COMMANDS` — the same table the
 * parser matches against — rather than written out here. A phrase that stops
 * working cannot keep being printed.
 *
 * `say that again` and `what can I say` are the escape hatches that make the
 * rest learnable without looking, which is why they exist as commands at all.
 */
export default function VoiceBar({
  voice,
  media,
  switchTargets,
  expanded,
  onToggleExpanded,
}: {
  voice: VoiceControl
  media: MediumId[]
  switchTargets: CorrelationGame[]
  expanded: boolean
  onToggleExpanded: () => void
}) {
  /**
   * Browsers without `SpeechRecognition` are told, not left with a dead button.
   *
   * Firefox is the live case. A control that silently does nothing is worse than
   * an absent one, and worse again than one that explains itself.
   */
  if (!voice.supported) {
    return (
      <div className="mb-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 px-3 py-2">
        <p className="flex items-start gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
          <MicOff size={12} className="flex-shrink-0 mt-0.5" />
          <span>
            Hands-free play needs the browser&rsquo;s speech recognition, which this one does not
            have. Chrome, Edge and Safari do.
          </span>
        </p>
      </div>
    )
  }

  return (
    <div className={`mb-4 rounded-xl border px-3 py-2 transition-colors ${
      voice.listening
        ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/20'
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
    }`}>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={voice.toggle}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
            voice.listening
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          {voice.listening ? <Mic size={13} /> : <MicOff size={13} />}
          {voice.listening ? 'Listening' : 'Hands-free'}
        </button>

        {/* Three states, and they have to be distinguishable without reading:
            listening, talking back (mic closed), and working. A player who
            cannot tell "it is thinking" from "it did not hear me" will repeat
            themselves into a second turn. */}
        {voice.listening && (
          <span className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 min-w-0">
            {voice.speaking ? (
              <><Volume2 size={11} className="flex-shrink-0 text-emerald-600 dark:text-emerald-400" /> speaking — mic paused</>
            ) : voice.heard ? (
              <><Ear size={11} className="flex-shrink-0" /> <span className="truncate italic">{voice.heard}</span></>
            ) : (
              <><Ear size={11} className="flex-shrink-0 opacity-50" /> say something</>
            )}
          </span>
        )}

        <button
          onClick={onToggleExpanded}
          aria-expanded={expanded}
          className="ml-auto text-[11px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex-shrink-0"
        >
          {expanded ? 'Hide commands' : 'What can I say'}
        </button>
      </div>

      {/* What it last understood, or last failed to. The leading dash is the
          parser's "that was not a command" marker — shown rather than spoken,
          because the mic is open while the player talks to the room and
          announcing every miss would make that unbearable. */}
      {voice.listening && voice.lastResult && (
        <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500 truncate">
          {voice.lastResult.startsWith('—')
            ? <span className="italic">{voice.lastResult} <span className="not-italic">· not a command</span></span>
            : <span>heard: <span className="text-gray-600 dark:text-gray-300">{voice.lastResult}</span></span>}
        </p>
      )}

      {voice.error && (
        <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 leading-relaxed">
          <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" /> {voice.error}
        </p>
      )}

      {expanded && (
        <div className="mt-2 pt-2 border-t border-gray-200/70 dark:border-gray-700/70">
          <dl className="space-y-1">
            {VOICE_COMMANDS.map(c => (
              <div key={c.kind + c.say} className="flex gap-2 text-[11px]">
                <dt className="font-mono text-gray-700 dark:text-gray-200 flex-shrink-0 w-44">
                  &ldquo;{c.say}&rdquo;
                </dt>
                <dd className="text-gray-500 dark:text-gray-400 min-w-0">{c.does}</dd>
              </div>
            ))}
          </dl>
          {/* The two open vocabularies, listed because they are the ones a
              player cannot guess: which media this session plays, and which
              games it can switch into. Both read from the registries, so
              neither can go stale. */}
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
            <span className="text-gray-400 dark:text-gray-500">media you can ask for: </span>
            {spokenMediaNames(media).map(m => m.say).join(', ')}
          </p>
          {switchTargets.length > 0 && (
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              <span className="text-gray-400 dark:text-gray-500">games you can switch to: </span>
              {switchTargets.map(g => g.name).join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * The phrase for one control, printed beside it while voice mode is on.
 *
 * The original ask, and the reason the command table is declarative. Returns
 * null when voice is off or the control has no phrase, so a caller can render it
 * unconditionally.
 */
export function VoiceHint({ phrase }: { phrase: string | null }) {
  if (!phrase) return null
  return (
    <span
      title="Say this instead, while hands-free is on"
      className="font-mono text-[10px] text-gray-400 dark:text-gray-500"
    >
      &ldquo;{phrase}&rdquo;
    </span>
  )
}
