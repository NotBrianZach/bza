#!/usr/bin/env node
/**
 * BZA baseline e2e — the unauth "new user experience" happy path.
 *
 * Runs against prod (aireadalong.com by default) via puppeteer-core +
 * external chromium. No local dev server, no auth, no state pollution.
 *
 * Run: CHROME_PATH=/path/to/chromium node tests/e2e.mjs
 *
 * Env:
 *   BZA_URL      default https://aireadalong.com
 *   CHROME_PATH  default /usr/bin/chromium
 *   BZA_HEADFUL  set to 1 to open a visible browser (debug only)
 *
 * Coverage:
 *   - Landing page renders (SSR + client hydration) with hero + CTAs
 *   - Signup / login pages render their form controls
 *   - Upload page is publicly reachable and has tab navigation
 *   - Static assets: manifest.json (valid), sw.js
 *   - Mobile viewport: no horizontal overflow, content hydrates
 *   - Performance: full landing load < 5s, JS bundle < 500KB
 *
 * See also tests/e2e-refactor.mjs for the auth-gated reader-refactor
 * flow (needs BZA_TEST_EMAIL / BZA_TEST_PASSWORD / BZA_BOOK_URL).
 */

import puppeteer from 'puppeteer-core'

const BASE    = process.env.BZA_URL     || 'https://aireadalong.com'
const CHROME  = process.env.CHROME_PATH || '/usr/bin/chromium'
const HEADFUL = process.env.BZA_HEADFUL === '1'

let passed = 0, failed = 0
const failures = []
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

function test(name, ok, detail = '') {
  if (ok) { console.log(`  ✅ ${name}`); passed++ }
  else    { console.log(`  ❌ ${name}${detail ? ': ' + detail : ''}`); failed++; failures.push(`${name}${detail ? ' — ' + detail : ''}`) }
}

