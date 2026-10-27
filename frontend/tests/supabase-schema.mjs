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
      // Skip constructions inside comments. lib/supabaseSchema.ts documents
      // itself with a usage example, and that example was being counted as a
      // real client — it passed the schema check only because the example
      // mentions dbSchema, and it failed the cache check outright. A doc
      // example is not a call site.
      if (/^\s*(\*|\/\/)/.test(line)) continue

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
  // `serverData` is dbSchema + noStoreFetch, so it satisfies this too.
  const hasSchema = /\bDB_SCHEMA\b/.test(s.body)
    || /\bdbSchema\b/.test(s.body)
    || /\bserverData\b/.test(s.body)
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

// ---------------------------------------------------------------------------
// Second invariant: a server-side client must not let Next cache its reads
// ---------------------------------------------------------------------------

/**
 * supabase-js issues its queries through the GLOBAL `fetch`, and Next
 * instruments that fetch with its own data cache. So two identical PostgREST
 * GETs can be served from a response captured earlier — including one captured
 * before a write that has since landed.
 *
 * This is checked here, next to the schema check, because it is the SAME class
 * of bug and it is invisible in exactly the same way: there is no error at any
 * layer. PostgREST answers 200, supabase-js returns `{data: null, error: null}`,
 * and `maybeSingle()` on an empty set is legitimately null. A stale read and an
 * empty table are indistinguishable from the outside.
 *
 * Found in production code on 2026-10-21: `/api/suggest/metrics` reported "no
 * digest has been generated yet" while psql showed the digest in the table,
 * because an earlier call had cached the empty result against that URL.
 *
 * `createBrowserClient` is exempt by construction — there is no Next fetch
 * cache in a browser. Everything else must spread `serverData` (or
 * `noStoreFetch`), or say in-band why it is choosing to be cacheable.
 *
 * NOTE for whoever adds `export const dynamic = 'force-dynamic'` and expects
 * that to cover it: it does not. That governs the route's own render, not the
 * fetches made inside it.
 */
const CACHE_EXEMPT_RE = /cache-exempt:\s*(.+)/
const cacheFailures = []
const cacheExempted = []
let cacheOk = 0

