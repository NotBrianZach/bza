#!/usr/bin/env node
/**
 * Edge functions: recover deployed sources, and detect drift against the repo.
 *
 * ── WHY THIS EXISTS ───────────────────────────────────────────────────────
 *
 * There is no deploy path for Supabase edge functions in this project. The
 * supabase CLI is not on PATH, so both deploy entry points skip their
 * edge-function block entirely — deploy_bza_web.sh says so out loud
 * ("supabase CLI not found — skipping edge function deploy") and carries on.
 *
 * The consequence was not drift, it was absence: 25 functions were deployed and
 * ACTIVE while `supabase/functions/` held nothing at all. Among them
 * stripe-webhook, stripe-checkout, sync-subscription and buy-storage — the
 * billing path, running in production, with no source under version control.
 * Nobody could review it, diff it, or restore it.
 *
 * Deployed function bodies are retrievable: the management API returns an eszip
 * whose sourcemaps carry the original TypeScript in `sourcesContent`. So the
 * situation is recoverable, and this script is what recovers it — and then keeps
 * the two honest about each other.
 *
 * ── WHAT IT DOES NOT DO ───────────────────────────────────────────────────
 *
 * It does not deploy. Writing a deploy path means choosing how the project ships
 * functions (management API vs a CLI in the nix closure) and that is a decision,
 * not a script. Until one exists, `check` is what stops the repo and production
 * from quietly disagreeing again.
 *
 * ── USAGE ─────────────────────────────────────────────────────────────────
 *
 *   node scripts/edge-functions.mjs check     # diff repo vs deployed; exits 1 on drift
 *   node scripts/edge-functions.mjs pull      # write deployed sources into the repo
 *   node scripts/edge-functions.mjs pull <slug>
 *
 * Needs SUPABASE_ACCESS_TOKEN (system_config holds it) and SUPABASE_URL, or pass
 * --ref <project-ref>.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const FUNCTIONS_DIR = join(ROOT, 'supabase', 'functions')
const API = 'https://api.supabase.com/v1'

function die(msg) { console.error(`✗ ${msg}`); process.exit(2) }

const argv = process.argv.slice(2)
const cmd = argv.find(a => !a.startsWith('-')) ?? 'check'
const refFlag = argv.indexOf('--ref')
const slugArg = argv.filter(a => !a.startsWith('-'))[1]

const token = process.env.SUPABASE_ACCESS_TOKEN
if (!token) die('SUPABASE_ACCESS_TOKEN is unset (templedb env secret get system_config SUPABASE_ACCESS_TOKEN)')

const ref = refFlag >= 0
  ? argv[refFlag + 1]
  : (process.env.SUPABASE_URL ?? '').replace(/^https:\/\//, '').split('.')[0]
if (!ref) die('no project ref — set SUPABASE_URL or pass --ref')

const auth = { Authorization: `Bearer ${token}` }

async function listDeployed() {
  const res = await fetch(`${API}/projects/${ref}/functions`, { headers: auth })
  if (!res.ok) die(`listing functions: HTTP ${res.status}`)
  return (await res.json()).map(f => ({ slug: f.slug, status: f.status }))
}

/**
 * Pull the original sources out of a deployed eszip.
 *
 * The body is an ESZIP2 archive, not text, but each module's sourcemap is
 * embedded as JSON and carries both `sources` (paths) and `sourcesContent` (the
 * original TypeScript). Rather than implement the container format, scan for
 * sourcemap objects and pair the two arrays — which is enough to reconstruct the
 * files a human wrote, and nothing else here needs the compiled output.
 *
 * Returns a Map of relative path → source text. Dependencies fetched from
 * deno.land or esm.sh appear in some sourcemaps too; those are filtered out,
 * since a remote module is not this repo's source.
 */