async function run() {
  let browser
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME,
      headless: HEADFUL ? false : 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    })
  } catch (e) {
    console.error(`Failed to launch browser: ${e.message}`)
    console.error(`Set CHROME_PATH to a chromium binary.`)
    process.exit(1)
  }

  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 800 })

  // ─── Landing Page ─────────────────────────────────────────────
  console.log('\n--- Landing Page ---')
  const jsErrors = []
  page.on('pageerror', e => jsErrors.push(e.message))
  try {
    const res = await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 20000 })
    test('Landing page loads', res.status() === 200, `status ${res.status()}`)

    const title = await page.title()
    test('Page title mentions Read Along', /Read Along/i.test(title), title)

    // Landing is client-rendered — give hydration a beat.
    await sleep(1000)
    const bodyText = await page.evaluate(() => document.body.innerText)

    test('Has a Get Started / Sign Up CTA', /Get Started|Sign Up|Sign In/i.test(bodyText))
    test('Has hero pitch ("Read smarter with AI")', /Read smarter with AI/i.test(bodyText))
    // Feature list mentions at least two of AI Chat, audiobook, flashcards, translate, problem sets
    const featureHits = ['AI Chat', 'audiobook', 'Flashcards', 'Translate', 'Problem sets']
      .filter(k => new RegExp(k, 'i').test(bodyText))
    test('Shows at least 2 feature descriptions', featureHits.length >= 2, `matched: ${featureHits.join(', ')}`)

    test('No JS errors on landing', jsErrors.length === 0, jsErrors.join('; '))
  } catch (e) {
    test('Landing page loads', false, e.message)
  }

  // ─── Signup Page ──────────────────────────────────────────────
  console.log('\n--- Signup Page ---')
  try {
    await page.goto(`${BASE}/auth/signup`, { waitUntil: 'networkidle2', timeout: 15000 })
    await sleep(500)

    test('Has email input',    !!(await page.$('input[type="email"]')))
    test('Has password input', !!(await page.$('input[type="password"]')))
    test('Has confirm-password input', !!(await page.$('input[name="confirmPassword"]')))
    test('Has terms checkbox', !!(await page.$('input[name="agreeToTerms"]')))
    test('Has Create Account submit', await page.$$eval('button[type="submit"]', bs => bs.some(b => /Create Account|Sign Up/i.test(b.textContent || ''))))

    const bodyText = await page.evaluate(() => document.body.innerText)
    test('Has Google OAuth option', /Google/i.test(bodyText))
    test('Has free-tier / pricing hint', /free/i.test(bodyText))
  } catch (e) {
    test('Signup page loads', false, e.message)
  }

  // ─── Login Page ───────────────────────────────────────────────
  console.log('\n--- Login Page ---')
  try {
    await page.goto(`${BASE}/auth/login`, { waitUntil: 'networkidle2', timeout: 15000 })
    await sleep(500)

    test('Has email input',    !!(await page.$('input[type="email"]')))
    test('Has password input', !!(await page.$('input[type="password"]')))
    test('Has Sign In submit', await page.$$eval('button[type="submit"]', bs => bs.some(b => /Sign In|Log In/i.test(b.textContent || ''))))
    const bodyText = await page.evaluate(() => document.body.innerText)
    test('Has forgot-password link', /forgot/i.test(bodyText))
  } catch (e) {
    test('Login page loads', false, e.message)
  }

  // ─── Upload Page (unauth-reachable, form-only) ────────────────
  console.log('\n--- Upload Page ---')
  try {
    await page.goto(`${BASE}/upload`, { waitUntil: 'networkidle2', timeout: 15000 })
    await sleep(1000)

    // Tabs at the top of the upload UI
    const tabs = await page.$$eval('button', bs => bs.map(b => (b.textContent || '').trim()))
    test('Has File tab',   tabs.some(t => t === 'File'))
    test('Has URL tab',    tabs.some(t => t === 'URL'))
    test('Has Feeds tab',  tabs.some(t => t === 'Feeds'))
  } catch (e) {
    test('Upload page loads', false, e.message)
  }

  // ─── Static Assets ────────────────────────────────────────────
  console.log('\n--- Static Assets ---')
  try {
    const m = await page.goto(`${BASE}/manifest.json`, { timeout: 10000 })
    // 200 = fresh, 304 = cached (both mean the asset exists + is servable)
    test('manifest.json is servable', [200, 304].includes(m.status()), `status ${m.status()}`)
    const parsed = JSON.parse(await m.text())
    test('manifest.json parses as JSON with a name', !!parsed.name)

    const sw = await page.goto(`${BASE}/sw.js`, { timeout: 10000 })
    test('Service worker is servable', [200, 304].includes(sw.status()), `status ${sw.status()}`)
  } catch (e) {
    test('Static assets load', false, e.message)
  }

  // ─── Mobile Viewport ──────────────────────────────────────────
  console.log('\n--- Mobile Viewport ---')
  try {
    await page.setViewport({ width: 375, height: 812, isMobile: true })
    await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 15000 })
    await sleep(1000)

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    test('No horizontal overflow on mobile', bodyWidth <= 400, `body width ${bodyWidth}px`)

    const textLen = await page.evaluate(() => document.body.innerText.length)
    test('Content hydrates on mobile', textLen > 200, `${textLen} chars`)

    await page.setViewport({ width: 1280, height: 800 })
  } catch (e) {
    test('Mobile viewport', false, e.message)
  }

  // ─── Performance ──────────────────────────────────────────────
  // Open a fresh page with cache disabled so numbers reflect a first-time
  // visitor, not the warm session cache.
  console.log('\n--- Performance ---')
  try {
    const perfPage = await browser.newPage()
    await perfPage.setViewport({ width: 1280, height: 800 })
    await perfPage.setCacheEnabled(false)
    const start = Date.now()
    await perfPage.goto(BASE, { waitUntil: 'load', timeout: 15000 })
    const loadMs = Date.now() - start
    test(`Landing full load < 5s (took ${(loadMs / 1000).toFixed(1)}s)`, loadMs < 5000)

    const bundleBytes = await perfPage.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter(r => /_next\/static\/.*\.(js|css)$/.test(r.name))
        .reduce((sum, r) => sum + (r.transferSize || 0), 0)
    })
    const bundleKB = Math.round(bundleBytes / 1024)
    test(`JS+CSS bundle transfer < 400KB (got ${bundleKB}KB)`, bundleKB < 400, `${bundleKB}KB`)
    await perfPage.close()
  } catch (e) {
    test('Performance checks', false, e.message)
  }

  await browser.close()

  // ─── Summary ──────────────────────────────────────────────────
  const total = passed + failed
  console.log('\n' + '='.repeat(50))
  if (failed === 0) {
    console.log(`\x1b[32m${passed} passed, ${failed} failed, ${total} total\x1b[0m`)
  } else {
    console.log(`\x1b[31m${passed} passed, ${failed} failed, ${total} total\x1b[0m`)
    console.log('\nFailures:')
    for (const f of failures) console.log(`  • ${f}`)
  }
  console.log('='.repeat(50))
  process.exit(failed > 0 ? 1 : 0)
}

run().catch(e => { console.error(e); process.exit(1) })