for (const s of sites) {
  if (s.ctor === 'createBrowserClient') continue
  const guarded = /\bserverData\b/.test(s.body) || /\bnoStoreFetch\b/.test(s.body)
    || /cache:\s*['"]no-store['"]/.test(s.body)
  const exempt = s.body.match(CACHE_EXEMPT_RE)
  if (guarded && exempt) {
    cacheFailures.push({ ...s, why: 'claims both no-store and a cache exemption — pick one' })
  } else if (guarded) {
    cacheOk++
  } else if (exempt) {
    cacheExempted.push({ ...s, reason: exempt[1].trim().replace(/\s*\*\/\s*$/, '') })
  } else {
    cacheFailures.push({
      ...s,
      why: 'server-side client with no no-store fetch — Next may serve its reads from a stale cache, with no error',
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
// Every literal written to a CHECK-constrained column must be legal
// ---------------------------------------------------------------------------

/**
 * THREE BUGS IN ONE DAY SHARED THIS SIGNATURE.
 *
 * A hard-coded string assigned to a column carrying a CHECK constraint, where
 * the string is not in the constraint's list. Postgres rejects the insert, the
 * route returns a 500, and the feature "looks like it does nothing":
 *
 *   /api/extension/import      wrote `article_type: 'non-fiction'`
 *   /api/create-translated-book wrote `content_type: 'translation'` — so that
 *                              route could never insert a row at all, and the
 *                              table holds zero translated books
 *
 * Both survived for months because nothing READS those columns carefully
 * enough to notice, and because the failure is at the database rather than in
 * the type system: `content_type` is `string` to TypeScript, so every illegal
 * value typechecks perfectly.
 *
 * The constraint is the authority, so it is parsed out of the baseline SQL
 * rather than restated here. Restating it would be a fourth copy of the list
 * and the copies are the problem.
 *
 * Only literals are checked. `content_type: contentType` is a variable and
 * this cannot see its value — that is what ALLOWED_CONTENT_TYPES does at
 * runtime in the extension route. The two guards are complementary: this one
 * catches what is written in the source, that one catches what arrives at
 * runtime.
 *
 * COMMENTS ARE STRIPPED FIRST, and that is not a nicety. The guard's first run
 * failed on `content_type: 'translation'` inside the doc comment that explains
 * the bug it was written to catch — so describing a past mistake would have
 * been enough to break the build, and the only way to keep it green would have
 * been to delete the explanation. A guard that punishes documentation gets the
 * documentation deleted.
 */

/**
 * Block comments, and line comments that begin a line.
 *
 * A trailing `// …` after code is left alone deliberately: stripping it would
 * mean deciding whether a `//` sits inside a string literal, and a URL in
 * quotes is common enough that getting it wrong would hide real assignments.
 * The realistic false positive is prose — a doc comment or a commented-out
 * block — and both start their line.
 */
const stripComments = (src) =>
  src
    // Replaced by their own newlines rather than by nothing, so every
    // reported line number still points at the real file.
    .replace(/\/\*[\s\S]*?\*\//g, c => c.replace(/[^\n]/g, ''))
    .replace(/^[ \t]*\/\/.*$/gm, '')
const BASELINE = join(ROOT, '..', 'supabase', 'setup', '00_baseline_bza_public.sql')

/**
 * Every enum-shaped CHECK in the schema, as table → column → legal values.
 *
 * The first version of this guard parsed one constraint by name
 * (`books_content_type_check`) because one constraint was where the bugs were.
 * There are twenty of them. `document_jobs.status` alone has eight legal values
 * including `enqueued`, `converted` and `retrying`, which is exactly the shape
 * that invites a route to write `complete` or `error` and 500 forever.
 *
 * Parsed from the CREATE TABLE block rather than from the constraint's NAME,
 * because the names are not a reliable index: `no_self_relationship` and
 * `concept_observations_review_scored_is_settled` carry neither their table nor
 * their column, and deriving a column from `<table>_<column>_check` would be a
 * guess that silently drops constraints when it is wrong. The enclosing block
 * gives the table and the `=  ANY (ARRAY[…])` gives the column for free.
 *
 * Range and cross-column CHECKs (`strength >= 1`, `character_a_id <> b`,
 * `end_page >= start_page`) are not enum-shaped and are skipped. They cannot be
 * violated by a hard-coded string, which is the only thing this guard reads.
 */
const CONSTRAINTS = (() => {
  const sql = readFileSync(BASELINE, 'utf8')
  const byTable = new Map()
  const tableRe = /CREATE TABLE (?:[\w]+\.)?(\w+) \(([\s\S]*?)\n\);/g
  let t
  while ((t = tableRe.exec(sql)) !== null) {
    const [, table, block] = t
    const checkRe = /CHECK\s*\(\(\s*(\w+)\s*=\s*ANY\s*\(ARRAY\[([^\]]*)\]/g
    let c
    while ((c = checkRe.exec(block)) !== null) {
      const values = new Set([...c[2].matchAll(/'([^']*)'::text/g)].map(x => x[1]))
      if (values.size === 0) continue
      if (!byTable.has(table)) byTable.set(table, new Map())
      byTable.get(table).set(c[1], values)
    }
  }
  return byTable
})()

/**
 * Columns the app also uses as ordinary object keys, everywhere.
 *
 * `status`, `type`, `role` and `theme` are real constrained columns AND the most
 * common keys in the codebase: React state (`status: 'idle'`), Anthropic
 * messages (`role: 'tool'`), the reader's own theme setting, ARIA. Scanning a
 * whole file for them would report hundreds of literals that never go near
 * Postgres, and a guard that cries wolf gets deleted or `--force`d past.
 *
 * They are not dropped — they move to the table-scoped pass below, which only
 * reads literals inside a write chained off `.from('<that table>')`. Narrower
 * reach, no false positives, and it is the only way to tell `document_jobs`'
 * `status` from `invoices`' when the two lists disagree.
 */
const AMBIGUOUS_KEYS = new Set(['status', 'type', 'role', 'theme', 'name', 'value', 'id'])

/**
 * A legacy column checked against the constraint it shadows.
 *
 * `books.article_type` carries no CHECK of its own — it is read in exactly one
 * place as `content_type ?? article_type`, so the only values that make sense in
 * it are content_type's. 101 of 358 rows had drifted off that list, 37 of them
 * to `'article'`, which content_type does not accept. Nothing enforces this at
 * the database, so it is enforced here or nowhere.
 */
const MIRRORS = [{ table: 'books', column: 'article_type', mirrors: 'content_type' }]

/**
 * `col: 'v'` or `col: "v"`.
 *
 * Both quote styles, even though eslint means the codebase is single-quoted
 * throughout and a search for a double-quoted constrained value finds nothing
 * today. The first draft matched `'` only, and the cost of that is not a missed
 * report — it is a SILENT pass: a double-quoted illegal value is invisible to
 * the guard while looking exactly like a checked one in the count. A guard whose
 * coverage depends on a lint rule staying switched on is not a guard.
 *
 * Template literals are not matched. `status: \`done\`` is interpolation-shaped
 * and this cannot evaluate it, which puts it in the same class as a variable.
 */
const literalAssignment = (col) => new RegExp(`\\b${col}\\s*:\\s*['"]([^'"]*)['"]`, 'g')

// column → the one legal value set, for columns a file-wide scan can resolve
// without knowing the table. A column qualifies only if every table declaring
// it agrees on the values; two tables disagreeing means the table matters, so
// it falls through to the scoped pass.
const unscoped = new Map()
{
  const seen = new Map()
  for (const [table, cols] of CONSTRAINTS) {
    for (const [col, values] of cols) {
      if (!seen.has(col)) seen.set(col, [])
      seen.get(col).push({ table, values })
    }
  }
  for (const [col, decls] of seen) {
    if (AMBIGUOUS_KEYS.has(col)) continue
    const first = [...decls[0].values].sort().join(',')
    const agree = decls.every(d => [...d.values].sort().join(',') === first)
    if (!agree) continue
    unscoped.set(col, {
      values: decls[0].values,
      source: decls.map(d => `${d.table}.${col}`).join(' / '),
    })
  }
  for (const m of MIRRORS) {
    const values = CONSTRAINTS.get(m.table)?.get(m.mirrors)
    if (values) unscoped.set(m.column, { values, source: `${m.table}.${m.mirrors} (mirrored)` })
  }
}

const literalFailures = []
let literalOk = 0

// The guard going blind must fail the build, not pass it quietly. Both halves
// are asserted: a parser that finds no constraints at all, and one that finds
// some but loses the constraint the known bugs were written against.
if (CONSTRAINTS.size === 0 || !unscoped.has('content_type')) {
  literalFailures.push({
    file: '00_baseline_bza_public.sql',
    value: '(none)',
    why: CONSTRAINTS.size === 0
      ? 'parsed zero CHECK constraints out of the baseline — the guard is blind, fix the parser'
      : 'parsed constraints but not books.content_type — the parser regressed, fix it',
  })
} else {
  for (const file of files) {
    // Newlines are preserved by the stripper, so reported line numbers still
    // point at the real file.
    const src = stripComments(readFileSync(file, 'utf8'))
    const lineOf = (i) => src.slice(0, i).split('\n').length
    const report = (col, value, index, why) => literalFailures.push({
      file: `${relative(ROOT, file)}:${lineOf(index)}`,
      value: `${col}: '${value}'`,
      why,
    })

    // ---- Pass 1: distinctive columns, anywhere in the file ----------------
    //
    // File-wide on purpose. Both original bugs built a plain object several
    // lines above the `.insert()` that wrote it — `/api/extension/import`
    // assembles `bookData` and passes it by name — so a guard that only read
    // the argument of a write call would have missed every one of them. The
    // price of that reach is that it can only be taken for a column name that
    // means a database column and nothing else.
    for (const [col, { values, source }] of unscoped) {
      const re = literalAssignment(col)
      let m
      while ((m = re.exec(src)) !== null) {
        if (values.has(m[1])) { literalOk++; continue }
        report(col, m[1], m.index, `not in ${source} (${[...values].join(', ')})`)
      }
    }

    // ---- Pass 2: ambiguous columns, scoped to their table ----------------
    //
    // Only literals inside an `.insert()` / `.update()` / `.upsert()` chained
    // off `.from('<table>')`, so `status` is read against the constraint on the
    // table actually being written. A write whose payload is a named variable
    // is invisible here — that is the trade for zero false positives on the
    // four keys the UI uses constantly, and it is why pass 1 exists.
    const fromRe = /\bfrom\(\s*['"](\w+)['"]\s*\)/g
    let f
    while ((f = fromRe.exec(src)) !== null) {
      const cols = CONSTRAINTS.get(f[1])
      if (!cols) continue
      const scoped = [...cols].filter(([col]) => AMBIGUOUS_KEYS.has(col))
      if (scoped.length === 0) continue
      // Bound the search at the next `from(` so a later chain in the same file
      // cannot be attributed to this table.
      const nextFrom = src.indexOf('from(', f.index + f[0].length)
      const limit = nextFrom === -1 ? src.length : nextFrom
      const writeRe = /\.(insert|update|upsert)\(/g
      writeRe.lastIndex = f.index + f[0].length
      const w = writeRe.exec(src)
      if (!w || w.index >= limit) continue
      // Offsets inside `payload` are relative to its start, so they are rebased
      // onto `src` before a line is computed from them. Adding `w.index` alone
      // reads the right line for a single-line write and drifts for a multiline
      // one, which is the shape most real writes have.
      const base = w.index + w[0].length - 1
      const payload = sliceCall(src, base)
      for (const [col, values] of scoped) {
        const re = literalAssignment(col)
        let m
        while ((m = re.exec(payload)) !== null) {
          if (values.has(m[1])) { literalOk++; continue }
          report(col, m[1], base + m.index,
            `not in ${f[1]}.${col} (${[...values].join(', ')})`)
        }
      }
    }
  }
}

const constraintCount = [...CONSTRAINTS.values()].reduce((n, c) => n + c.size, 0)

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
console.log(`  ✓ ${cacheOk} server-side construction(s) disable Next's fetch cache`)
console.log(`  ✓ ${rawCalls.length - rawBad.length}/${rawCalls.length} raw /rest/v1/ call(s) send a profile header`)

if (cacheExempted.length) {
  console.log(`\n  cache-exempt (${cacheExempted.length}):`)
  for (const e of cacheExempted) console.log(`    · ${e.file}:${e.line} — ${e.reason}`)
}

if (cacheFailures.length) {
  console.log(`\n  ✗ ${cacheFailures.length} server-side construction(s) whose reads Next may cache:`)
  for (const f of cacheFailures) console.log(`    · ${f.file}:${f.line} (${f.ctor}) — ${f.why}`)
}

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

if (literalFailures.length) {
  console.log(`\n  ✗ ${literalFailures.length} literal(s) the database would reject:`)
  for (const l of literalFailures) console.log(`    · ${l.file}  ${l.value} — ${l.why}`)
}

const bad = failures.length + strays.length + rawBad.length + cacheFailures.length
  + literalFailures.length
if (bad === 0 && sites.length > 0) {
  console.log(
    `\n${ok} schema-guarded, ${cacheOk} cache-guarded, ${literalOk} literal(s) checked ` +
    `against ${constraintCount} CHECK constraint(s) in ${CONSTRAINTS.size} table(s), ` +
    `${exempted.length + cacheExempted.length} exempt, 0 failed\n`,
  )
  process.exit(0)
}
if (sites.length === 0) {
  console.log('\n✗ found no client constructions at all — the walker is broken, not the code\n')
  process.exit(1)
}
console.log(`\n${ok} guarded, ${exempted.length} exempt, ${bad} failed\n`)
process.exit(1)