async function pullSources(slug) {
  const res = await fetch(`${API}/projects/${ref}/functions/${slug}/body`, { headers: auth })
  if (!res.ok) return { error: `HTTP ${res.status}` }
  const text = Buffer.from(await res.arrayBuffer()).toString('utf8')

  const out = new Map()
  // Walk every `"sourcesContent":[` and read the JSON array that follows,
  // honouring string escaping. Brace-matching the whole sourcemap would be
  // cleaner but the archive interleaves binary that breaks a naive scan.
  let i = 0
  while ((i = text.indexOf('"sourcesContent":[', i)) !== -1) {
    const srcIdx = text.lastIndexOf('"sources":[', i)
    const names = srcIdx !== -1 && i - srcIdx < 4000
      ? readJsonStringArray(text, srcIdx + '"sources":['.length)
      : null
    const contents = readJsonStringArray(text, i + '"sourcesContent":['.length)
    i += '"sourcesContent":['.length
    if (!contents) continue
    contents.forEach((body, n) => {
      const name = names?.[n]
      // No name, no placement. An earlier version defaulted to
      // `${slug}/index.ts` here, which was actively destructive: several
      // sourcemaps in these archives carry bundled dependency sources with no
      // `sources` entry at all, so seven unnamed files all claimed to be the
      // function's index.ts and the last one won. create-document-job and
      // get-document-job were written with a 307-line dependency in place of
      // their real 200- and 117-line handlers. If the archive does not say what
      // a file is, this cannot know either.
      if (!name) return
      if (/^https?:/.test(name)) return            // remote dependency, not ours
      if (body == null || body.length === 0) return
      out.set(name, body)
    })
  }
  return { sources: out }
}

/** Read a JSON array of strings starting at `pos` (just past the '['). */
function readJsonStringArray(text, pos) {
  const items = []
  let p = pos
  for (;;) {
    while (p < text.length && (text[p] === ' ' || text[p] === ',' || text[p] === '\n')) p++
    if (text[p] === ']') return items
    if (text[p] !== '"') return items.length ? items : null
    p++
    let s = '', esc = false
    for (; p < text.length; p++) {
      const c = text[p]
      if (esc) {
        s += c === 'n' ? '\n' : c === 't' ? '\t' : c === 'r' ? '\r'
          : c === 'b' ? '\b' : c === 'f' ? '\f'
          : c === 'u' ? String.fromCharCode(parseInt(text.slice(p + 1, p + 5), 16)) : c
        if (c === 'u') p += 4
        esc = false
        continue
      }
      if (c === '\\') { esc = true; continue }
      if (c === '"') break
      s += c
    }
    p++
    items.push(s)
    if (items.length > 500) return items
  }
}

/**
 * Repo path for a sourcemap-reported name, or null if the source is not ours.
 *
 * Two shapes show up, because the bundler records whatever root it was invoked
 * with: some functions report `<slug>/index.ts` (relative to supabase/functions)
 * and others `functions/<slug>/index.ts` (relative to supabase/). Normalising
 * the second avoids writing supabase/functions/cyoa/functions/cyoa/index.ts.
 *
 * Everything else is a bundled dependency rather than project source. The eszip
 * carries the TypeScript of whatever it compiled, which includes
 * @supabase/supabase-js pulled from esm.sh — hence paths like
 * `src/SupabaseClient.ts` and `src/packages/VectorIndexApi.ts`. Writing those
 * into supabase/functions/ would vendor a library into the wrong directory and
 * then report drift on it forever. Only the function's own slug directory and
 * the `_shared/` sibling it may import are this repo's.
 */
function repoPathFor(slug, name) {
  let clean = name.replace(/^\.\//, '')
  // A third prefix, from functions deployed through the management API rather
  // than the CLI: its multipart upload lands under source/, so sourcemaps read
  // `source/<slug>/index.ts`. generate-picturebook has this shape as of
  // 2026-10-15. Strip it before the functions/ case, since both can appear.
  if (clean.startsWith('source/')) clean = clean.slice('source/'.length)
  if (clean.startsWith('functions/')) clean = clean.slice('functions/'.length)
  const first = clean.split('/')[0]
  if (first !== slug && first !== '_shared') return null
  return join(FUNCTIONS_DIR, clean)
}

/**
 * Compare ignoring comment-only and blank lines.
 *
 * A recovered file is not byte-identical to the deployed one the moment anyone
 * adds a provenance header or a note — build-knowledge-graph has exactly that.
 * Treating a comment as drift would make this report noise on day one and train
 * everyone to ignore it, so the comparison is over code. A changed comment is
 * invisible here; a changed statement is not, which is the trade worth making.
 */
function normalize(src) {
  return src
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('//') && !l.startsWith('*') && !l.startsWith('/*'))
    .join('\n')
}

const deployed = await listDeployed()
const slugs = slugArg ? deployed.filter(d => d.slug === slugArg) : deployed
if (slugArg && slugs.length === 0) die(`no deployed function named ${slugArg}`)

let drift = 0, missing = 0, matched = 0, pulled = 0, failed = 0, skipped = 0, conflicts = 0, preserved = 0
const written = new Map()

