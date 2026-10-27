#!/usr/bin/env node
/**
 * Saving a translated book actually writes a row.
 *
 * `/api/create-translated-book` wrote `content_type: 'translation'`, which
 * `books_content_type_check` does not accept, so Postgres rejected every insert
 * and the route returned a 500. `useReading.saveTranslatedBook` swallows that
 * into a `console.error`, so the reader showed no error and simply never got a
 * saved book — the failure was invisible from the UI.
 *
 * Fixed in 70B4AE20 by inheriting the source book's `content_type`. That commit
 * says outright that it was NOT exercised end to end, and argued from the shape
 * of the code that it must now work. This is that missing exercise.
 *
 * ── WHY THE ASSERTION READS THE DATABASE ─────────────────────────────────
 *
 * A 200 with a bookId is not enough to prove this bug is gone, and the UI is
 * even weaker evidence. The whole class of bug — three of them in one day —
 * lives in a column nothing reads: an illegal value and a legal one are
 * indistinguishable everywhere except at the insert. So the test reads the row
 * back out of Postgres with the service role and asserts on the stored
 * `content_type` itself.
 *
 * The inheritance is the actual fix, so it is the actual assertion: a
 * translation of a `wikipedia_article` must BE a `wikipedia_article`. Asserting
 * only "some legal value landed" would pass if the route hard-coded 'essay' for
 * everything, which is the same mistake — a constant where a derivation
 * belongs — one constraint violation later.
 *
 * ── THIS TEST CREATES REAL ROWS AND DELETES THEM ─────────────────────────
 *
 * There is no staging database. It writes two books and one storage object per
 * book on the persistent e2e account, then removes both. Cleanup runs in a
 * `finally` so a failed assertion still tidies up, and every id it creates is
 * printed, so a crash between insert and delete leaves a trail rather than
 * mystery rows.
 *
 * Run: CHROME_PATH=$(which chromium) node tests/e2e-translation-save.mjs
 *
 * Env: BZA_TEST_EMAIL / BZA_TEST_PASSWORD / BZA_BOOK_URL as in e2e-refactor.mjs,
 *      plus SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL for the
 *      read-back and the cleanup.
 */

import puppeteer from 'puppeteer-core'

const BASE     = process.env.BZA_URL     || 'https://aireadalong.com'
const CHROME   = process.env.CHROME_PATH || '/usr/bin/chromium'
const HEADFUL  = process.env.BZA_HEADFUL === '1'
const EMAIL    = process.env.BZA_TEST_EMAIL
const PASSWORD = process.env.BZA_TEST_PASSWORD
const BOOK_URL = process.env.BZA_BOOK_URL
const SUPA     = process.env.NEXT_PUBLIC_SUPABASE_URL
const SVC      = process.env.SUPABASE_SERVICE_ROLE_KEY

let passed = 0, failed = 0
const failures = []
function test(name, ok, detail = '') {
  if (ok) { console.log(`  ✅ ${name}`); passed++ }
  else    { console.log(`  ❌ ${name}${detail ? ': ' + detail : ''}`); failed++; failures.push(`${name}${detail ? ' — ' + detail : ''}`) }
}

if (!EMAIL || !PASSWORD || !BOOK_URL || !SUPA || !SVC) {
  console.log('\n⚠︎  Needs BZA_TEST_EMAIL, BZA_TEST_PASSWORD, BZA_BOOK_URL, ' +
              'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. All are in templedb secrets.\n')
  process.exit(2)
}

const sourceBookId = Number(BOOK_URL.match(/\/books\/(\d+)/)?.[1])

// PostgREST against bza_public. The profile header is not optional: without it
// these resolve against `public`, which is empty, and a cleanup that deletes
// nothing would look exactly like a cleanup that worked.
const rest = (path, init = {}) => fetch(`${SUPA}/rest/v1/${path}`, {
  ...init,
  headers: {
    apikey: SVC,
    Authorization: `Bearer ${SVC}`,
    'Accept-Profile': 'bza_public',
    'Content-Profile': 'bza_public',
    'Content-Type': 'application/json',
    ...(init.headers || {}),
  },
})

const created = []

