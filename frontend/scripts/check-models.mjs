#!/usr/bin/env node
/**
 * Are the models we offer still callable?
 *
 * Seven ids had died without anyone noticing by 2026-11-19: a dead "Best
 * quality" button in Settings, a dead image model, and five of the six
 * uncensored translate options. Two of them were reachable by one click, and
 * one — the Romantic/Horror picturebook preset — selected a 404 model
 * automatically. Nothing in the build or the test suite could see any of it,
 * because a model id is a string until somebody calls it.
 *
 * This is NOT in `npm test`, deliberately. It needs the network and a key, it
 * costs a fraction of a cent, and a provider hiccup must never fail a build.
 * Run it when touching a model list, or periodically.
 *
 *   OPENROUTER_API_KEY=... node scripts/check-models.mjs
 *   OPENROUTER_API_KEY=... node scripts/check-models.mjs --quiet   # only failures
 *
 * Exits 1 if any id is unreachable, so it can gate a deploy if you want it to.
 *
 * ── Why it calls rather than reads the catalogue ──────────────────────────
 *
 * `GET /api/v1/models` is not the truth in either direction, which is the trap
 * this script exists to avoid repeating:
 *
 *   - it lists TEXT models only. Every image model we offer is absent from it
 *     and all but one work fine, so "absent" proves nothing.
 *   - it lists canonical ids while the API accepts aliases. We send
 *     `anthropic/claude-haiku-4-5`; the catalogue says `claude-haiku-4.5`.
 *     Checking membership would have condemned a model that works.
 *
 * A real request with a 1-token budget is the only answer that means anything.
 * A 404 is dead; anything else — including a provider-side 422 — means the id
 * resolves, which is all this is asking.
 */

import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const FRONTEND = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const QUIET = process.argv.includes('--quiet')

const KEY = process.env.OPENROUTER_API_KEY
if (!KEY) {
  console.error('OPENROUTER_API_KEY is not set. Try:')
  console.error('  OPENROUTER_API_KEY=$(templedb env var get bza OPENROUTER_API_KEY) node scripts/check-models.mjs')
  process.exit(2)
}

/**
 * Where the lists live, and the shape to pull ids out of each.
 *
 * Read out of the source rather than imported: one is a client component and
 * the other imports the Supabase client, so neither loads in a bare node
 * process. A regex over a literal is the cheap option that keeps this script
 * standalone — and it is self-checking, because finding zero ids in a file is
 * treated as an error below rather than as a pass.
 */
const SOURCES = [
  { file: join('components', 'settings', 'AiModelsSection.tsx'), what: 'Settings → AI Models' },
  { file: join('lib', 'supabase-queries.ts'), what: 'image / translate / tts lists' },
  { file: join('lib', 'usePicturebook.ts'), what: 'picturebook defaults' },
  { file: join('components', 'ProblemMapWidget.tsx'), what: 'problem map' },
]

/** Provider-qualified ids only: a slash is what routes a model to OpenRouter. */
const ID_RE = /'([a-z0-9][a-z0-9-]*\/[A-Za-z0-9._:-]+)'/g

/**
 * Things that look like a model id and are not one.
 *
 * A slash is a weak signal, which the first run of this script proved by
 * confidently reporting `image/jpeg` as a dead model. Two kinds of impostor:
 *
 *  - MIME types, which are the same shape. Matched by their top-level type,
 *    since the subtype is open-ended.
 *  - models that are real but are not OpenRouter's. `sd-turbo-onnx` is a
 *    HuggingFace ONNX model that runs in the browser on WebGPU, so asking
 *    OpenRouter about it is a category error and "dead" would be a lie.
 *
 * Kept as an explicit list rather than a cleverer regex: when something new
 * trips this, the right fix is usually to name it here with a reason, and a
 * list makes that the obvious move.
 */
const MIME_PREFIXES = ['application/', 'image/', 'text/', 'audio/', 'video/', 'multipart/', 'font/']
const NOT_OPENROUTER = new Set([
  'schirrmacher/sd-turbo-onnx',   // local, WebGPU — see lib/webgpuImageGen.ts
])
const isModelId = id =>
  !MIME_PREFIXES.some(p => id.startsWith(p)) && !NOT_OPENROUTER.has(id)

const found = new Map()   // id -> Set of places it appears
let readFailures = 0

for (const { file, what } of SOURCES) {
  let text
  try {
    text = readFileSync(join(FRONTEND, file), 'utf8')
  } catch {
    console.error(`! could not read ${file} — has it moved? Update SOURCES.`)
    readFailures++
    continue
  }
  const ids = [...text.matchAll(ID_RE)].map(m => m[1]).filter(isModelId)
  if (ids.length === 0) {
    // A file that stops yielding ids is far likelier to have been refactored
    // than to have genuinely emptied, and a silent zero here would turn this
    // whole script into a no-op that reports success.
    console.error(`! no model ids found in ${file} — the literal shape probably changed`)
    readFailures++
  }
  for (const id of ids) {
    if (!found.has(id)) found.set(id, new Set())
    found.get(id).add(what)
  }
}

const ids = [...found.keys()].sort()
if (!QUIET) console.log(`checking ${ids.length} model ids against OpenRouter\n`)

async function probe(id) {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      // One token: enough to resolve the model, not enough to generate anything
      // worth paying for. Image models reject the shape and that is fine — the
      // question is whether the id exists, not whether it would draw.
      body: JSON.stringify({ model: id, messages: [{ role: 'user', content: 'x' }], max_tokens: 1 }),
    })
    const body = await res.json().catch(() => ({}))
    const message = body?.error?.message ?? ''
    // Only "no longer available" / 404 means gone. A 422, a rate limit or a
    // content refusal all mean the id resolved to something real.
    const dead = res.status === 404 || /no longer available|no provider serves|not a valid model/i.test(message)
    return { dead, note: dead ? message.slice(0, 80) : '' }
  } catch (e) {
    return { dead: false, note: `unchecked: ${e.message}` }
  }
}

const dead = []
for (const id of ids) {
  const { dead: isDead, note } = await probe(id)
  const where = [...found.get(id)].join(', ')
  if (isDead) {
    dead.push({ id, where, note })
    console.log(`DEAD  ${id}  (${where})`)
    if (note) console.log(`      ${note}`)
  } else if (!QUIET) {
    console.log(`ok    ${id}`)
  }
}

console.log(`\n${ids.length - dead.length} of ${ids.length} reachable`)
if (readFailures > 0) {
  console.log(`${readFailures} source file(s) could not be read or yielded no ids — this run was incomplete`)
}
if (dead.length > 0) {
  console.log('\nRemove or replace these. An id that 404s is a button that errors:')
  dead.forEach(d => console.log(`  ${d.id}  — ${d.where}`))
}
process.exit(dead.length > 0 || readFailures > 0 ? 1 : 0)
