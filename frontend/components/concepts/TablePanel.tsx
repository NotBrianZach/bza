'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Dices, Loader2, Send, User } from 'lucide-react'
import { authedFetch } from '@/lib/authedFetch'
import type { PlacedRegion } from '@/lib/concepts/armature'
import type { TableTurn } from '@/lib/concepts/narrate'
import {
  BACKGROUNDS, DEFAULT_CHARACTER, MAX_TRAIT, RACES, isMade, raceOf, type Character,
} from '@/lib/concepts/rpg'

/**
 * The table: a character, a log, and a box to say what you do.
 *
 * This is the part that makes RPG mode a session rather than a narrated map.
 * The map still decides where you can GO — that is the traversal, and no
 * sentence typed here moves anybody. What happens while you are standing
 * somewhere is played out, in the setting's own tag-and-dice system.
 *
 * ── THE LOG LIVES IN THE BROWSER ──────────────────────────────────────────
 *
 * localStorage, keyed per region, which is the same choice the Armat Sur
 * runner makes and is right for the same reason: the journey is the part worth
 * a table in Postgres, and it is already there. A scene log is a transcript of
 * a story only you were at. Putting it in the database would be a migration, a
 * retention question and an export obligation, bought for a feature nobody has
 * yet asked to keep.
 *
 * Per region rather than one long scroll, because arriving somewhere new IS
 * the scene change. Walking into Krull should not open with the last thing a
 * merchant said to you in Hasspab.
 *
 * ── TWO EXCHANGES, LIKE A REAL TABLE ──────────────────────────────────────
 *
 * When the game master calls for a roll, the server rolls it and the dice come
 * back with the reply. The result is then sent STRAIGHT BACK for the GM to
 * narrate, which is the second request and the reason the loop is worth
 * having: describe, call for a roll, roll, describe the result. The model
 * never sees the number before it has committed to what the roll is for.
 */

const MAX_TURNS = 40

function storageKey(regionId: string) { return `bza-table-${regionId}` }

function loadLog(regionId: string): TableTurn[] {
  try {
    const raw = localStorage.getItem(storageKey(regionId))
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.slice(-MAX_TURNS) : []
  } catch { return [] }
}

const CHARACTER_KEY = 'bza-table-character'

/**
 * A stored character, merged onto the defaults.
 *
 * Merged rather than cast. The previous version returned `parsed as Character`,
 * which was true while a character was a name and a background and stopped
 * being true the moment it grew a race and a trait: anybody with a sheet saved
 * before this change would have had `character.trait` undefined, and
 * `trait.trim()` would have thrown on first render. A cast is a claim about
 * data written by an older version of the code, and that is exactly the claim
 * nobody is in a position to make.
 */
