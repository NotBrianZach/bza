#!/usr/bin/env node
/**
 * Every Supabase client must name the schema it reads.
 *
 * The app's tables live in `bza_public`, not `public` (see
 * supabase/setup/57_move_public_to_bza_public.sql). A client that does not set
 * `db.schema` reads `public`, finds the tables gone, and returns an empty
 * result set with a 200 — no error, no log line, nothing to notice. "This user
 * has no books" and "this client points at the wrong schema" look identical
 * from the outside.
 *
 * So the invariant cannot be "we remembered at all 44 sites." It has to be
 * checked. This walks the source, finds every client construction, and fails
 * on any that neither uses DB_SCHEMA nor says why it doesn't.
 *
 * A client that only calls `.auth.*` or `.storage.*` never resolves a table
 * name and genuinely does not need the schema. Those are exempted explicitly,
 * by putting a `schema-exempt: <reason>` comment inside the construction call.
 * The exemption is deliberately in-band: you cannot take it without touching
 * the line, and the reason is read by whoever next changes the file.
 *
 * Run: node tests/supabase-schema.mjs        (from frontend/)
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const SEARCH_DIRS = ['app', 'lib', 'components']
const EXTRA_FILES = ['middleware.ts']
const CONSTRUCTORS = ['createClient', 'createServerClient', 'createBrowserClient']

// ---------------------------------------------------------------------------
// Collect source files
// ---------------------------------------------------------------------------

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) walk(p, out)
    else if (/\.(ts|tsx)$/.test(name)) out.push(p)
  }
  return out
}

const files = []
for (const d of SEARCH_DIRS) {
  try { walk(join(ROOT, d), files) } catch { /* dir may not exist */ }
}
for (const f of EXTRA_FILES) {
  try { statSync(join(ROOT, f)); files.push(join(ROOT, f)) } catch { /* optional */ }
}

// ---------------------------------------------------------------------------
// Find each construction and slice out its full argument list
// ---------------------------------------------------------------------------

/**
 * Returns the source text of the call starting at the `(` following `from`,
 * balanced across nested parens, braces, strings and template literals. A
 * naive regex cannot do this: every one of these calls contains an object
 * literal, and several contain arrow functions with their own parens.
 */
function sliceCall(src, openParen) {
  let depth = 0
  let i = openParen
  let quote = null
  for (; i < src.length; i++) {
    const c = src[i]
    const prev = src[i - 1]
    if (quote) {
      if (c === quote && prev !== '\\') quote = null
      continue
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue }
    if (c === '(' || c === '{' || c === '[') depth++
    else if (c === ')' || c === '}' || c === ']') {
      depth--
      if (depth === 0) return src.slice(openParen, i + 1)
    }
  }
  return src.slice(openParen) // unbalanced; caller will flag it
}

const sites = []
for (const file of files) {
  const src = readFileSync(file, 'utf8')
  for (const ctor of CONSTRUCTORS) {
    const re = new RegExp(`\\b${ctor}\\s*\\(`, 'g')
    let m
    while ((m = re.exec(src)) !== null) {
      // Skip the import statement and this test's own constructor list.
      const lineStart = src.lastIndexOf('\n', m.index) + 1
      const line = src.slice(lineStart, src.indexOf('\n', m.index))
      if (/^\s*import\b/.test(line)) continue

      const openParen = m.index + m[0].length - 1
      const body = sliceCall(src, openParen)
      sites.push({
        file: relative(ROOT, file),
        line: src.slice(0, m.index).split('\n').length,
        ctor,
        body,
      })
    }
  }
}

// ---------------------------------------------------------------------------
// Assert
// ---------------------------------------------------------------------------

const EXEMPT_RE = /schema-exempt:\s*(.+)/
const failures = []
const exempted = []
let ok = 0

for (const s of sites) {
  const hasSchema = /\bDB_SCHEMA\b/.test(s.body) || /\bdbSchema\b/.test(s.body)
  const exempt = s.body.match(EXEMPT_RE)
  if (hasSchema && exempt) {
    failures.push({ ...s, why: 'claims both a schema and an exemption — pick one' })
  } else if (hasSchema) {
    ok++
  } else if (exempt) {
    exempted.push({ ...s, reason: exempt[1].trim().replace(/\s*\*\/\s*$/, '') })
  } else {
    failures.push({
      ...s,
      why: 'no db.schema and no exemption — this client reads `public`, which is empty',
    })
  }
}

