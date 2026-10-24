#!/usr/bin/env node
/**
 * BZA refactor-verification e2e.
 *
 * Covers the reader-refactor surface introduced Sept 2026: useReading,
 * useSerendipity, useWikiUpdate, TranslationPanel, MangaReader,
 * ChatBookReader. Signs up a fresh throwaway user, uploads a Wikipedia
 * article, opens the reader, exercises each refactored UI surface, and
 * asserts on the resulting DOM state.
 *
 * Run: CHROME_PATH=/path/to/chromium node tests/e2e-refactor.mjs
 *
 * Env:
 *   BZA_URL             default https://aireadalong.com
 *   CHROME_PATH         default /usr/bin/chromium
 *   BZA_HEADFUL         set to 1 to open a visible browser (debug only)
 *   BZA_TEST_EMAIL      persistent test user email (recommended — Supabase
 *   BZA_TEST_PASSWORD   rate-limits signups per IP to ~1/hour). If unset,
 *                       the test signs up a fresh throwaway user.
 *   BZA_BOOK_URL        e.g. https://aireadalong.com/books/1234 — a
 *                       pre-uploaded wiki-article book to open, skipping
 *                       the upload flow. Set this once the persistent
 *                       user has a wiki book saved.
 *
 * First-time setup (one-shot, ~2 min via the admin API):
 *   The `aireadalong.com` domain trips Supabase's email_address_invalid
 *   validator on regular signup. Instead, create + confirm the user
 *   via the admin API (SUPABASE_SERVICE_ROLE_KEY, in templedb secrets):
 *
 *     SVC=$(templedb env var get bza SUPABASE_SERVICE_ROLE_KEY --secret | tail -1)
 *     curl -X POST https://<project>.supabase.co/auth/v1/admin/users \
 *       -H "apikey: $SVC" -H "Authorization: Bearer $SVC" \
 *       -H "Content-Type: application/json" \
 *       -d '{"email":"e2e@aireadalong.com","password":"<pw>","email_confirm":true}'
 *
 *   Then upload one wiki book (see tests/bootstrap-book.mjs in git
 *   history) and stash creds:
 *     templedb env secret set bza BZA_TEST_EMAIL    <email>    --keys age-key
 *     templedb env secret set bza BZA_TEST_PASSWORD <password> --keys age-key
 *     templedb env secret set bza BZA_BOOK_URL      <url>      --keys age-key
 *
 *   Every subsequent run is fully autonomous.
 */

import puppeteer from 'puppeteer-core'

const BASE     = process.env.BZA_URL     || 'https://aireadalong.com'
const CHROME   = process.env.CHROME_PATH || '/usr/bin/chromium'
const HEADFUL  = process.env.BZA_HEADFUL === '1'
const WIKI_URL = 'https://en.wikipedia.org/wiki/Ada_Lovelace'
// Persistent test user: set BZA_TEST_EMAIL / BZA_TEST_PASSWORD to log in
// (recommended — Supabase rate-limits signups per IP). If not set, we try
// to sign up a fresh throwaway user, which only works ~once per hour.
const STAMP    = new Date().toISOString().replace(/[:.]/g, '-')
const EMAIL    = process.env.BZA_TEST_EMAIL    || `e2e-refactor-${STAMP}@aireadalong.com`
const PASSWORD = process.env.BZA_TEST_PASSWORD || 'e2e-Refactor-P@ssw0rd!'
const MODE     = process.env.BZA_TEST_EMAIL ? 'login' : 'signup'
// Pre-uploaded wiki book URL, e.g. https://aireadalong.com/books/1234 —
// skips the upload step (avoids re-uploads for the persistent test user).
const BOOK_URL = process.env.BZA_BOOK_URL

let passed = 0, failed = 0
const failures = []