function loadCharacter(): Character {
  try {
    const raw = localStorage.getItem(CHARACTER_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (parsed && typeof parsed === 'object') {
      return {
        ...DEFAULT_CHARACTER,
        ...(typeof parsed.name === 'string' ? { name: parsed.name } : {}),
        ...(typeof parsed.background === 'string' ? { background: parsed.background } : {}),
        ...(typeof parsed.race === 'string' ? { race: parsed.race } : {}),
        ...(typeof parsed.trait === 'string' ? { trait: parsed.trait } : {}),
      }
    }
  } catch { /* fall through */ }
  return DEFAULT_CHARACTER
}

export default function TablePanel({ region, held }: {
  region: PlacedRegion
  /** Concept names the player has reached. Flavour on the sheet — see the route. */
  held: string[]
}) {
  const [character, setCharacter] = useState<Character>(DEFAULT_CHARACTER)
  const [log, setLog] = useState<TableTurn[]>([])
  const [action, setAction] = useState('')
  const [busy, setBusy] = useState(false)
  /* Opens on creation for a sheet nobody has made, and stays shut afterwards.
     Set from the stored character once it loads, not on first render, since
     before that every character looks unmade. */
  const [sheetOpen, setSheetOpen] = useState(false)
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const loaded = loadCharacter()
    setCharacter(loaded)
    if (!isMade(loaded)) setSheetOpen(true)
  }, [])
  useEffect(() => { setLog(loadLog(region.id)) }, [region.id])
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest' }) }, [log, busy])

  const persist = useCallback((next: TableTurn[], regionId: string) => {
    setLog(next)
    try { localStorage.setItem(storageKey(regionId), JSON.stringify(next.slice(-MAX_TURNS))) }
    catch { /* a full quota costs the transcript, not the turn */ }
  }, [])

  const saveCharacter = useCallback((next: Character) => {
    setCharacter(next)
    try { localStorage.setItem(CHARACTER_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }, [])

  const send = useCallback(async (text: string) => {
    if (busy || !text.trim()) return
    setBusy(true)
    const regionId = region.id
    const withPlayer: TableTurn[] = [...log, { who: 'player', text: text.trim() }]
    persist(withPlayer, regionId)
    setAction('')

    try {
      const post = (payload: Record<string, unknown>) => authedFetch('/api/learn/table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regionId, character, held, ...payload }),
      }).then(r => r.json() as Promise<{
        text?: string
        roll?: TableTurn['roll']
        work?: NonNullable<TableTurn['work']>
        error?: string
      }>)

      const first = await post({ log: withPlayer, action: text.trim() })
      if (first.error) {
        persist([...withPlayer, { who: 'gm', text: first.error }], regionId)
        return
      }
      /* `work` rides on the turn, so the problem is part of the transcript
         rather than component state — see TableTurn.work. */
      const gmTurn: TableTurn = {
        who: 'gm', text: first.text ?? '', roll: first.roll, work: first.work,
      }
      const withGm = [...withPlayer, gmTurn]
      persist(withGm, regionId)

      /* The dice came back, so hand them straight to the game master to
         narrate. It committed to what the roll was for before it saw the
         number, which is the whole point of the two exchanges. */
      if (first.roll) {
        const second = await post({ log: withGm, resolved: first.roll })
        if (second.text) {
          persist([...withGm, { who: 'gm', text: second.text }], regionId)
        }
      }
    } catch {
      persist([...withPlayer, { who: 'gm', text: 'The game master could not be reached.' }], regionId)
    } finally {
      setBusy(false)
    }
  }, [busy, log, region.id, character, held, persist])

  /**
   * The verifier has ruled on work that was on the table, so hand the ruling
   * back to the game master to narrate.
   *
   * Exactly the shape the roll already has: the answer went somewhere the
   * model is not, came back as fact, and goes into the next prompt as fact.
   * `/api/learn/verify` did the ruling and moved strength — this route only
   * ever gets told what it decided.
   *
   * The ruling is written onto the TURN so the transcript carries it. A log
   * that showed a problem with no outcome after a reload would be a scene
   * that forgot what happened in it.
   */
  const settleWork = useCallback(async (
    turnIndex: number,
    ruling: NonNullable<TableTurn['work']>['ruling'],
    assisted: boolean,
    /**
     * The verifier's reason. Stored on the turn and NOT forwarded in `ruled`
     * below — see `work.verdictDetail` for why the prompt gets the word and
     * the player gets the sentence.
     */
    verdictDetail?: string,
  ) => {
    const regionId = region.id
    const marked = log.map((t, i) => (
      i === turnIndex && t.work ? { ...t, work: { ...t.work, ruling, verdictDetail } } : t))
    persist(marked, regionId)
    const work = log[turnIndex]?.work
    if (!work || !ruling) return
    setBusy(true)
    try {
      const res = await authedFetch('/api/learn/table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regionId,
          character,
          held,
          log: marked,
          ruled: { conceptName: work.conceptName, ruling, assisted },
        }),
      })
      /*
       * `work` as well as `text`, or the fix above goes nowhere: the route
       * may now attach the next piece of work to the turn that narrates a
       * ruling, and a client reading only `text` would drop it on the floor
       * — the errand would continue in the prose and not on the table.
       */
      const data = await res.json() as {
        text?: string
        work?: NonNullable<TableTurn['work']>
      }
      if (data.text || data.work) {
        persist([...marked, { who: 'gm', text: data.text ?? '', work: data.work }], regionId)
      }
    } catch {
      /* The ruling stands and is on the turn; only the telling of it is
         missing, same as everywhere else the narrator is optional. */
    } finally {
      setBusy(false)
    }
  }, [log, region.id, character, held, persist])

  const bg = BACKGROUNDS.find(b => b.id === character.background) ?? BACKGROUNDS[0]
  const made = isMade(character)

  return (
    <div className='rounded-lg border border-gray-800 bg-gray-900'>
      <div className='flex items-center gap-2 border-b border-gray-800 px-3 py-2'>
        <h3 className='text-xs font-semibold text-gray-100'>At the table — {region.name}</h3>
        <button
          onClick={() => setSheetOpen(v => !v)}
          className='ml-auto inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-200'
        >
          <User size={11} />
          {character.name.trim() || 'a traveller'}, {bg.name.toLowerCase()}
        </button>
      </div>

      {sheetOpen && (
        <CharacterSheet
          character={character}
          onChange={saveCharacter}
          held={held}
          /* On a sheet that has not been made yet this is the first thing in
             the panel rather than a drawer under it, and the composer is
             hidden behind it — see the `made` guard below. Deciding who you
             are is a step, not a setting. */
          creating={!made}
          onDone={() => setSheetOpen(false)}
        />
      )}

      <div className='max-h-72 space-y-2 overflow-y-auto px-3 py-2'>
        {log.length === 0 && (
          <p className='text-[11px] leading-snug text-gray-500'>
            You are standing in {region.name}. Say what you do — talk to somebody, look at
            something, try something. The game master answers, and calls for dice when it could
            go either way.
          </p>
        )}
        {log.map((turn, i) => (
          <div key={i}>
            {turn.who === 'player'
              ? <p className='text-xs text-sky-300'>&rsaquo; {turn.text}</p>
              : turn.text.split(/\n{2,}/).map((para, j) => (
                <p key={j} className={`text-xs leading-relaxed text-gray-200 ${j > 0 ? 'mt-1.5' : ''}`}>
                  {para}
                </p>
              ))}
            {turn.roll && (
              /* The expression, the dice and the total, in the order the tags
                 were given, so each die maps to its tag. Shown rather than
                 summarised: a roll the player cannot read is a roll they are
                 being asked to take on trust. */
              <div className='mt-1.5 rounded border border-amber-900/50 bg-amber-950/20 px-2 py-1'>
                <p className='flex items-center gap-1 text-[11px] text-amber-200'>
                  <Dices size={11} /> {turn.roll.expression}
                </p>
                <p className='font-mono text-[11px] text-amber-300/80'>
                  {turn.roll.dice} = {turn.roll.results.join(' ')} = <strong>{turn.roll.total}</strong>
                </p>
                <p className='text-[11px] text-amber-200/70'>{turn.roll.reading}</p>
              </div>
            )}
            {turn.work && (
              <WorkCard
                work={turn.work}
                busy={busy}
                onRuled={(ruling, assisted, detail) => settleWork(i, ruling, assisted, detail)}
              />
            )}
          </div>
        ))}
        {busy && (
          <p className='flex items-center gap-1.5 text-[11px] text-gray-500'>
            <Loader2 size={11} className='animate-spin' /> the game master is thinking…
          </p>
        )}
        <div ref={endRef} />
      </div>

      {/* No composer until there is somebody to act.
          The alternative — letting a nameless default play and offering the
          sheet as a setting — is what produced a world in which everyone was
          "a traveller, scribe". Twenty seconds of deciding is the price of the
          pronoun meaning anything. */}
      <div className={`flex items-end gap-1.5 border-t border-gray-800 px-3 py-2 ${made ? '' : 'hidden'}`}>
        <textarea
          value={action}
          onChange={e => setAction(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(action) }
          }}
          rows={2}
          placeholder='What do you do?'
          className='min-w-0 flex-1 resize-none rounded border border-gray-700 bg-gray-950 px-2 py-1 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500'
        />
        <button
          onClick={() => void send(action)}
          disabled={busy || !action.trim()}
          className='inline-flex items-center gap-1 rounded bg-sky-900 px-2 py-1.5 text-[11px] text-sky-100 hover:bg-sky-800 disabled:opacity-40'
        >
          {busy ? <Loader2 size={11} className='animate-spin' /> : <Send size={11} />}
        </button>
      </div>
    </div>
  )
}

