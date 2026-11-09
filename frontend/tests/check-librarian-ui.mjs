#!/usr/bin/env node
/**
 * Diagnostic: is the librarian dock on the home page, and the discuss button in /play?
 *
 * Not a suite and not asserted — it prints what is on the page so a "I don't
 * see it" report can be answered with the DOM instead of an argument. Hit-tests
 * rather than trusting presence, because the thing that makes a visible button
 * unusable in this app is something else painted on top of it
 * (see tests/e2e-refactor.mjs for the two bug classes that taught that).
 *
 * Run from frontend/:
 *   g(){ templedb env var get bza "$1" 2>&1 </dev/null | sed 's/.*\[Y\/n\] //'; }
 *   BZA_TEST_EMAIL="$(g BZA_TEST_EMAIL)" BZA_TEST_PASSWORD="$(g BZA_TEST_PASSWORD)" \
 *   CHROME_PATH=/home/zach/.nix-profile/bin/chromium node tests/check-librarian-ui.mjs
 */

import puppeteer from 'puppeteer-core'

const BASE = process.env.BZA_URL || 'https://aireadalong.com'
const EMAIL = process.env.BZA_TEST_EMAIL
const PASSWORD = process.env.BZA_TEST_PASSWORD
const CHROME = process.env.CHROME_PATH || '/home/zach/.nix-profile/bin/chromium'

if (!EMAIL || !PASSWORD) {
  console.error('need BZA_TEST_EMAIL and BZA_TEST_PASSWORD')
  process.exit(1)
}

const log = (...a) => console.log(...a)

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})

try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 900 })

  // ── sign in ────────────────────────────────────────────────────────────────
  await page.goto(`${BASE}/auth/login`, { waitUntil: 'networkidle2', timeout: 60000 })
  await page.waitForSelector('input[type=email]', { timeout: 20000 })
  await page.type('input[type=email]', EMAIL)
  await page.type('input[type=password]', PASSWORD)
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {}),
    page.click('button[type=submit]'),
  ])
  await new Promise(r => setTimeout(r, 3000))
  log(`signed in → ${page.url()}`)

  // ── home page: the dock ────────────────────────────────────────────────────
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise(r => setTimeout(r, 4000))

  const dock = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const d = btns.find(b => /Open |librarian/i.test(b.getAttribute('aria-label') || ''))
    if (!d) {
      return {
        found: false,
        // What IS pinned to a corner, so "nothing there" can be told apart
        // from "something else there".
        fixedCorner: btns.filter(b => {
          const s = getComputedStyle(b)
          const r = b.getBoundingClientRect()
          return s.position === 'fixed' && r.bottom > innerHeight - 120
        }).map(b => ({
          label: b.getAttribute('aria-label') || b.textContent?.trim()?.slice(0, 30),
          rect: b.getBoundingClientRect().toJSON(),
        })),
      }
    }
    const r = d.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const top = document.elementFromPoint(cx, cy)
    return {
      found: true,
      label: d.getAttribute('aria-label'),
      rect: r.toJSON(),
      visible: getComputedStyle(d).visibility !== 'hidden' && r.width > 0,
      // topIsSelf false means a user cannot click it, whatever the DOM says.
      topIsSelf: d === top || d.contains(top),
      topTag: top?.tagName,
      topClass: (top?.className || '').toString().slice(0, 80),
    }
  })
  log('\n=== HOME DOCK ===')
  log(JSON.stringify(dock, null, 2))

  if (dock.found && dock.topIsSelf) {
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button'))
        .find(x => /Open |librarian/i.test(x.getAttribute('aria-label') || ''))
      b?.click()
    })
    await new Promise(r => setTimeout(r, 2500))
    const after = await page.evaluate(() => {
      const body = document.body.innerText
      return {
        // The drawer's chat tab, if the handoff landed.
        sawChatPlaceholder: /Ask about your library|connections between|Ask anything/i.test(body),
        drawerTabs: Array.from(document.querySelectorAll('button'))
          .map(b => b.textContent?.trim())
          .filter(t => t && ['Chat', 'Knowledge', 'Insights', 'Quiz', 'Problems', 'History'].includes(t)),
        dockPanelOpen: !!document.querySelector('[aria-label=Close]'),
      }
    })
    log('after clicking the dock:')
    log(JSON.stringify(after, null, 2))
  }

  // ── /play: the discuss affordance ──────────────────────────────────────────
  await page.goto(`${BASE}/play`, { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise(r => setTimeout(r, 6000))

  const play = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('li[id^=turn-]'))
    return {
      turnBlocks: items.length,
      // No chain means nothing is selectable, which is the likeliest
      // explanation and is not a bug.
      bodyStart: document.body.innerText.slice(0, 300).replace(/\n+/g, ' | '),
      firstTurnText: items[0]?.innerText?.slice(0, 200)?.replace(/\n+/g, ' | ') ?? null,
    }
  })
  log('\n=== /PLAY ===')
  log(JSON.stringify(play, null, 2))

  if (play.turnBlocks > 0) {
    // Select a run of text inside the first exchange, the way a player would.
    const sel = await page.evaluate(() => {
      const li = document.querySelector('li[id^=turn-]')
      const walker = document.createTreeWalker(li, NodeFilter.SHOW_TEXT)
      let node
      while ((node = walker.nextNode())) {
        if ((node.textContent || '').trim().length >= 25) {
          const range = document.createRange()
          range.setStart(node, 0)
          range.setEnd(node, Math.min(40, node.textContent.length))
          const s = window.getSelection()
          s.removeAllRanges()
          s.addRange(range)
          document.dispatchEvent(new Event('selectionchange'))
          return s.toString()
        }
      }
      return null
    })
    await new Promise(r => setTimeout(r, 1200))
    const discuss = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
        .filter(b => getComputedStyle(b).position === 'fixed')
        .map(b => ({ text: b.textContent?.trim()?.slice(0, 40), rect: b.getBoundingClientRect().toJSON() }))
      return { fixedButtons: btns }
    })
    log(`selected: ${JSON.stringify(sel)}`)
    log('floating buttons after selection:')
    log(JSON.stringify(discuss, null, 2))
  }
} finally {
  await browser.close()
}