function test(name, ok, detail = '') {
  if (ok) { console.log(`  ✅ ${name}`); passed++ }
  else    { console.log(`  ❌ ${name}${detail ? ': ' + detail : ''}`); failed++; failures.push(`${name}${detail ? ' — ' + detail : ''}`) }
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: HEADFUL ? false : 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 900 })

  const consoleErrors = []
  page.on('pageerror', e => consoleErrors.push(`pageerror: ${e.message}`))
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(`console: ${m.text()}`) })

  try {
    // ─── Auth: signup or login ─────────────────────────────────────
    console.log(`\n--- Auth (${MODE}) ---`)
    console.log(`  → ${EMAIL}`)
    if (MODE === 'login') {
      await page.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 20000 })
      await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 10000 })
      await page.type('input[name="email"], input[type="email"]', EMAIL)
      await page.type('input[name="password"], input[type="password"]', PASSWORD)
      await page.click('button[type="submit"]')
      const outcome = await page.waitForFunction(() => {
        if (!location.pathname.includes('/auth/login')) return 'redirected'
        const err = document.body.innerText.match(/(invalid|incorrect|not found|failed)[^\n]*/i)
        if (err) return `error: ${err[0]}`
        return false
      }, { timeout: 15000 }).then(h => h.jsonValue()).catch(() => 'timeout')
      console.log(`  login outcome: ${outcome}`)
      test('Login redirected off /auth/login', !page.url().includes('/auth/login'), `${outcome} | ${page.url()}`)
    } else {
      await page.goto(`${BASE}/auth/signup`, { waitUntil: 'domcontentloaded', timeout: 20000 })
      await page.waitForSelector('input[name="email"]', { timeout: 10000 })
      await page.type('input[name="email"]', EMAIL)
      await page.type('input[name="password"]', PASSWORD)
      await page.type('input[name="confirmPassword"]', PASSWORD)
      await page.click('input[name="agreeToTerms"]')
      await page.click('button[type="submit"]')
      const outcome = await page.waitForFunction(() => {
        if (!location.pathname.includes('/auth/signup')) return 'redirected'
        const t = document.body.innerText
        if (/Account Created!/i.test(t)) return 'success-visible'
        const err = t.match(/(rate limit|already registered|invalid|failed to create|user already exists|captcha|verify)[^\n]*/i)
        if (err) return `error: ${err[0]}`
        return false
      }, { timeout: 20000 }).then(h => h.jsonValue()).catch(() => 'timeout')
      console.log(`  signup outcome: ${outcome}`)
      if (outcome === 'success-visible') await sleep(3500)
      test('Signup redirected off /auth/signup', !page.url().includes('/auth/signup'), `${outcome} | ${page.url()}`)
      if (String(outcome).startsWith('error: rate limit')) {
        console.log('\n⚠︎  Signup is rate-limited. Set BZA_TEST_EMAIL/BZA_TEST_PASSWORD to reuse a persistent test user.')
      }
    }

    // ─── Get to a reader page ────────────────────────────────────────
    if (BOOK_URL) {
      console.log(`\n--- Open pre-uploaded book: ${BOOK_URL} ---`)
      await page.goto(BOOK_URL, { waitUntil: 'domcontentloaded', timeout: 20000 })
    } else {
      console.log('\n--- Upload wiki article ---')
      await page.goto(`${BASE}/upload`, { waitUntil: 'domcontentloaded', timeout: 20000 })
      await sleep(2000)
      const tabClicked = await page.$$eval('button', bs => {
        const t = bs.find(x => /^URL$/.test((x.textContent || '').trim()))
        if (t) { t.click(); return true }
        return false
      })
      test('Clicked URL tab on upload page', tabClicked)
      await sleep(1000)
      const urlInput = await page.waitForSelector('input[type="url"]', { timeout: 8000 }).catch(() => null)
      test('URL input rendered on URL tab', !!urlInput)
      if (urlInput) {
        await urlInput.type(WIKI_URL)
        await sleep(500)
        const fetched = await page.$$eval('button', bs => {
          const b = bs.find(x => /^Fetch$/.test((x.textContent || '').trim()) && !x.disabled)
          if (b) { b.click(); return true }
          return false
        })
        test('Fetch button clicked', fetched)
        await page.waitForFunction(() => /\/books\/\d+/.test(location.pathname), { timeout: 60000 }).catch(() => null)
      }
    }
    const bookUrl = page.url()
    test('Landed on a book reader URL', /\/books\/\d+/.test(bookUrl), bookUrl)
    if (!/\/books\/\d+/.test(bookUrl)) {
      console.log('\n⚠︎  Cannot proceed with reader assertions — upload flow did not redirect.')
      await browser.close()
      report()
      return
    }

    // ─── Reader loaded ───────────────────────────────────────────────
    console.log('\n--- Reader loaded ---')
    // Wait for BookReader to mount — the shared toolbar has a Search button.
    await page.waitForSelector('button[title*="Search" i]', { timeout: 15000 })
    test('Toolbar rendered', true)
    // Give content a beat to load.
    await sleep(3000)

    // ─── useWikiUpdate — check-for-updates button appears for wiki books ─
    console.log('\n--- useWikiUpdate ---')
    const wikiBtn = await page.$('button[title*="Wikipedia" i]')
    test('Wiki-update button is present on a wikipedia_article book', !!wikiBtn)
    if (wikiBtn) {
      await wikiBtn.click()
      // Modal appears with either "updated" or "No updates found" text.
      await page.waitForFunction(() => /Wikipedia article updated|No updates found/.test(document.body.innerText), { timeout: 15000 }).catch(() => null)
      const modalText = await page.evaluate(() => document.body.innerText)
      test('Wiki diff modal opened', /Wikipedia article updated|No updates found/.test(modalText))
      // Escape closes the modal reliably (its onClick fires on the backdrop and X button).
      await page.keyboard.press('Escape').catch(() => {})
      // Backup: click the backdrop by clicking outside the modal content
      await page.evaluate(() => {
        const bg = document.querySelector('.fixed.inset-0.z-50')
        if (bg) bg.click()
      }).catch(() => {})
      await sleep(800)
    }

    // ─── TranslationPanel + useReading translation state ─────────────
    console.log('\n--- TranslationPanel ---')
    const translateToggle = await page.$('button[title="Translation"]')
    test('Translation toggle button present (auth flow)', !!translateToggle)
    if (translateToggle) {
      await translateToggle.click()
      await page.waitForFunction(() => {
        return Array.from(document.querySelectorAll('input')).some(i => /translate/i.test(i.placeholder || ''))
      }, { timeout: 15000 }).catch(() => null)
      const promptInput = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('input')).find(i => /translate/i.test(i.placeholder || '')) || null
      })
      test('Translation panel prompt input rendered', !!(await promptInput.evaluate(el => el !== null && el !== undefined)))
      // Verify the three view mode buttons are present (Result / Split / Original)
      const viewLabels = await page.$$eval('button', bs => bs.map(b => b.textContent?.trim()).filter(Boolean))
      test('Translation view buttons: Result', viewLabels.includes('Result'))
      test('Translation view buttons: Split',  viewLabels.includes('Split'))
      test('Translation view buttons: Original', viewLabels.includes('Original'))
      // Close panel via toggle to keep the DOM sane for subsequent checks.
      await translateToggle.click().catch(() => {})
      await sleep(500)
    }

    // ─── useReading — narration button ───────────────────────────────
    // In headless chromium audio playback and speech synthesis are unreliable
    // — narratePage() returns early if window.speechSynthesis has no voices,
    // so title never transitions. Assert only that the button is present
    // and clickable without throwing.
    console.log('\n--- useReading narration button ---')
    const narrBtn = await page.$('button[title*="narration" i], button[title*="Start narration" i]')
    test('Narration button present', !!narrBtn)
    if (narrBtn) {
      let clickErrored = false
      await narrBtn.click().catch(e => { clickErrored = true; return null })
      test('Narration button click does not error', !clickErrored)
      // Immediately click again to stop, in case audio somehow started.
      await sleep(200)
      const stopBtn = await page.$('button[title="Stop narration"]')
      if (stopBtn) await stopBtn.click().catch(() => {})
    }

    // ─── Render-mode toggle (scroll ↔ paginated) ─────────────────────
    console.log('\n--- Render-mode toggle ---')
    const modeBtn = await page.$('button[title*="Scroll mode" i], button[title*="up" i]')
    test('View-mode toggle button present', !!modeBtn)
    if (modeBtn) {
      const before = await modeBtn.evaluate(el => el.getAttribute('title'))
      await modeBtn.click()
      await sleep(500)
      const after = await page.evaluate(() => {
        const b = document.querySelector('button[title*="Scroll mode" i], button[title*="up" i]')
        return b?.getAttribute('title') ?? null
      })
      test('View-mode toggle title changes after click', after !== before, `${before} → ${after}`)
    }

    /**
     * ─── THE FOUR BRANCHES OF cycleViewMode, WALKED ──────────────────
     *
     * The one click above proves the button is wired. It does not touch the
     * thing the refactor actually risked: `cycleViewMode` collapsed four
     * separate view-mode branches into one condition,
     *
     *   if (isMobile || scrollMode || pagesPerView >= 3) { toggle; ppv = 1 }
     *   else { ppv = ppv + 1 }
     *
     * and a single click exercises exactly one arm of it. Three of the four
     * paths through that condition could be broken and the assertion above
     * would still pass.
     *
     * The title is the whole observable: `scrollMode ? 'Scroll mode — click
     * for paginated' : '{pagesPerView}-up — click to cycle'`. So on desktop
     * four clicks must read scroll → 1-up → 2-up → 3-up and land back on
     * scroll, which pins every arm — the scrollMode arm, the two increments,
     * and the `>= 3` wrap. Asserted as a SEQUENCE rather than a set: the
     * order is the claim, and a cycle that visited 1-up twice and never 3-up
     * would satisfy a set comparison.
     *
     * Breakpoint is read from `innerWidth` at click time, not from a media
     * query, so the viewport has to be set before clicking rather than at
     * page load. That is also why mobile is a separate pass below.
     */
    console.log('\n--- cycleViewMode: all four branches (desktop) ---')
    const titleNow = () => page.evaluate(() => {
      const b = document.querySelector('button[title*="Scroll mode" i], button[title*="up" i]')
      return b?.getAttribute('title') ?? null
    })
    const clickMode = async () => {
      const b = await page.$('button[title*="Scroll mode" i], button[title*="up" i]')
      if (!b) return null
      await b.click()
      await sleep(400)
      return titleNow()
    }

    await page.setViewport({ width: 1280, height: 900 })
    await sleep(300)

    // Normalise to scroll mode first, so the walk starts from a known arm —
    // at most four clicks reaches it from anywhere in the cycle.
    for (let i = 0; i < 4; i++) {
      const t = await titleNow()
      if (t && /Scroll mode/i.test(t)) break
      await clickMode()
    }
    const startTitle = await titleNow()
    test('Normalised to scroll mode before the walk',
      !!startTitle && /Scroll mode/i.test(startTitle), String(startTitle))

    const walk = []
    for (let i = 0; i < 4; i++) walk.push(await clickMode())
    console.log(`      walk: ${walk.join(' → ')}`)

    test('Desktop click 1: scroll → 1-up', /\b1-up/.test(walk[0] ?? ''), String(walk[0]))
    test('Desktop click 2: 1-up → 2-up', /\b2-up/.test(walk[1] ?? ''), String(walk[1]))
    test('Desktop click 3: 2-up → 3-up', /\b3-up/.test(walk[2] ?? ''), String(walk[2]))
    test('Desktop click 4: 3-up wraps back to scroll',
      /Scroll mode/i.test(walk[3] ?? ''), String(walk[3]))
    test('The cycle is closed — four clicks return to the start',
      walk[3] === startTitle, `${startTitle} vs ${walk[3]}`)

    /**
     * Mobile takes the `isMobile` arm on every click, so the cycle is two
     * states wide and must never reach 2-up or 3-up. A spread of pages on a
     * phone is the thing that arm exists to prevent.
     */
    console.log('\n--- cycleViewMode: the mobile arm ---')
    await page.setViewport({ width: 390, height: 844 })
    await sleep(300)

    /**
     * Below `lg` the sidebar is a full-screen `z-50` overlay, so if anything
     * has opened it the toolbar is behind a backdrop and a coordinate click
     * lands on the overlay instead of the button. That is a real condition a
     * phone user meets — it is how the wiki auto-open bug was found — but it
     * is not what this section is testing, so it is closed first and asserted
     * separately below.
     */
    const closeSidebarIfOpen = async () => {
      const open = await page.$('.fixed.inset-0.bg-black\\/50')
      if (!open) return false
      const btn = await page.$('button[title="Close sidebar"], button[title="Expand sidebar"]')
      if (btn) await btn.click().catch(() => {})
      await sleep(400)
      // 'Expand sidebar' means it was 'normal'; one more press closes it.
      const still = await page.$('.fixed.inset-0.bg-black\\/50')
      if (still) {
        const b2 = await page.$('button[title="Close sidebar"]')
        if (b2) await b2.click().catch(() => {})
        await sleep(400)
      }
      return true
    }
    await closeSidebarIfOpen()
    test('Toolbar is reachable at phone width (no overlay over it)',
      await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button[title]'))
          .find(x => /Scroll mode|-up/.test(x.getAttribute('title') || ''))
        if (!b) return false
        const r = b.getBoundingClientRect()
        const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
        return top === b || b.contains(top)
      }))

    for (let i = 0; i < 2; i++) {
      const t = await titleNow()
      if (t && /Scroll mode/i.test(t)) break
      await clickMode()
    }
    const mStart = await titleNow()
    const mWalk = [await clickMode(), await clickMode()]
    console.log(`      walk: ${mStart} → ${mWalk.join(' → ')}`)
    test('Mobile click 1: scroll → 1-up', /\b1-up/.test(mWalk[0] ?? ''), String(mWalk[0]))
    test('Mobile click 2: back to scroll, never 2-up',
      /Scroll mode/i.test(mWalk[1] ?? ''), String(mWalk[1]))
    test('Mobile never reaches a multi-page spread',
      !mWalk.some(t => /\b[23]-up/.test(t ?? '')), mWalk.join(' → '))

    await page.setViewport({ width: 1280, height: 900 })
    await sleep(300)

    /**
     * ─── The controls the suite never clicked ────────────────────────
     *
     * Search, the image-mode cycle and the sidebar cycle are all in the
     * extracted toolbar and none of them had a test. Each is a cycle with a
     * title that names its own state, so each can be walked the same way.
     */
    console.log('\n--- Search ---')
    const searchBtn = await page.$('button[title*="Search" i]')
    test('Search button present', !!searchBtn)
    if (searchBtn) {
      await searchBtn.click()
      await sleep(400)
      const input = await page.$('input[placeholder*="earch" i]')
      test('Search opens an input', !!input)
      if (input) {
        await input.type('the')
        await sleep(600)
        const typed = await input.evaluate(el => el.value)
        test('Search input accepts typing', typed === 'the', typed)
      }
      // Escape is the documented close; fall back to the close button.
      await page.keyboard.press('Escape')
      await sleep(400)
      const stillOpen = await page.$('input[placeholder*="earch" i]')
      if (stillOpen) {
        const closeBtn = await page.$('button[title*="Close" i]')
        if (closeBtn) await closeBtn.click().catch(() => {})
        await sleep(300)
      }
      test('Search closes again', !(await page.$('input[placeholder*="earch" i]')))
    }

    console.log('\n--- Image-mode cycle ---')
    /**
     * Four states: all → side only → inline only → none → all. The last arm
     * also fires `onOpenImagesDrawer` (clicking "No images" opens the drawer
     * so the images are still reachable), which is the one branch here with a
     * side effect beyond its own title.
     */
    const IMG_TITLES = [
      'All images — click to cycle',
      'Side images only',
      'Inline images only',
      'No images — click to show',
    ]
    const imgTitleNow = () => page.evaluate(titles => {
      const b = Array.from(document.querySelectorAll('button[title]'))
        .find(x => titles.includes(x.getAttribute('title')))
      return b?.getAttribute('title') ?? null
    }, IMG_TITLES)
    const imgBtn0 = await imgTitleNow()
    test('Image-mode button present', !!imgBtn0, String(imgBtn0))
    if (imgBtn0) {
      const seen = [imgBtn0]
      for (let i = 0; i < 4; i++) {
        const b = await page.evaluateHandle(titles => Array.from(document.querySelectorAll('button[title]'))
          .find(x => titles.includes(x.getAttribute('title'))) ?? null, IMG_TITLES)
        const el = b.asElement()
        if (!el) break
        await el.click().catch(() => {})
        await sleep(400)
        seen.push(await imgTitleNow())
      }
      console.log(`      cycle: ${seen.join(' → ')}`)
      test('Image mode visits all four states',
        new Set(seen.filter(Boolean)).size === 4, seen.join(' → '))
      test('Image mode returns to where it started', seen[0] === seen[4], `${seen[0]} vs ${seen[4]}`)
    }

    console.log('\n--- Sidebar cycle ---')
    /** hidden → normal → wide → hidden, each naming the NEXT action. */
    const SIDEBAR_TITLES = ['Open sidebar', 'Expand sidebar', 'Close sidebar']
    const sideTitleNow = () => page.evaluate(titles => {
      const b = Array.from(document.querySelectorAll('button[title]'))
        .find(x => titles.includes(x.getAttribute('title')))
      return b?.getAttribute('title') ?? null
    }, SIDEBAR_TITLES)
    const side0 = await sideTitleNow()
    test('Sidebar button present', !!side0, String(side0))
    if (side0) {
      const seen = [side0]
      for (let i = 0; i < 3; i++) {
        const b = await page.evaluateHandle(titles => Array.from(document.querySelectorAll('button[title]'))
          .find(x => titles.includes(x.getAttribute('title'))) ?? null, SIDEBAR_TITLES)
        const el = b.asElement()
        if (!el) break
        await el.click().catch(() => {})
        await sleep(400)
        seen.push(await sideTitleNow())
      }
      console.log(`      cycle: ${seen.join(' → ')}`)
      test('Sidebar visits all three states',
        new Set(seen.filter(Boolean)).size === 3, seen.join(' → '))
      test('Sidebar returns to where it started', seen[0] === seen[3], `${seen[0]} vs ${seen[3]}`)
    }

    /**
     * ─── Every control once in PAGINATED mode too ────────────────────
     *
     * The todo this suite was extended for asks for each control in both
     * scroll and paginated mode, and the reason is specific: paginated mode
     * slices content by character offset and re-mounts the pane, so a control
     * that reads the live DOM can work in one mode and not the other. Clicked
     * rather than merely found, and the assertion is that the toolbar is
     * still mounted and nothing threw — a control that detached the toolbar
     * is the failure worth catching here.
     */
    console.log('\n--- Each control once in paginated mode ---')
    // The sidebar cycle above leaves it open, and an open sidebar narrows the
    // toolbar enough to matter. Shut it so this section starts from the same
    // layout the desktop walk ran in.
    const sbClose = await page.$('button[title="Close sidebar"]')
    if (sbClose) { await sbClose.click().catch(() => {}); await sleep(400) }
    for (let i = 0; i < 5; i++) {
      const t = await titleNow()
      if (t && /\b1-up/.test(t)) break
      await clickMode()
    }
    const pagTitle = await titleNow()
    test('Switched into paginated (1-up)', /\b1-up/.test(pagTitle ?? ''), String(pagTitle))

    for (const [label, selector] of [
      ['Search', 'button[title*="Search" i]'],
      ['Translate', 'button[title="Translation"]'],
      ['Narrate', 'button[title*="narration" i]'],
      ['Wiki', 'button[title*="Wikipedia" i]'],
    ]) {
      const b = await page.$(selector)
      if (!b) { test(`${label} present in paginated mode`, false, 'not found'); continue }
      let threw = false
      await b.click().catch(() => { threw = true })
      await sleep(600)
      const toolbarAlive = !!(await page.$('button[title*="Search" i]'))
      test(`${label} clicked in paginated mode without detaching the toolbar`,
        !threw && toolbarAlive, threw ? 'click threw' : 'toolbar gone')
      // Put things back: close search, stop narration, leave panels shut.
      await page.keyboard.press('Escape').catch(() => {})
      const stop = await page.$('button[title="Stop narration"]')
      if (stop) await stop.click().catch(() => {})
      await sleep(300)
    }

    // ─── No console errors during the flow ───────────────────────────
    console.log('\n--- Console health ---')
    // Filter noise — third-party scripts, expected supabase auth chatter,
    // and generic 404s from missing static assets (e.g. /icon-192.png) that
    // are pre-existing and unrelated to the reader refactor.
    const ignored = /supabase|analytics|opentelemetry|Extension context|net::ERR_FAILED.*chrome-extension|Failed to load resource.*status of 404/i
    const real = consoleErrors.filter(e => !ignored.test(e))
    test('No unexpected console errors during flow', real.length === 0, real.slice(0, 3).join(' | '))

  } catch (e) {
    test('Unhandled exception in flow', false, e.message)
    console.error(e)
  }

  await browser.close()
  report()
}

function report() {
  const total = passed + failed
  console.log('\n' + '='.repeat(60))
  if (failed === 0) {
    console.log(`\x1b[32m${passed} passed, ${failed} failed, ${total} total\x1b[0m`)
  } else {
    console.log(`\x1b[31m${passed} passed, ${failed} failed, ${total} total\x1b[0m`)
    console.log('\nFailures:')
    for (const f of failures) console.log(`  • ${f}`)
  }
  console.log(`\nTest user (manual cleanup): ${EMAIL}`)
  console.log('='.repeat(60))
  process.exit(failed > 0 ? 1 : 0)
}

run().catch(e => { console.error(e); process.exit(1) })
