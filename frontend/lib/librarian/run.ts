import { createClient } from '@supabase/supabase-js'
import { serverData } from '@/lib/supabaseSchema'
import { EMBEDDING_MODEL, embed, toVectorLiteral } from './embeddings'

/**
 * Running one librarian task.
 *
 * The task is a prompt the user wrote. This module is what gives that prompt
 * hands: a bounded tool loop with exactly two tools — look something up on the
 * web, and find books in my library that relate to a description.
 *
 * ── WHY TOOLS AND NOT A PIPELINE ──────────────────────────────────────────
 *
 * The worked example was "a different integer sequence each day, say something
 * interesting, and every other time tie it to my library". A pipeline that
 * fetched OEIS and then searched the library would support exactly that task
 * and nothing else — the next user wants a word, a painting, a chess opening.
 * Two general tools support all of those, and the platform never has to learn
 * what an integer sequence is.
 *
 * ── THE LOOP IS BOUNDED, AND THE BOUND IS THE POINT ───────────────────────
 *
 * `MAX_STEPS` is small on purpose. This runs unattended on a timer with no
 * human to notice a model that has decided to read the whole internet, and the
 * cost of an unbounded agent loop is discovered on a bill rather than in a
 * log. Four steps is enough for fetch-then-search-then-write, which is the
 * deepest the example needs.
 */
const MAX_STEPS = 4
const MODEL = process.env.LIBRARIAN_MODEL || 'anthropic/claude-haiku-4-5'
const FETCH_BUDGET = 60_000

export interface TaskRow {
  id: string
  user_id: string
  name: string
  instructions: string
  capabilities: string[]
}

export interface RunResult {
  status: 'ok' | 'failed'
  output?: string
  citedBookIds: number[]
  error?: string
}

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { ...serverData, auth: { persistSession: false, autoRefreshToken: false } },
  )
}

/**
 * The library tool: a description in, the user's own books out.
 *
 * Embeds the description with the same model the library was embedded with —
 * not a choice, a requirement, since `match_books` compares within one model
 * and a mismatch returns nothing rather than erroring.
 *
 * `match_user_id` is passed explicitly because this runs under the
 * service-role client, where RLS is off. That is the whole subject of
 * migration 81 and the one line in this file that must never be "simplified".
 */
async function searchLibrary(userId: string, description: string, limit: number) {
  const [vector] = await embed([description])
  const { data, error } = await db().rpc('match_books', {
    match_user_id: userId,
    query_embedding: toVectorLiteral(vector),
    match_model: EMBEDDING_MODEL,
    match_count: Math.min(Math.max(limit || 5, 1), 20),
  })
  if (error) throw new Error(`library search failed: ${error.message}`)
  return (data ?? []) as { book_id: number; title: string; similarity: number; frecency: number; score: number }[]
}

/**
 * The web tool, deliberately thin.
 *
 * Text only, size-capped, and it returns the body rather than interpreting it
 * — the model is better at reading an API response than any parser this could
 * contain, and a parser here would be a third thing to keep in step with
 * whatever the user's task happens to call.
 *
 * No credentials are ever attached. A task runs unattended on the user's
 * behalf and must not be able to reach anything that trusts this server.
 */
async function fetchUrl(url: string): Promise<string> {
  let parsed: URL
  try { parsed = new URL(url) } catch { throw new Error(`not a url: ${url}`) }
  if (parsed.protocol !== 'https:') throw new Error('only https urls can be fetched')
  const res = await fetch(parsed.toString(), {
    headers: { 'User-Agent': 'bza-librarian/1.0 (+https://aireadalong.com)', Accept: '*/*' },
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  })
  const body = await res.text()
  return `HTTP ${res.status}\n\n${body.slice(0, FETCH_BUDGET)}`
}

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'fetch_url',
      description: 'Fetch an https URL and return its body as text. Use for public APIs and pages.',
      parameters: {
        type: 'object',
        properties: { url: { type: 'string', description: 'The https URL to fetch.' } },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_library',
      description:
        "Find books in the reader's own library related to a description. Ranked by meaning and "
        + 'by how recently and often they have been read. Returns book_id, title and scores.',
      parameters: {
        type: 'object',
        properties: {
          description: { type: 'string', description: 'What to find books about.' },
          limit: { type: 'number', description: 'How many books, 1-20. Default 5.' },
        },
        required: ['description'],
      },
    },
  },
]

