/**
 * Grade every authored task against the REAL math worker.
 *
 * ── Why this is separate from tests/concepts-logic.mjs ────────────────────
 *
 * That suite builds its verifier config by hand — `NO_WORKER = { url: null }`
 * — and everything it proves about rulings is therefore about the local,
 * worker-free path. That is the right default: the suite has to run offline, in
 * a second, with no secret.
 *
 * But it meant the production path had never been exercised by anything. Worse,
 * the hand-built config was mistaken for an observation: a comment in
 * concepts-logic.mjs and a commit message both claimed production had no worker
 * configured, inferred from `NO_WORKER` rather than from production, and it was
 * wrong — the worker is deployed on zMothership2 and published through a
 * Cloudflare Tunnel at math-worker.aireadalong.com, with the URL and token live
 * as Worker secrets.
 *
 * So this exists to make that checkable instead of assumed. It is the only
 * thing in the repo that talks to the CAS.
 *
 * ── Usage ────────────────────────────────────────────────────────────────
 *
 *   MATH_WORKBENCH_URL=https://math-worker.aireadalong.com \
 *   MATH_WORKBENCH_TOKEN="$(templedb env secret get math MATHWB_HTTP_TOKEN)" \
 *     node tests/live-worker.mjs
 *
 * Skips with exit 0 and a stated reason when the URL is absent, so it can sit
 * in a chain of test commands without a token and without failing. A SKIP is
 * not a pass and says so.
 *
 * ── What it asserts ──────────────────────────────────────────────────────
 *
 * Each task's own `reference` must rule `correct`. That is a stronger claim
 * than the local suite's re-derivation: it checks the CAS agrees the reference
 * satisfies the demand, including the `transform_to_form` tasks whose shape AND
 * equivalence can only be settled there.
 *
 * It also submits a deliberately wrong answer to a sample, because "everything
 * is correct" is also what a verifier that always says correct would produce.
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const FRONTEND = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')

const url = (process.env.MATH_WORKBENCH_URL ?? '').trim()
if (!url) {
  console.log('SKIP — MATH_WORKBENCH_URL is not set, so there is no worker to ask.')
  console.log('       This is a skip, not a pass: nothing was verified.')
  process.exit(0)
}

const outDir = mkdtempSync(join(tmpdir(), 'live-worker-'))
try {
  const tsc = join(FRONTEND, 'node_modules', 'typescript', 'bin', 'tsc')
  try {
    execFileSync(process.execPath, [
      tsc,
      join('lib', 'concepts', 'verify.ts'),
      join('lib', 'concepts', 'tasks.ts'),
      '--outDir', outDir,
      '--module', 'commonjs',
      '--target', 'es2020',
      '--moduleResolution', 'node',
      '--esModuleInterop',
      '--skipLibCheck',
      '--rootDir', join(FRONTEND, 'lib'),
    ], { cwd: FRONTEND, stdio: 'pipe' })
  } catch (e) {
    // tsc exits non-zero on the expected `@/` path errors and still emits.
    const out = `${e.stdout ?? ''}${e.stderr ?? ''}`
    if (out.trim() && !/TS2307/.test(out)) console.error(out.trim().slice(0, 800))
  }
  writeFileSync(join(outDir, 'package.json'), JSON.stringify({ type: 'commonjs' }))

  const req = createRequire(import.meta.url)
  const { rule } = req(join(outDir, 'concepts', 'verify.js'))
  const { TASKS } = req(join(outDir, 'concepts', 'tasks.js'))

  const config = {
    url: url.replace(/\/+$/, ''),
    token: (process.env.MATH_WORKBENCH_TOKEN ?? '').trim() || null,
    timeoutMs: Number(process.env.MATH_WORKBENCH_TIMEOUT_MS) || 25_000,
  }

  const failures = []
  let correct = 0

  for (const task of TASKS) {
    const r = await rule(task, task.reference, config)
    const verdict = r.status === 'ruled' ? r.verdict.ruling : r.status
    if (verdict === 'correct') {
      correct++
    } else {
      const why = r.status === 'ruled' ? r.verdict.method : r.reason ?? ''
      failures.push(`  ✗ ${task.id} [${task.kind}] → ${verdict}\n      ${why}`)
    }
  }

  console.log(`${correct} of ${TASKS.length} references rule correct against ${config.url}`)
  if (failures.length) console.log(failures.join('\n'))

  /*
   * The control. A verifier stuck on "correct" would pass everything above, so
   * one known-wrong answer per kind has to come back wrong — and specifically
   * `incorrect` rather than `inconclusive`, which is the difference between the
   * CAS settling the question and failing to.
   */
  const controls = [
    ['complete-monic-1', 'x^2 + 6x + 5', 'the unchanged quadratic — right value, wrong shape'],
    ['complete-monic-1', '(x + 3)^2 - 5', 'right shape, wrong constant'],
    ['factor-monic-1', '(x + 2)(x - 5)', 'wrong factor pair'],
    ['formula-rational-1', '-3', 'the other root'],
  ]
  const controlFailures = []
  for (const [id, answer, note] of controls) {
    const task = TASKS.find(t => t.id === id)
    if (!task) { controlFailures.push(`  ✗ ${id} is not a task any more`); continue }
    const r = await rule(task, answer, config)
    const verdict = r.status === 'ruled' ? r.verdict.ruling : r.status
    if (verdict !== 'incorrect') {
      controlFailures.push(`  ✗ ${id} answered "${answer}" (${note}) → ${verdict}, expected incorrect`)
    }
  }
  console.log(`${controls.length - controlFailures.length} of ${controls.length} wrong answers ruled incorrect`)
  if (controlFailures.length) console.log(controlFailures.join('\n'))

  const bad = failures.length + controlFailures.length
  console.log(bad === 0 ? '\nthe live worker agrees with every authored task' : `\n${bad} failed`)
  if (bad > 0) process.exit(1)
} finally {
  rmSync(outDir, { recursive: true, force: true })
}
