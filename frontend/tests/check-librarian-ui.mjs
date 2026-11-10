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

  // ── /learn concepts: is the node panel actually reachable? ────────────────
  //
  // `position: sticky` is silently inert when any ANCESTOR has a non-visible
  // overflow — it then sticks to that box instead of the viewport, or not at
  // all. Nothing errors and the style is present in the DOM, so this is checked
  // by measuring where the panel lands rather than by reading its CSS.
  await page.goto(`${BASE}/learn`, { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise(r => setTimeout(r, 5000))
  // Case-insensitive: the tab label is "Concepts". An `=== 'concepts'` match
  // silently did nothing and left the run measuring a header icon.
  await page.evaluate(() => {
    const t = Array.from(document.querySelectorAll('button')).find(b => /^concepts$/i.test(b.textContent?.trim() || ''))
    t?.click()
  })
  await new Promise(r => setTimeout(r, 4000))
  // The whole map, not the practised subject. The subject graph is ~5 nodes and
  // 236px, so it never had the problem; the atlas is 291 concepts and is the
  // only scope where the panel was ever far away.
  await page.evaluate(() => {
    const t = Array.from(document.querySelectorAll('button')).find(b => /the whole map/i.test(b.textContent || ''))
    t?.click()
  })
  await new Promise(r => setTimeout(r, 4000))

  const graph = await page.evaluate(() => {
    // The concept graph is the TALLEST svg — `querySelector('svg')` returns a
    // header icon and makes the whole check meaningless.
    const svg = Array.from(document.querySelectorAll('svg'))
      .sort((a, b) => b.getBoundingClientRect().height - a.getBoundingClientRect().height)[0]
    if (!svg) return { svg: false, body: document.body.innerText.slice(0, 200) }
    const win = svg.parentElement
    const nodes = Array.from(svg.querySelectorAll('g')).filter(g => g.querySelector('rect'))
    return {
      svg: true,
      svgHeight: Math.round(svg.getBoundingClientRect().height),
      windowHeight: Math.round(win.getBoundingClientRect().height),
      windowOverflow: getComputedStyle(win).overflow,
      capped: win.getBoundingClientRect().height <= innerHeight * 0.75,
      nodeCount: nodes.length,
    }
  })
  log('\n=== /LEARN CONCEPT MAP ===')
  log(JSON.stringify(graph, null, 2))

  if (graph.nodeCount > 0) {
    // Click a node far down the graph: that is the case the cap and the pin
    // exist for, and the one that used to put the buttons offscreen.
    const picked = await page.evaluate(() => {
      const svg = Array.from(document.querySelectorAll('svg'))
        .sort((a, b) => b.getBoundingClientRect().height - a.getBoundingClientRect().height)[0]
      const nodes = Array.from(svg.querySelectorAll('g')).filter(g => g.querySelector('rect'))
      const target = nodes[Math.min(nodes.length - 1, Math.floor(nodes.length * 0.8))]
      target.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      return target.querySelector('text')?.textContent ?? null
    })
    await new Promise(r => setTimeout(r, 1200))

    const panel = await page.evaluate(() => {
      // The panel is the sticky block holding the verbs.
      const cand = Array.from(document.querySelectorAll('div'))
        .find(d => getComputedStyle(d).position === 'sticky' && /rests on|knowledge point|already know/i.test(d.innerText || ''))
      if (!cand) return { found: false }
      const r = cand.getBoundingClientRect()
      const claim = Array.from(cand.querySelectorAll('button'))
        .find(b => /already know/i.test(b.textContent || ''))
      const teaches = Array.from(cand.querySelectorAll('summary'))
        .find(s => /what this teaches/i.test(s.textContent || ''))
      const cr = claim?.getBoundingClientRect()
      return {
        found: true,
        position: getComputedStyle(cand).position,
        rect: r.toJSON(),
        // The assertion that matters: is it on the screen as it sits?
        inViewport: r.top < innerHeight && r.bottom > 0,
        hasClaimButton: !!claim,
        claimInViewport: cr ? cr.top < innerHeight && cr.bottom > 0 : null,
        hasWhatThisTeaches: !!teaches,
      }
    })
    log(`clicked node: ${JSON.stringify(picked)}`)
    log(JSON.stringify(panel, null, 2))
  }
} finally {
  await browser.close()
}
