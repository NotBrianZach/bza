'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Dices, Loader2, Send, User } from 'lucide-react'
import { authedFetch } from '@/lib/authedFetch'
import type { PlacedRegion } from '@/lib/concepts/armature'
import type { TableTurn } from '@/lib/concepts/narrate'
import { BACKGROUNDS, DEFAULT_CHARACTER, type Character } from '@/lib/concepts/rpg'

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

function loadCharacter(): Character {
  try {
    const raw = localStorage.getItem(CHARACTER_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (parsed && typeof parsed.name === 'string' && typeof parsed.background === 'string') {
      return parsed as Character
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
  const [sheetOpen, setSheetOpen] = useState(false)
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => { setCharacter(loadCharacter()) }, [])
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
      }).then(r => r.json() as Promise<{ text?: string; roll?: TableTurn['roll']; error?: string }>)

      const first = await post({ log: withPlayer, action: text.trim() })
      if (first.error) {
        persist([...withPlayer, { who: 'gm', text: first.error }], regionId)
        return
      }
      const gmTurn: TableTurn = { who: 'gm', text: first.text ?? '', roll: first.roll }
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

  const bg = BACKGROUNDS.find(b => b.id === character.background) ?? BACKGROUNDS[0]

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
        <div className='space-y-2 border-b border-gray-800 bg-gray-950/50 px-3 py-2'>
          <input
            value={character.name}
            onChange={e => saveCharacter({ ...character, name: e.target.value.slice(0, 40) })}
            placeholder='Your name'
            className='w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500'
          />
          <div className='flex flex-wrap gap-1'>
            {BACKGROUNDS.map(b => (
              <button
                key={b.id}
                onClick={() => saveCharacter({ ...character, background: b.id })}
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
          <p className='text-[11px] leading-snug text-gray-500'>{bg.is}</p>
          {/* Said plainly, because a player who thought a background helped
              them roll would be choosing one for the wrong reason. */}
          <p className='text-[10px] leading-snug text-gray-600'>
            Your background is colour, not an advantage. The tags that carry weight are the
            {held.length > 0 ? ` ${held.length} concepts you have reached` : ' concepts you reach'} on
            the map.
          </p>
        </div>
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
          </div>
        ))}
        {busy && (
          <p className='flex items-center gap-1.5 text-[11px] text-gray-500'>
            <Loader2 size={11} className='animate-spin' /> the game master is thinking…
          </p>
        )}
        <div ref={endRef} />
      </div>

      <div className='flex items-end gap-1.5 border-t border-gray-800 px-3 py-2'>
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
