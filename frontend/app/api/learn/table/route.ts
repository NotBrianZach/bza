import { NextRequest, NextResponse } from 'next/server'
import { checkQuota, getUserFromToken, logUsage } from '@/lib/apiQuota'
import { regionBy } from '@/lib/concepts/armature'
import {
  parseRollExpression, splitRollRequest, tablePrompt, type TableTurn,
} from '@/lib/concepts/narrate'
import { fairDraw, rollFor, sheetFor, type Character, type Tag, type Tier } from '@/lib/concepts/rpg'

/**
 * One turn at the table: the player says what they do, the game master answers.
 *
 * POST { regionId, character, held[], log[], action?, resolved? }
 *   → 200 { text, roll?, source }
 *
 * ── THE SERVER ROLLS, NOT THE MODEL AND NOT THE BROWSER ───────────────────
 *
 * The game master returns a tag expression and stops; this route parses it and
 * rolls it with `fairDraw`. Both halves of that matter and for different
 * reasons.
 *
 * Not the model, because a game master that writes its own numbers is a game
 * master whose dice are prose — it will roll what the scene wants, every time,
 * and the tag system becomes decoration.
 *
 * Not the browser, because a roll the player owns is a roll the player can
 * retake. That is tolerable in a single-player game and still not what a table
 * is: the dice being outside your reach is the entire reason anybody trusts
 * them.
 *
 * ── IT STILL CANNOT MOVE ANYBODY ──────────────────────────────────────────
 *
 * Like /api/learn/narrate, this reads and writes no journey. The traversal in
 * `concept_traversals` is untouched: no sentence a player types and no number
 * these dice produce can open a prerequisite, reach a concept, or rule on an
 * answer. Dice settle what happens in the fiction. What you know is settled by
 * the verifier, on work, one tab away.
 *
 * `held` arrives from the client and is used only as FLAVOUR — the names on
 * the character sheet the model is shown. A caller could inflate it and the
 * only consequence is a game master that mentions tags they have not earned,
 * which changes nothing about the map, the roads, or what the practice engine
 * will give them. It is not a gate, so it does not need to be trusted like one.
 */

export const dynamic = 'force-dynamic'

const MODEL = process.env.NARRATE_MODEL || process.env.CORRELATE_MODEL || 'anthropic/claude-haiku-4-5'
const MAX_TOKENS = 500
/** Enough rope for a scene, not enough to paste a chapter into the context. */
const MAX_ACTION = 600

export async function POST(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const body = await req.json().catch(() => null) as Record<string, unknown> | null
  const region = regionBy(String(body?.regionId ?? ''))
  if (!region) return NextResponse.json({ error: 'no such region' }, { status: 400 })

  const action = String(body?.action ?? '').trim().slice(0, MAX_ACTION)
  const resolved = body?.resolved as TableTurn['roll'] | undefined
  if (!action && !resolved) {
    return NextResponse.json({ error: 'say what you do' }, { status: 400 })
  }

  const character = (body?.character ?? {}) as Character
  const held = Array.isArray(body?.held)
    ? (body.held as unknown[]).filter((h): h is string => typeof h === 'string')
    : []
  const log = Array.isArray(body?.log) ? (body.log as TableTurn[]) : []

  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({
      text: 'No game master is configured here (OPENROUTER_API_KEY is unset), so there is nobody '
        + 'to answer at the table. Travelling on the map still works.',
      source: 'unnarrated',
    })
  }

  const quota = await checkQuota(userId)
  if (quota) return NextResponse.json({ text: quota, source: 'unnarrated' })

  const prompt = tablePrompt({
    sheet: sheetFor(character, held, `${region.name} — ${region.epithet}`),
    region,
    log,
    action,
    resolved,
  })

  const useOpenRouter = !!process.env.OPENROUTER_API_KEY
  const url = useOpenRouter
    ? 'https://openrouter.ai/api/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions'
  const model = useOpenRouter ? MODEL : 'gpt-4o-mini'

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
        temperature: 0.85,
      }),
    })
    if (!res.ok) {
      return NextResponse.json({
        text: `The game master could not be reached (${res.status}). Nothing at the table has changed.`,
        source: 'unnarrated',
      })
    }

    const data = await res.json() as {
      choices?: { message?: { content?: string } }[]
      usage?: Record<string, number>
    }
    const content = data.choices?.[0]?.message?.content?.trim() ?? ''
    if (!content) {
      return NextResponse.json({
        text: 'The game master returned nothing. Nothing at the table has changed.',
        source: 'unnarrated',
      })
    }

    await logUsage(userId, 0.0008, { model, endpoint: 'learn-table' }, {
      input: data.usage?.prompt_tokens,
      output: data.usage?.completion_tokens,
    })

    const { text, expression } = splitRollRequest(content)

    /*
     * A roll the GM asked for, rolled here. A malformed expression is dropped
     * rather than guessed at: the scene still stands, and inventing a reading
     * of something that did not parse would be the one dishonest thing this
     * route could do with dice.
     */
    let roll: TableTurn['roll'] | undefined
    if (expression && !resolved) {
      const parsed = parseRollExpression(expression)
      if (parsed) {
        const tags: Tag[] = parsed.map(p => ({
          name: p.name, tier: (p.tier || '') as Tier, against: p.against,
        }))
        const result = rollFor(tags, fairDraw)
        roll = {
          expression,
          dice: result.dice,
          results: result.results,
          total: result.total,
          reading: result.reading,
        }
      }
    }

    return NextResponse.json({ text, roll, source: 'gm' })
  } catch {
    return NextResponse.json({
      text: 'The game master could not be reached. Nothing at the table has changed.',
      source: 'unnarrated',
    })
  }
}