// A literal 'bza_public' anywhere outside the one module that defines it is a
// second source of truth, and the next schema move would miss it.
const strays = []
for (const file of files) {
  if (/lib\/supabaseSchema\.ts$/.test(relative(ROOT, file))) continue
  const src = readFileSync(file, 'utf8')
  src.split('\n').forEach((line, i) => {
    if (/['"`]bza_public['"`]/.test(line)) {
      strays.push({ file: relative(ROOT, file), line: i + 1, text: line.trim() })
    }
  })
}

// ---------------------------------------------------------------------------
// Raw PostgREST calls, which the client setting does not reach
// ---------------------------------------------------------------------------

/**
 * `db.schema` is a supabase-js setting and only shapes requests supabase-js
 * builds. A hand-rolled `fetch(`${url}/rest/v1/books`)` resolves against the
 * server default instead, so it needs an explicit profile header. These sites
 * are easy to miss precisely because they appear in no client inventory —
 * score-book and newsletter/inbound construct no client at all.
 *
 * Checked per enclosing fetch call rather than per line: the URL and the
 * headers are usually several lines apart, and in admin/stats one shared
 * `headers` const serves three fetches.
 */
const rawCalls = []
for (const file of files) {
  const src = readFileSync(file, 'utf8')
  const rel = relative(ROOT, file)
  const re = /\/rest\/v1\//g
  let m
  while ((m = re.exec(src)) !== null) {
    const line = src.slice(0, m.index).split('\n').length
    // Walk back to the opening `fetch(` and slice the whole call.
    const fetchIdx = src.lastIndexOf('fetch(', m.index)
    let body = null
    if (fetchIdx !== -1) {
      const call = sliceCall(src, fetchIdx + 'fetch'.length)
      if (call && call.length > m.index - fetchIdx) body = call
    }
    // Two shapes, and they need different scopes. An inline object literal
    // (`headers: { ... }`) must carry the header itself. A reference to a
    // const defined elsewhere (`{ headers }`, as admin/stats does for three
    // fetches at once) has to be resolved where that const is declared, so
    // fall back to the file. Checking the file in the inline case would let a
    // guarded call three functions away vouch for an unguarded one.
    const inlineHeaders = body && /headers\s*:\s*\{/.test(body)
    const scope = inlineHeaders ? body : src
    const guarded = /schemaHeaders/.test(scope)
      || /['"]?(Accept|Content)-Profile['"]?\s*:/.test(scope)
    rawCalls.push({ file: rel, line, guarded, inherited: !inlineHeaders })
  }
}
const rawBad = rawCalls.filter(r => !r.guarded)

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

console.log(`\nsupabase schema guard — ${sites.length} client construction(s) found\n`)

if (exempted.length) {
  console.log(`  exempt (${exempted.length}):`)
  for (const e of exempted) console.log(`    · ${e.file}:${e.line} — ${e.reason}`)
  console.log()
}

console.log(`  ✓ ${ok} construction(s) set the schema via DB_SCHEMA`)
console.log(`  ✓ ${rawCalls.length - rawBad.length}/${rawCalls.length} raw /rest/v1/ call(s) send a profile header`)

if (rawBad.length) {
  console.log(`\n  ✗ ${rawBad.length} raw PostgREST call(s) with no profile header:`)
  for (const r of rawBad) console.log(`    · ${r.file}:${r.line} — resolves against the server default schema, not ${'bza_public'}`)
}

if (strays.length) {
  console.log(`\n  ✗ ${strays.length} hardcoded 'bza_public' literal(s) outside lib/supabaseSchema.ts:`)
  for (const s of strays) console.log(`    · ${s.file}:${s.line}  ${s.text}`)
}

if (failures.length) {
  console.log(`\n  ✗ ${failures.length} construction(s) would silently read an empty schema:`)
  for (const f of failures) console.log(`    · ${f.file}:${f.line} (${f.ctor}) — ${f.why}`)
}

const bad = failures.length + strays.length + rawBad.length
if (bad === 0 && sites.length > 0) {
  console.log(`\n${ok} guarded, ${exempted.length} exempt, 0 failed\n`)
  process.exit(0)
}
if (sites.length === 0) {
  console.log('\n✗ found no client constructions at all — the walker is broken, not the code\n')
  process.exit(1)
}
console.log(`\n${ok} guarded, ${exempted.length} exempt, ${bad} failed\n`)
process.exit(1)
