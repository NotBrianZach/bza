#!/usr/bin/env node
/**
 * BZA /learn e2e — the practice surface, driven as a learner meets it.
 *
 * ── Why this exists, which is a specific failure rather than a principle ──
 *
 * On 2026-10-24 claiming was broken in production for every claim made
 * through the UI. `resolve()` in /api/learn/claims still defaulted to
 * RATIONAL_EXPRESSIONS after the default subject moved to ONTOLOGIES[0], so a
 * learner practising arithmetic claimed an arithmetic concept, the route
 * looked it up in the wrong subject, missed, and answered
 *
 *   409 "Order of operations" is on the map but has no problems written for it
 *
 * about a concept with three knowledge points whose points the same page was
 * listing. It shipped, and it was found by hand-driving a browser — not by the
 * ~1400 unit assertions, which test `claimableChainFor` and the store and
 * cannot see a route resolving the wrong subject, and not by the other e2e
 * suites, which cover the reader and the landing pages.
 *
 * So the gap this closes is exact: WIRING. Whether the page, the route, the
 * store and the registry agree with each other about which subject a concept
 * belongs to and which rows come back.
 *
 * ── What it asserts that a unit test structurally cannot ─────────────────
 *
 *  - The default subject is the bottom of the prerequisite order. Four files
 *    hard-coded this and three were updated together; the fourth is the bug
 *    above. Asserted against what the page actually shows.
 *  - A claim made in the graph reaches the database and comes back in the
 *    list, across the subject boundary a chain claim deliberately crosses.
 *  - The list refreshes without a reload. It owns its own fetch, so the page's
 *    `load()` does not reach it — that was the second bug found the same day.
 *  - Withdrawing settles the row and prints the STORED reason.
 *
 * ── It resets its own state, in both directions ──────────────────────────
 *
 * Claims persist on the test user, so a second run would otherwise meet rows
 * the first one left and assert against them. Every live claim is withdrawn
 * before the run starts and again after it finishes. That makes the suite
 * idempotent and leaves the account as it found it.
 *
 * Run: CHROME_PATH=/path/to/chromium node tests/e2e-learn.mjs
 *
 * Env: BZA_URL, CHROME_PATH, BZA_HEADFUL, BZA_TEST_EMAIL, BZA_TEST_PASSWORD
 *      — the same persistent test user tests/e2e-refactor.mjs uses. Its header
 *      documents the one-time setup via the Supabase admin API.
 */

import puppeteer from 'puppeteer-core'

const BASE     = process.env.BZA_URL     || 'https://aireadalong.com'
const CHROME   = process.env.CHROME_PATH || '/usr/bin/chromium'
const HEADFUL  = process.env.BZA_HEADFUL === '1'
const EMAIL    = process.env.BZA_TEST_EMAIL
const PASSWORD = process.env.BZA_TEST_PASSWORD

let passed = 0, failed = 0
const failures = []

function test(name, ok, detail = '') {
  if (ok) { console.log(`  ✅ ${name}`); passed++ }
  else    { console.log(`  ❌ ${name}${detail ? ': ' + detail : ''}`); failed++; failures.push(`${name}${detail ? ' — ' + detail : ''}`) }
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

/** The claims panel, read out of the DOM. Shared by every assertion about it. */
const readClaims = page => page.evaluate(() => {
  const h = [...document.querySelectorAll('h3')].find(x => /What you have claimed/.test(x.textContent))
  if (!h) return null
  const box = h.parentElement.parentElement
  return {
    count: box.innerText.match(/\d+ open(?:, \d+ settled)?/)?.[0] ?? null,
    empty: /Nothing claimed/.test(box.innerText),
    rows: [...box.querySelectorAll('li')].map(li => ({
      text: li.innerText.replace(/\n/g, ' | '),
      name: li.innerText.split('\n')[0],
      withdrawable: !!([...li.querySelectorAll('button')].find(b => /Withdraw/.test(b.textContent))),
    })),
  }
})

/** Click the Concepts tab and wait for the graph and panel to settle. */
async function openConcepts(page) {
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'Concepts')
    b?.click()
  })
  await sleep(2500)
}

/**
 * Withdraw every live claim, one press at a time.
 *
 * Through the UI rather than the API on purpose: it is the same path the
 * assertions exercise, so a reset that works is already evidence, and a reset
 * that hangs fails loudly here instead of corrupting the run that follows.
 */
async function withdrawAll(page, label) {
  let removed = 0
  for (let i = 0; i < 25; i++) {
    const clicked = await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find(x => /Withdraw/.test(x.textContent))
      if (!b) return false
      b.click()
      return true
    })
    if (!clicked) break
    removed++
    await sleep(2200)
  }
  if (removed) console.log(`  (${label}: withdrew ${removed})`)
  return removed
}