/**
 * Making a character, and reading one back.
 *
 * ── Why creation is a step and not a settings drawer ──────────────────────
 *
 * It was a name field and five chips behind a toggle most people would never
 * press, so everybody played as "a traveller, scribe" — a default nobody
 * chose. Four small decisions taken on purpose before the first scene is the
 * difference between a character and a placeholder, and it costs about twenty
 * seconds.
 *
 * ── What the choices do, stated where they are made ───────────────────────
 *
 * Race carries real tags from the setting's own "Core X Tags" and the game
 * master may reach for them in a roll. Background does not and says so. The
 * trait is free text and is handed over as a tag like any other, which is why
 * the hint asks for something that could go wrong — a sheet of pure
 * advantages is a sheet the dice cannot do anything interesting with.
 *
 * None of it touches the mathematics, and the note at the foot says that
 * plainly. A player who suspected their race might open a prerequisite would
 * be choosing one for the wrong reason, and would be wrong.
 */
function CharacterSheet({ character, onChange, held, creating, onDone }: {
  character: Character
  onChange: (next: Character) => void
  held: string[]
  creating: boolean
  onDone: () => void
}) {
  const bg = BACKGROUNDS.find(b => b.id === character.background) ?? BACKGROUNDS[0]
  const race = raceOf(character.race)
  return (
    <div className='space-y-2.5 border-b border-gray-800 bg-gray-950/50 px-3 py-3'>
      {creating && (
        <p className='text-xs text-gray-300'>
          Who are you? Four quick decisions, then the table is yours.
        </p>
      )}

      <div>
        <label className='text-[10px] uppercase tracking-wide text-gray-500'>Name</label>
        <input
          value={character.name}
          onChange={e => onChange({ ...character, name: e.target.value.slice(0, 40) })}
          placeholder='Who the world calls you'
          autoFocus={creating}
          className='mt-0.5 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500'
        />
      </div>

      <div>
        <label className='text-[10px] uppercase tracking-wide text-gray-500'>
          People — brings its own tags
        </label>
        <div className='mt-1 flex flex-wrap gap-1'>
          {RACES.map(r => (
            <button
              key={r.id}
              type='button'
              onClick={() => onChange({ ...character, race: r.id })}
              title={r.is}
              className={`rounded-full border px-2 py-0.5 text-[11px] ${
                character.race === r.id
                  ? 'border-sky-600 bg-sky-950 text-sky-200'
                  : 'border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
        <p className='mt-1 text-[11px] leading-snug text-gray-500'>{race.is}</p>
        {/* The tags themselves, with their tiers, because they are the part
            that will actually turn up in a roll and the player should be able
            to see what they are taking. */}
        <ul className='mt-1 space-y-0.5'>
          {race.tags.map(t => (
            <li key={t.name} className='text-[11px] text-gray-400'>
              <span className='font-mono text-gray-300'>{t.name}{t.tier}</span>
              <span className='text-gray-500'> — {t.is}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <label className='text-[10px] uppercase tracking-wide text-gray-500'>Trade</label>
        <div className='mt-1 flex flex-wrap gap-1'>
          {BACKGROUNDS.map(b => (
            <button
              key={b.id}
              type='button'
              onClick={() => onChange({ ...character, background: b.id })}
              title={b.is}
              className={`rounded-full border px-2 py-0.5 text-[11px] ${
                character.background === b.id
                  ? 'border-sky-600 bg-sky-950 text-sky-200'
                  : 'border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>
        <p className='mt-1 text-[11px] leading-snug text-gray-500'>{bg.is}</p>
      </div>

      <div>
        <label className='text-[10px] uppercase tracking-wide text-gray-500'>
          One thing that is true of you
        </label>
        <input
          value={character.trait}
          onChange={e => onChange({ ...character, trait: e.target.value.slice(0, MAX_TRAIT) })}
          placeholder='Afraid of deep water · Owes money in Krull · Never forgets a face'
          className='mt-0.5 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500'
        />
        <p className='mt-1 text-[11px] leading-snug text-gray-500'>
          Yours, and the game master may use it as a tag. Pick something that could cost you
          as easily as help you — those are the ones worth having.
        </p>
      </div>

      {/* The boundary, last and in plain words. */}
      <p className='text-[10px] leading-snug text-gray-600'>
        None of this changes the mathematics. Your trade is colour; your people&rsquo;s tags and
        your trait are for what happens in a scene. What opens a road is
        {held.length > 0 ? ` the ${held.length} concepts you have reached` : ' the concepts you reach'} on
        the map, and nothing here.
      </p>

      <button
        type='button'
        onClick={onDone}
        disabled={creating && !character.name.trim()}
        className='rounded bg-sky-900 px-3 py-1 text-[11px] text-sky-100 hover:bg-sky-800 disabled:opacity-40'
      >
        {creating ? 'Take your seat' : 'Done'}
      </button>
    </div>
  )
}

/**
 * Work the engine put on the table, answered at the table.
 *
 * ── THE LAYOUT IS THE SAFETY ARGUMENT, AGAIN ──────────────────────────────
 *
 * docs/RPG_AND_THE_GRAPH.md §3 put the problem on the Practice tab because
 * that is where the verifier lives. That was the wrong read of its own goal:
 * a commission that ejects you from the scene to answer it is not
 * mathematics happening INSIDE the fiction, it is a tab switch with a story
 * attached. So the problem is here, and the honesty comes from where each
 * piece of text originates rather than from which tab it is on.
 *
 * The prose above this card is the game master's and contains no
 * mathematics, because the GM was never shown any — it wrote `WORK:` and
 * stopped, and /api/learn/table chose the task afterwards. The problem in
 * this card is `assemble()`'s own string, passed through untouched. The
 * answer goes to /api/learn/verify, the same route and the same verifier the
 * Practice tab uses, which rules it and moves strength. The ruling comes back
 * and the GM narrates it without ever having judged it.
 *
 * So: the GM frames, the engine poses, the verifier rules. Three parties, and
 * the one that can write fiction is the one that can do least.
 *
 * ── WHAT MUST NOT CREEP IN ────────────────────────────────────────────────
 *
 * A hint button. The Practice tab has assistance and it is modelled —
 * `assistedOnly` in `summarise()` means something precise and costs strength.
 * Here the only assistance is the one the verify route already understands,
 * reported honestly as a circumstance. Anything the GM offered instead would
 * be mathematics nobody checked, which is the first thing §10 forbids.
 */
function WorkCard({ work, busy, onRuled }: {
  work: NonNullable<TableTurn['work']>
  busy: boolean
  onRuled: (
    ruling: NonNullable<TableTurn['work']>['ruling'],
    assisted: boolean,
    /** The verifier's reason, when it gave one. See `work.verdictDetail`. */
    detail?: string,
  ) => void
}) {
  const [answer, setAnswer] = useState('')
  const [sending, setSending] = useState(false)
  const [assisted, setAssisted] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  const settled = !!work.ruling

  const submit = useCallback(async () => {
    if (sending || settled || !answer.trim()) return
    setSending(true)
    setNote(null)
    try {
      const res = await authedFetch('/api/learn/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: work.taskId,
          answer,
          assistance: assisted ? 'worked' : 'none',
        }),
      })
      /*
       * `brokeAt` as well as `ruling`. This type used to be `{ ruling?: string }`
       * and that narrowness WAS the bug: /api/learn/verify has always returned
       * the reason, and reading only the word discarded it at the door. For an
       * evaluate task `brokeAt.detail` reads "the value at p = 2, a = 1, q = 3,
       * b = 3 is 54, and this is 18" — the right answer and the mistake, which
       * is exactly what "Ruled incorrect" on its own refuses to say.
       */
      const data = await res.json() as {
        status?: string
        verdict?: { ruling?: string; brokeAt?: { step?: number; detail?: string } }
        message?: string
        error?: string
      }
      /* An unreadable answer is not a ruling. The verify route says so
         explicitly and the table has to respect that distinction — turning
         "I could not parse that" into a scene about being wrong would be the
         table inventing a verdict. */
      if (data.status !== 'ruled' || !data.verdict?.ruling) {
        setNote(data.message || data.error || 'That could not be read as an answer.')
        return
      }
      onRuled(
        data.verdict.ruling as NonNullable<TableTurn['work']>['ruling'],
        assisted,
        data.verdict.brokeAt?.detail,
      )
    } catch {
      setNote('The verifier could not be reached, so nothing was ruled.')
    } finally {
      setSending(false)
    }
  }, [answer, assisted, sending, settled, work.taskId, onRuled])

  return (
    <div className='mt-1.5 rounded border border-sky-900/60 bg-sky-950/30 px-2 py-1.5'>
      <p className='flex flex-wrap items-baseline gap-x-2 text-[10px] uppercase tracking-wide text-sky-400/80'>
        <span>The work</span>
        <span className='normal-case tracking-normal text-sky-300/70'>
          {work.conceptName} · {work.kind}
        </span>
      </p>
      {/* Verbatim from the engine. Not restyled into prose, because the point
          is that this text is of a different kind from the scene above it. */}
      <p className='mt-1 text-xs leading-relaxed text-sky-50'>{work.prompt}</p>
      {work.given && (
        <p className='mt-0.5 font-mono text-[11px] text-sky-200/90'>{work.given}</p>
      )}
      {work.at && Object.keys(work.at).length > 0 && (
        <p className='mt-0.5 font-mono text-[11px] text-sky-200/70'>
          {Object.entries(work.at).map(([k, v]) => `${k} = ${v}`).join(', ')}
        </p>
      )}
      {(work.domainConditions ?? []).length > 0 && (
        <p className='mt-0.5 text-[10px] text-sky-300/60'>
          holds where {work.domainConditions!.join(', ')}
        </p>
      )}

      {settled ? (
        <>
          <p className='mt-1.5 text-[11px] text-sky-300/80'>
            Ruled <strong>{work.ruling}</strong>
            {work.ruling === 'inconclusive' && (
              <span className='text-sky-400/70'>
                {' '}— the engine could not settle it. Not counted against you; it has gone for review.
              </span>
            )}
          </p>
          {/* The reason, which this card used to drop. Rendered for every
              ruling that carries one rather than only for `incorrect`: the
              verifier also explains a correct answer it reached an unexpected
              way, and a card that only elaborates on bad news trains you to
              read its presence as a verdict before you have read the words.

              Not styled as a warning for the same reason. It is the engine's
              own sentence about what it compared, and on an evaluate task it
              is the only place the right answer appears anywhere at the
              table. */}
          {work.verdictDetail && (
            <p className='mt-1 text-[11px] leading-relaxed text-sky-200/70'>{work.verdictDetail}</p>
          )}
        </>
      ) : (
        <div className='mt-1.5 flex flex-wrap items-center gap-1.5'>
          <input
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit() }}
            disabled={sending || busy}
            placeholder='your answer'
            aria-label={`Your answer to the work on ${work.conceptName}`}
            className='min-w-0 flex-1 rounded border border-sky-800 bg-gray-900 px-2 py-1 font-mono text-xs text-sky-50 placeholder-sky-700 focus:border-sky-600 focus:outline-none'
          />
          <button
            type='button'
            onClick={submit}
            disabled={sending || busy || !answer.trim()}
            className='rounded bg-sky-900 px-2 py-1 text-[11px] text-sky-100 hover:bg-sky-800 disabled:opacity-40'
          >
            {sending ? <Loader2 size={11} className='animate-spin' /> : 'Hand it over'}
          </button>
          {/* The same declaration the Practice tab asks for, in the same
              words, because it means the same thing to `summarise()` and a
              different word here would read as a different promise. */}
          <label className='flex items-center gap-1 text-[10px] text-sky-400/70'>
            <input
              type='checkbox'
              checked={assisted}
              onChange={e => setAssisted(e.target.checked)}
              disabled={sending || busy}
            />
            I had help
          </label>
        </div>
      )}
      {note && <p className='mt-1 text-[11px] text-amber-300/80'>{note}</p>}
    </div>
  )
}