const SYSTEM = `You are a reader's librarian, running a task they scheduled.

Write the finished piece as markdown. No preamble, no "here is", no mention of
being an assistant or of the tools you used — the reader sees only your output,
in a feed of previous days.

Keep it short: a few paragraphs at most. You are a daily note, not an essay.

If the task asks you to connect something to their library, use search_library
and name the book. Only cite a book the tool actually returned, and if nothing
returned is a genuine fit, say so plainly rather than forcing a connection —
a strained link is worse than none, and the reader can tell.

When you are done, give your final answer as markdown text with no tool call.`

interface ToolCall { id: string; function: { name: string; arguments: string } }

/**
 * Run one task to completion or to the step bound.
 *
 * Tool FAILURES are fed back to the model rather than thrown, because a dead
 * URL is information the model can act on — it can try another, or say the
 * source was unavailable. Throwing would turn a recoverable step into a failed
 * run and leave the reader with nothing.
 */
export async function runTask(task: TaskRow): Promise<RunResult> {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) return { status: 'failed', citedBookIds: [], error: 'No model configured (OPENROUTER_API_KEY is unset)' }
  const useOpenRouter = !!process.env.OPENROUTER_API_KEY
  const url = useOpenRouter
    ? 'https://openrouter.ai/api/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions'
  const model = useOpenRouter ? MODEL : 'gpt-4o-mini'

  const allowed = new Set(task.capabilities ?? [])
  const tools = TOOLS.filter(t =>
    (t.function.name === 'fetch_url' && allowed.has('web'))
    || (t.function.name === 'search_library' && (allowed.has('library') || allowed.has('similarity'))))

  const messages: any[] = [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: task.instructions },
  ]
  const cited = new Set<number>()

  for (let step = 0; step < MAX_STEPS; step++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        ...(tools.length ? { tools } : {}),
        max_tokens: 1200,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(90_000),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return { status: 'failed', citedBookIds: [...cited], error: `model returned ${res.status} ${body.slice(0, 200)}` }
    }
    const data = await res.json() as any
    const msg = data.choices?.[0]?.message
    if (!msg) return { status: 'failed', citedBookIds: [...cited], error: 'model returned no message' }
    messages.push(msg)

    const calls: ToolCall[] = msg.tool_calls ?? []
    if (calls.length === 0) {
      const text = (msg.content ?? '').trim()
      if (!text) return { status: 'failed', citedBookIds: [...cited], error: 'model returned an empty answer' }
      return { status: 'ok', output: text, citedBookIds: [...cited] }
    }

    for (const call of calls) {
      let result: string
      try {
        const args = JSON.parse(call.function.arguments || '{}')
        if (call.function.name === 'fetch_url') {
          result = await fetchUrl(String(args.url))
        } else if (call.function.name === 'search_library') {
          const hits = await searchLibrary(task.user_id, String(args.description), Number(args.limit))
          // Recorded as cited the moment they are SHOWN to the model, not
          // parsed back out of the prose. Parsing the output for titles would
          // miss a paraphrase and invent a citation from a coincidence.
          for (const h of hits) cited.add(h.book_id)
          result = JSON.stringify(hits)
        } else {
          result = `unknown tool ${call.function.name}`
        }
      } catch (e) {
        result = `tool failed: ${e instanceof Error ? e.message : 'unknown'}`
      }
      messages.push({ role: 'tool', tool_call_id: call.id, content: result })
    }
  }

  return {
    status: 'failed',
    citedBookIds: [...cited],
    error: `gave up after ${MAX_STEPS} steps without a final answer`,
  }
}