async function run() {
  if (!EMAIL || !PASSWORD) {
    console.error('BZA_TEST_EMAIL and BZA_TEST_PASSWORD are required — see the header.')
    process.exit(1)
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: HEADFUL ? false : 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1400, height: 1100 })
  // The chain claim confirms before posting; accept so the flow continues.
  page.on('dialog', async d => { await d.accept() })

  const consoleErrors = []
  const serverErrors = []
  page.on('pageerror', e => consoleErrors.push(`pageerror: ${e.message}`))
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(`console: ${m.text()}`) })
  page.on('response', r => {
    if (r.status() >= 500) serverErrors.push(`${r.status()} ${r.url().replace(BASE, '')}`)
  })

  try {
    console.log(`\n--- Auth ---\n  → ${EMAIL}`)
    await page.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 25000 })
    await page.waitForSelector('input[type="email"]', { timeout: 15000 })
    await page.type('input[type="email"]', EMAIL)
    await page.type('input[type="password"]', PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForFunction(() => !location.pathname.includes('/auth/login'), { timeout: 20000 })
      .catch(() => null)
    test('Logged in', !page.url().includes('/auth/login'), page.url())

    console.log('\n--- /learn loads ---')
    await page.goto(`${BASE}/learn`, { waitUntil: 'networkidle2', timeout: 30000 })
    await sleep(4500)
    test('Practice tab is present', await page.evaluate(() =>
      [...document.querySelectorAll('button')].some(b => b.textContent.trim() === 'Practice')))

    /**
     * THE INVARIANT THE 2026-10-24 BUG BROKE.
     *
     * The subject shown with no explicit choice must be the one at the bottom
     * of the prerequisite order, because everything above it is gated. Four
     * files hard-code this default and the whole class of bug is one of them
     * disagreeing — so it is asserted against the rendered picker rather than
     * against any constant, which is the only version a wiring bug cannot
     * satisfy by being consistently wrong.
     */
    const subjectShown = await page.evaluate(() => {
      const sel = document.querySelector('select')
      if (sel) return sel.options[sel.selectedIndex]?.textContent?.trim() ?? null
      const btn = [...document.querySelectorAll('button')]
        .find(b => /Arithmetic foundations|Rational expressions|Exponents/i.test(b.textContent))
      return btn?.textContent?.trim() ?? null
    })
    test('Default subject is the foundation, not an algebra syllabus',
      /arithmetic/i.test(subjectShown ?? ''), String(subjectShown))

    console.log('\n--- Concepts tab ---')
    await openConcepts(page)
    const nodes = await page.evaluate(() =>
      [...document.querySelectorAll('svg text')].map(t => t.textContent).filter(Boolean))
    test('The graph draws nodes', nodes.length > 0, `${nodes.length} text nodes`)
    test('Claims panel is present', (await readClaims(page)) !== null)

    /**
     * Clean slate means NO LIVE CLAIMS, not an empty list.
     *
     * A withdrawn claim is revoked, not deleted — `allClaims` is documented as
     * returning the dead ones too, because the history is the point: "you
     * withdrew this" and "you got one wrong" are both facts worth keeping. So
     * every run of this suite leaves settled rows behind for the next one, and
     * asserting an empty list would fail on the second run for ever.
     *
     * The precondition that actually matters is that nothing is open, which is
     * what the assertions below are written against.
     */
    await withdrawAll(page, 'reset')
    await sleep(1200)
    const fresh = await readClaims(page)
    const liveCount = (fresh?.rows ?? []).filter(r => r.withdrawable).length
    test('Starts with no live claims (settled history may remain)',
      liveCount === 0, `${liveCount} live, count="${fresh?.count}"`)

    console.log('\n--- Select a concept and claim its chain ---')
    const picked = await page.evaluate(() => {
      // A node with something beneath it, so the chain button appears at all.
      const n = [...document.querySelectorAll('svg text')]
        .find(x => /Order of operations|Divisibility|Negative numbers/i.test(x.textContent))
      n?.closest('g')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      return n?.textContent ?? null
    })
    test('A graph node can be selected', !!picked, String(picked))
    await sleep(1500)

    const chainLabel = await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find(x => /I know this and the \d+ under it/.test(x.textContent))
      return b?.textContent.trim() ?? null
    })
    test('The chain button offers a count', /\d+/.test(chainLabel ?? ''), String(chainLabel))
    test('The disclosure names what would be claimed', await page.evaluate(() =>
      [...document.querySelectorAll('summary')].some(s => /what that would claim/.test(s.textContent))))

    const claimPost = page.waitForResponse(
      r => r.url().includes('/api/learn/claims') && r.request().method() === 'POST',
      { timeout: 25000 },
    ).catch(() => null)
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find(x => /I know this and the \d+ under it/.test(x.textContent))
      b?.click()
    })
    const res = await claimPost
    const status = res ? res.status() : 0
    const body = res ? await res.json().catch(() => ({})) : {}
    /**
     * Asserted on the STATUS, not on the list looking right afterwards.
     * The bug this suite exists for was a 409 whose message was confidently
     * wrong; a test that only checked "no rows appeared" would have reported
     * an empty list and said nothing about why.
     */
    test('The chain claim is accepted', status === 200, `${status} ${JSON.stringify(body).slice(0, 160)}`)
    test('It reports which concepts it claimed',
      Array.isArray(body.chain) && body.chain.length > 1,
      `chain=${body.chain?.length}`)
    test('Every row it wrote names a subject',
      (body.chain ?? []).every(c => !!c.subjectId),
      JSON.stringify((body.chain ?? []).map(c => c.subjectId)))

    console.log('\n--- The list, without a reload ---')
    await sleep(3000)
    const after = await readClaims(page)
    /**
     * LIVE rows, not rows. Settled history survives from earlier runs, so
     * `rows.length > 0` would pass even if the claim had been refused — which
     * is precisely the bug this suite was written for. Counting only what is
     * withdrawable ties the assertion to claims this run actually made.
     */
    const liveAfter = (after?.rows ?? []).filter(r => r.withdrawable).length
    test('Live rows appear with no page reload', liveAfter > 0,
      `${liveAfter} live of ${after?.rows.length ?? 0} rows, count="${after?.count}"`)
    test('One live row per concept the route said it claimed',
      liveAfter === (body.chain ?? []).length,
      `${liveAfter} live vs ${(body.chain ?? []).length} in the response`)
    test('The count agrees with the rows',
      after?.count?.startsWith(String(after.rows.filter(r => r.withdrawable).length)) ?? false,
      `${after?.count} vs ${after?.rows.filter(r => r.withdrawable).length} withdrawable`)
    test('Each row names its own subject', (after?.rows ?? []).every(r => r.text.includes('|')),
      after?.rows[0]?.text ?? '')
    test('The picker suffix does not leak into the rows',
      !(after?.rows ?? []).some(r => /has problems/.test(r.text)),
      after?.rows[0]?.text ?? '')
    for (const r of after?.rows ?? []) console.log(`      ${r.text}`)

    /** Survives a reload — i.e. it is in the database, not just in React state. */
    await page.reload({ waitUntil: 'networkidle2' })
    await sleep(4000)
    await openConcepts(page)
    const reloaded = await readClaims(page)
    test('The claims survive a reload', (reloaded?.rows.length ?? 0) === (after?.rows.length ?? -1),
      `${reloaded?.rows.length} vs ${after?.rows.length}`)

    console.log('\n--- Withdraw one ---')
    const target = reloaded?.rows.find(r => r.withdrawable)
    test('A live row offers withdrawal', !!target, reloaded?.count ?? '')
    if (target) {
      await page.evaluate(() => {
        const b = [...document.querySelectorAll('button')].find(x => /Withdraw/.test(x.textContent))
        b?.click()
      })
      await sleep(4000)
      const settled = await readClaims(page)
      const row = settled?.rows.find(r => r.name === target.name)
      test('The count moves one from open to settled',
        /settled/.test(settled?.count ?? ''), `${reloaded?.count} → ${settled?.count}`)
      test('The withdrawn row stays, rather than vanishing', !!row, target.name)
      test('It prints the stored reason', /withdrawn/i.test(row?.text ?? ''), row?.text ?? '')
      test('And it no longer offers the button', row?.withdrawable === false, row?.text ?? '')
    }

    console.log('\n--- Health ---')
    test('No 5xx from any endpoint', serverErrors.length === 0,
      [...new Set(serverErrors)].slice(0, 4).join(' | '))
    const ignored = /supabase|analytics|opentelemetry|Extension context|chrome-extension|status of (404|502)/i
    const real = consoleErrors.filter(e => !ignored.test(e))
    test('No unexpected console errors', real.length === 0, real.slice(0, 3).join(' | '))

  } catch (e) {
    test('Unhandled exception in flow', false, e.message)
    console.error(e)
  } finally {
    // Leave the account as we found it, whether or not the run succeeded.
    try {
      await openConcepts(page)
      await withdrawAll(page, 'cleanup')
    } catch {}
    await browser.close()
  }
  report()
}

function report() {
  const total = passed + failed
  console.log('\n' + '='.repeat(60))
  const colour = failed === 0 ? 32 : 31
  console.log(`\x1b[${colour}m${passed} passed, ${failed} failed, ${total} total\x1b[0m`)
  if (failed) {
    console.log('\nFailures:')
    for (const f of failures) console.log(`  • ${f}`)
  }
  console.log('='.repeat(60))
  process.exit(failed > 0 ? 1 : 0)
}

run().catch(e => { console.error(e); process.exit(1) })