for (const { slug, status } of slugs) {
  const { sources, error } = await pullSources(slug)
  if (error) { console.log(`?  ${slug.padEnd(26)} could not fetch body (${error})`); failed++; continue }
  if (!sources || sources.size === 0) {
    console.log(`?  ${slug.padEnd(26)} no sources in body (minified without a sourcemap?)`)
    failed++
    continue
  }

  for (const [name, body] of sources) {
    const path = repoPathFor(slug, name)
    if (!path) { skipped++; continue }   // bundled dependency, not project source
    const rel = path.slice(ROOT.length + 1)

    if (cmd === 'pull') {
      // Conflict rather than last-write-wins.
      //
      // `_shared/*` is a sibling directory several functions import, and each
      // deployed bundle embeds whatever version of it existed when THAT function
      // was last deployed. So production genuinely runs divergent copies:
      // _shared/auth.ts is 41 lines inside generate-picturebook and 51 inside
      // cyoa, detect-concepts and library-ontology. One repo file cannot be both,
      // and silently keeping whichever came last would manufacture a false
      // answer about what is deployed. Report it and leave the first in place.
      // PULL FILLS GAPS AND NEVER OVERWRITES. Both halves of that were learned
      // the hard way in one sitting.
      //
      // It overwrote build-knowledge-graph/index.ts, discarding a header that
      // explained where the file had come from, because the code matched and the
      // writer did not look. Then, with a preserve-if-identical check added, it
      // still downgraded _shared/auth.ts: generate-picturebook is iterated first
      // and embeds a version WITHOUT the blacklist check, so a file deliberately
      // set to the 50-line version with the check was replaced by the 40-line one
      // — silently reversing a security decision.
      //
      // So an existing file is never written. It either matches (nothing to do)
      // or it is a conflict for a human to settle. The only write is a file that
      // does not exist yet, which is the gap this command exists to fill.
      const prior = written.get(rel)
      if (existsSync(path)) {
        const local = readFileSync(path, 'utf8')
        if (normalize(local) === normalize(body)) { preserved++; written.set(rel, { body, slug }); continue }
        console.log(`✗  ${rel.padEnd(60)} differs from ${slug}'s copy — left alone, settle by hand`)
        conflicts++
        continue
      }
      if (prior !== undefined && normalize(prior.body) !== normalize(body)) {
        // Two functions supplied different versions of a file the repo lacks.
        // Keep the first and name both, rather than letting iteration order
        // decide what production "is".
        console.log(`✗  ${rel.padEnd(60)} CONFLICT: ${prior.slug} and ${slug} embed different versions`)
        conflicts++
        continue
      }
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(path, body.endsWith('\n') ? body : body + '\n')
      console.log(`→  ${rel}`)
      pulled++
      written.set(rel, { body, slug })
      continue
    }

    if (!existsSync(path)) { console.log(`!  ${rel.padEnd(60)} deployed, not in repo`); missing++; continue }
    const local = readFileSync(path, 'utf8')
    if (normalize(local) === normalize(body)) { matched++ }
    else {
      console.log(`✗  ${rel.padEnd(60)} differs from deployed (${status})`)
      drift++
    }
  }
}

console.log('')
if (cmd === 'pull') {
  console.log(
    `pulled ${pulled} file(s) from ${slugs.length} function(s); ` +
    `${conflicts} conflict(s), ${preserved} unchanged (local comments kept), ${failed} unreadable, ${skipped} bundled dep file(s) ignored`
  )
  if (conflicts) {
    console.log('')
    console.log('A conflict means two deployed functions embed different versions of the')
    console.log('same shared file, because they were last deployed at different times. The')
    console.log('repo keeps the first one seen; decide which is current and deploy the other')
    console.log('function so production stops disagreeing with itself.')
  }
  console.log('Review the diff before committing — these are production sources, not a backup.')
  process.exit(failed ? 1 : 0)
}

console.log(
  `${matched} match, ${drift} differ, ${missing} missing from repo, ` +
  `${failed} unreadable, ${skipped} bundled dep file(s) ignored`
)
if (drift || missing) {
  console.log('')
  console.log('There is no deploy path for edge functions (no supabase CLI on PATH), so')
  console.log('"missing" means production is running code this repo does not contain.')
  console.log('Recover it with:  node scripts/edge-functions.mjs pull')
}
process.exit(drift || missing || failed ? 1 : 0)