async function run() {
  const srcRows = await rest(`books?id=eq.${sourceBookId}&select=id,content_type`).then(r => r.json())
  const sourceType = srcRows?.[0]?.content_type
  test(`Source book ${sourceBookId} has a content_type`, !!sourceType, JSON.stringify(srcRows))
  if (!sourceType) return

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: HEADFUL ? false : 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 900 })

  try {
    console.log(`\n--- Auth (login) ---\n  → ${EMAIL}`)
    await page.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 20000 })
    await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 10000 })
    await page.type('input[name="email"], input[type="email"]', EMAIL)
    await page.type('input[name="password"], input[type="password"]', PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForFunction(() => !location.pathname.includes('/auth/login'), { timeout: 15000 })
      .catch(() => null)
    test('Login redirected off /auth/login', !page.url().includes('/auth/login'), page.url())
    if (page.url().includes('/auth/login')) return

    // Posted from the logged-in page so the request carries the real session
    // cookies. Hand-building those is its own source of false failures — the
    // @supabase/ssr cookie is chunked and base64'd, and a malformed one reads
    // as "not authenticated", which is indistinguishable from a broken route.
    const save = (body) => page.evaluate(async (b, base) => {
      const res = await fetch(`${base}/api/create-translated-book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(b),
      })
      let json = null
      try { json = await res.json() } catch { /* non-JSON error body */ }
      return { status: res.status, json }
    }, body, BASE)

    const stamp = new Date().toISOString().replace(/[:.]/g, '-')

    // ─── With a source book: the type must be INHERITED ──────────────
    console.log('\n--- Save a translation of a real book ---')
    const withSource = await save({
      title: `e2e translation ${stamp}`,
      content: '# e2e\n\nSaved by tests/e2e-translation-save.mjs. Safe to delete.',
      sourceBookId,
      prompt: 'Translation: e2e probe',
    })
    console.log(`  status ${withSource.status} ${JSON.stringify(withSource.json)}`)
    test('Save returned 200', withSource.status === 200, `status ${withSource.status}`)
    test('Save returned a bookId', !!withSource.json?.bookId, JSON.stringify(withSource.json))

    if (withSource.json?.bookId) {
      created.push(withSource.json.bookId)
      const [row] = await rest(
        `books?id=eq.${withSource.json.bookId}&select=id,content_type,article_type,source_url`,
      ).then(r => r.json())
      test('Row exists in the database', !!row, 'no row read back')
      test(`content_type inherited from source ('${sourceType}')`,
        row?.content_type === sourceType, `got '${row?.content_type}'`)
      test('article_type mirrors content_type',
        row?.article_type === row?.content_type, `${row?.article_type} vs ${row?.content_type}`)
      test('source_url points at the source book',
        row?.source_url === `/books/${sourceBookId}`, String(row?.source_url))
    }

    // ─── No source book: the documented 'essay' fallback ─────────────
    console.log('\n--- Save with no source book (fallback path) ---')
    const noSource = await save({
      title: `e2e translation nosource ${stamp}`,
      content: '# e2e\n\nNo source book. Safe to delete.',
    })
    console.log(`  status ${noSource.status} ${JSON.stringify(noSource.json)}`)
    test('Fallback save returned 200', noSource.status === 200, `status ${noSource.status}`)
    if (noSource.json?.bookId) {
      created.push(noSource.json.bookId)
      const [row] = await rest(
        `books?id=eq.${noSource.json.bookId}&select=id,content_type`,
      ).then(r => r.json())
      test("content_type falls back to 'essay'", row?.content_type === 'essay', `got '${row?.content_type}'`)
    }
  } finally {
    // In `finally` so a failed assertion above still removes the rows it made.
    if (created.length) {
      console.log(`\n--- Cleanup: books ${created.join(', ')} ---`)
      for (const id of created) {
        const [row] = await rest(`books?id=eq.${id}&select=file_path`).then(r => r.json()).catch(() => [])
        if (row?.file_path) {
          await fetch(`${SUPA}/storage/v1/object/books/${row.file_path}`, {
            method: 'DELETE',
            headers: { apikey: SVC, Authorization: `Bearer ${SVC}` },
          }).catch(() => null)
        }
        const del = await rest(`books?id=eq.${id}`, { method: 'DELETE' })
        const [still] = await rest(`books?id=eq.${id}&select=id`).then(r => r.json()).catch(() => [])
        test(`Deleted book ${id}`, del.ok && !still, `delete ${del.status}, row ${still ? 'still present' : 'gone'}`)
      }
    }
    await browser.close().catch(() => null)
  }
}

run()
  .catch(e => { console.error('\n💥', e); failed++; failures.push(String(e)) })
  .finally(() => {
    console.log(`\n${passed} passed, ${failed} failed`)
    if (failures.length) { console.log('\nFailures:'); failures.forEach(f => console.log(`  · ${f}`)) }
    process.exit(failed ? 1 : 0)
  })
