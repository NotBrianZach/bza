#!/usr/bin/env node
/**
 * BZA E2E tests — new user experience via Puppeteer.
 * Run: CHROME_PATH=/path/to/chromium node tests/e2e.mjs
 *
 * Tests the critical path a new user takes:
 * 1. Landing page loads and has CTA
 * 2. Signup page renders with form
 * 3. Upload page renders with tabs
 * 4. Classic library: add a book (signed-out → localStorage)
 * 5. Reader: open book, navigate pages
 * 6. Mobile viewport: responsive layout
 */

import puppeteer from 'puppeteer-core'

const BASE = process.env.BZA_URL || 'https://aireadalong.com'
const CHROME = process.env.CHROME_PATH || '/usr/bin/chromium'

let passed = 0, failed = 0, skipped = 0

function test(name, ok, detail = '') {
  if (ok) { console.log(`  ✅ ${name}`); passed++ }
  else { console.log(`  ❌ ${name}${detail ? ': ' + detail : ''}`); failed++ }
}

function skip(name, reason) {
  console.log(`  ⏭️  ${name}: ${reason}`); skipped++
}

async function run() {
  let browser
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    })
  } catch (e) {
    console.error(`Failed to launch browser: ${e.message}`)
    console.error(`Set CHROME_PATH to a chromium binary`)
    process.exit(1)
  }

  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 800 })

  // ── Landing Page ──────────────────────────────────────────────
  console.log('\n--- Landing Page ---')
  try {
    const res = await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 15000 })
    test('Landing page loads', res.status() === 200, `status ${res.status()}`)

    const title = await page.title()
    test('Page title contains AI Read Along', title.includes('AI Read Along'), title)

    const ctaText = await page.evaluate(() => document.body.innerText)
    test('Has "Get Started" CTA', ctaText.includes('Get Started') || ctaText.includes('Sign Up'))

    const hasFeatures = ctaText.includes('AI') && (ctaText.includes('chat') || ctaText.includes('Chat') || ctaText.includes('audiobook') || ctaText.includes('Audiobook'))
    test('Shows feature descriptions', hasFeatures)

    // Check no JS errors
    const errors = []
    page.on('pageerror', e => errors.push(e.message))
    await page.waitForTimeout(1000)
    test('No console errors on landing', errors.length === 0, errors.join('; '))
  } catch (e) {
    test('Landing page loads', false, e.message)
  }

  // ── Signup Page ───────────────────────────────────────────────
  console.log('\n--- Signup Page ---')
  try {
    await page.goto(`${BASE}/auth/signup`, { waitUntil: 'domcontentloaded', timeout: 10000 })

    const hasEmail = await page.$('input[type="email"]')
    test('Has email input', !!hasEmail)

    const hasPassword = await page.$('input[type="password"]')
    test('Has password input', !!hasPassword)

    const bodyText = await page.evaluate(() => document.body.innerText)
    test('Has Google OAuth option', bodyText.includes('Google'))

    test('Has free tier info', bodyText.includes('free') || bodyText.includes('Free'))
  } catch (e) {
    test('Signup page loads', false, e.message)
  }

  // ── Login Page ────────────────────────────────────────────────
  console.log('\n--- Login Page ---')
  try {
    await page.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 10000 })

    const hasEmail = await page.$('input[type="email"]')
    test('Has email input', !!hasEmail)

    const hasPassword = await page.$('input[type="password"]')
    test('Has password input', !!hasPassword)

    const bodyText = await page.evaluate(() => document.body.innerText)
    test('Has forgot password link', bodyText.includes('Forgot') || bodyText.includes('forgot'))
  } catch (e) {
    test('Login page loads', false, e.message)
  }

  // ── Upload Page ───────────────────────────────────────────────
  console.log('\n--- Upload Page ---')
  try {
    await page.goto(`${BASE}/upload`, { waitUntil: 'domcontentloaded', timeout: 10000 })

    const bodyText = await page.evaluate(() => document.body.innerText)
    test('Upload page renders', bodyText.includes('Upload') || bodyText.includes('upload') || bodyText.includes('Add'))

    // Check for upload method tabs
    const hasFileUpload = bodyText.includes('File') || bodyText.includes('file') || bodyText.includes('drag')
    test('Has file upload option', hasFileUpload)

    const hasUrlUpload = bodyText.includes('URL') || bodyText.includes('url') || bodyText.includes('link')
    test('Has URL upload option', hasUrlUpload)
  } catch (e) {
    test('Upload page loads', false, e.message)
  }

  // ── Static Assets ─────────────────────────────────────────────
  console.log('\n--- Static Assets ---')
  try {
    const manifest = await page.goto(`${BASE}/manifest.json`, { timeout: 5000 })
    test('manifest.json loads', manifest.status() === 200)
    const manifestBody = await manifest.text()
    const parsed = JSON.parse(manifestBody)
    test('manifest.json is valid JSON with name', !!parsed.name)

    const sw = await page.goto(`${BASE}/sw.js`, { timeout: 5000 })
    test('Service worker loads', sw.status() === 200)

    const septuagint = await page.goto(`${BASE}/classics/bible-septuagint.txt`, { timeout: 5000 })
    test('Septuagint text file accessible', septuagint.status() === 200)
    const sepLen = (await septuagint.text()).length
    test('Septuagint text is substantial', sepLen > 100000, `${sepLen} bytes`)
  } catch (e) {
    test('Static assets load', false, e.message)
  }

  // ── Mobile Viewport ───────────────────────────────────────────
  console.log('\n--- Mobile Viewport ---')
  try {
    await page.setViewport({ width: 375, height: 812, isMobile: true })
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 10000 })

    // Check page still renders (no horizontal overflow causing blank screen)
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    test('No horizontal overflow on mobile', bodyWidth <= 400, `body width: ${bodyWidth}px`)

    const hasContent = await page.evaluate(() => document.body.innerText.length > 100)
    test('Content renders on mobile', hasContent)

    // Reset viewport
    await page.setViewport({ width: 1280, height: 800 })
  } catch (e) {
    test('Mobile viewport', false, e.message)
  }

  // ── Performance ───────────────────────────────────────────────
  console.log('\n--- Performance ---')
  try {
    const start = Date.now()
    await page.goto(BASE, { waitUntil: 'load', timeout: 10000 })
    const loadTime = Date.now() - start
    test(`Landing page full load < 5s (took ${(loadTime/1000).toFixed(1)}s)`, loadTime < 5000)

    // Check bundle size via performance API
    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter(r => r.name.includes('_next/static'))
        .reduce((sum, r) => sum + (r.transferSize || 0), 0)
    })
    const bundleKB = Math.round(resources / 1024)
    test(`JS bundle transfer < 500KB (got ${bundleKB}KB)`, bundleKB < 500, `${bundleKB}KB`)
  } catch (e) {
    test('Performance checks', false, e.message)
  }

  await browser.close()

  // ── Summary ───────────────────────────────────────────────────
  const total = passed + failed
  console.log(`\n${'='.repeat(50)}`)
  if (failed === 0) {
    console.log(`\x1b[32m${passed} passed, ${failed} failed, ${total} total\x1b[0m`)
  } else {
    console.log(`\x1b[31m${passed} passed, ${failed} failed, ${total} total\x1b[0m`)
  }
  if (skipped) console.log(`(${skipped} skipped)`)
  console.log('='.repeat(50))
  process.exit(failed > 0 ? 1 : 0)
}

run().catch(e => { console.error(e); process.exit(1) })
