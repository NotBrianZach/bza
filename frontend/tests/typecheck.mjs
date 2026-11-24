#!/usr/bin/env node
/**
 * Type-checks the whole frontend with the project's own tsc and tsconfig.
 *
 * WHY THIS EXISTS AS A TEST: the other suites transpile the modules they need
 * and run the emitted JavaScript, where the types are gone. They are therefore
 * structurally blind to a type error, and `next.config.js` keeps
 * `typescript.ignoreBuildErrors: false`, so the first thing that notices one is
 * the production build — which responds by failing the deploy. That happened on
 * 2026-11-23: an unannotated declaration list in lib/concepts/tasks.ts broke
 * `next build` for 28 hours while concepts-logic, atlas and journeys stayed
 * green at 1453, 681 and 27 the whole time. Eight commits of authored
 * mathematics were unshippable and nothing anybody ran said so.
 *
 * So this is not a unit test and it asserts nothing of its own. It runs
 * `tsc --noEmit` and reports what tsc reports. Its value is entirely that it
 * runs *before* a deploy rather than inside one.
 *
 * WHAT IT NEEDS: a node_modules with `typescript` and the project's own type
 * dependencies — `next`, `react` and the `@types/*` they pull in. A plain
 * `templedb edit bza` workspace has none, which is why the other suites are
 * standalone `node` scripts and why this check did not exist before. Rather
 * than install 677 packages into every authoring workspace, this points at the
 * tree the deploy already installs into. See resolveModules below.
 *
 * Run: node tests/typecheck.mjs       (from frontend/)
 *      npm run test:types
 */

import { execFileSync } from 'node:child_process'
import {
  existsSync, lstatSync, readdirSync, readlinkSync, rmdirSync, symlinkSync, unlinkSync,
} from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const FRONTEND = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')

/**
 * The deploy's install tree on this host. It is the only node_modules on the
 * machine built from this repo's package-lock, because `npm install` runs there
 * as the frontend group's pre-deploy step. Using it means this check sees the
 * same package versions the build will.
 *
 * It is a host path and deliberately a default rather than a lookup: the
 * authority for it is projects.deployment_config.app_deploy.working_dir in
 * TempleDB, and a test that shelled out to templedb to read one string would
 * stop working anywhere the CLI is absent. Set BZA_TYPECHECK_NODE_MODULES to
 * override it.
 */
const DEPLOY_MODULES =
  '/home/zach/.local/share/templedb/fhs-deployments/bza/working/frontend/node_modules'

const usable = dir => existsSync(join(dir, 'typescript')) && existsSync(join(dir, 'next'))

/**
 * A directory every entry of which is a symlink holds no installed package —
 * it is the `ln -s <nix typescript> node_modules/typescript` stub that the
 * authoring briefs create so the other suites can find a tsc. Replacing that
 * with the full tree loses nothing. A directory with a real entry in it is
 * somebody's actual install and is left alone.
 */
const isStub = dir => {
  const entries = readdirSync(dir)
  return entries.length > 0 && entries.every(e => lstatSync(join(dir, e)).isSymbolicLink())
}

function resolveModules() {
  const local = join(FRONTEND, 'node_modules')
  if (existsSync(local) && usable(local)) return local

  const donor = process.env.BZA_TYPECHECK_NODE_MODULES || DEPLOY_MODULES
  if (!usable(donor)) {
    console.error(`no usable node_modules.\n`)
    console.error(`  ${local}`)
    console.error(`     ${existsSync(local) ? 'present but has no next/ and no typescript/' : 'absent'}`)
    console.error(`  ${donor}`)
    console.error(`     ${existsSync(donor) ? 'present but has no next/ and no typescript/' : 'absent'} (donor)`)
    console.error(`\ntsc cannot resolve next or @types/react without one, and a type check`)
    console.error(`that skipped the files it could not resolve would report a clean tree`)
    console.error(`it never read. Install the deps, or point BZA_TYPECHECK_NODE_MODULES`)
    console.error(`at a tree built from this repo's package-lock.`)
    process.exit(1)
  }

  // tsc resolves packages by walking up from each source file, so the tree has
  // to sit at frontend/node_modules. Link it there when nothing real is in the
  // way. node_modules is gitignored, so this is not a change to the project.
  if (!existsSync(local)) {
    symlinkSync(donor, local)
    return local
  }
  if (lstatSync(local).isSymbolicLink()) {
    unlinkSync(local)
    symlinkSync(donor, local)
    return local
  }
  if (isStub(local)) {
    for (const e of readdirSync(local)) unlinkSync(join(local, e))
    rmdirSync(local)
    symlinkSync(donor, local)
    return local
  }

  console.error(`${local} holds an install with no next/, and this check will not`)
  console.error(`delete it. Run \`npm install\` there, or remove it and re-run to have`)
  console.error(`the donor tree linked in its place.`)
  process.exit(1)
}

/**
 * tsconfig's include is a recursive .ts glob and its exclude names only
 * node_modules — so any *other* directory under frontend/ holding .ts files
 * becomes part of the project. A node_modules.bak beside the real one is enough
 * to pull TypeScript's own lib .d.ts files in as project sources, and what comes
 * out is a circular-inference error in an unrelated file that looks exactly like
 * a regression somebody just introduced. Refusing is cheaper than the hour it
 * costs to work out that the error is not real.
 */
function refuseStrayModuleDirs() {
  const strays = readdirSync(FRONTEND, { withFileTypes: true })
    .filter(e => e.name.startsWith('node_modules') && e.name !== 'node_modules')
    .map(e => e.name)
  if (strays.length === 0) return
  console.error(`stray module directories under frontend/: ${strays.join(', ')}`)
  console.error(`tsconfig excludes only node_modules, so these are compiled as project`)
  console.error(`sources and the errors they cause are not in your code. Remove them.`)
  process.exit(1)
}

refuseStrayModuleDirs()
const modules = resolveModules()

// --incremental false because tsconfig sets incremental: true, and a tsbuildinfo
// left by a different tsc invocation (a bare `npm run type-check`, an editor)
// decides what gets re-checked. A gate that can be satisfied by a stale cache
// is not a gate.
const args = [join(modules, 'typescript', 'bin', 'tsc'), '--noEmit', '--incremental', 'false']

let out = ''
let failed = false
try {
  out = execFileSync(process.execPath, args, { cwd: FRONTEND, encoding: 'utf8', stdio: 'pipe' })
} catch (err) {
  out = `${err.stdout || ''}${err.stderr || ''}`
  failed = true
}

process.stdout.write(out)

// Report the link target, not the link: "frontend/node_modules" would hide
// which package versions were actually read.
const where = lstatSync(modules).isSymbolicLink() ? readlinkSync(modules) : modules
if (failed) {
  const errors = out.split('\n').filter(l => /^\S.*error TS\d+:/.test(l)).length
  console.error(`\ntype check FAILED — ${errors} error(s). This breaks \`next build\`, and`)
  console.error(`therefore the deploy, whatever the other suites say.`)
  process.exit(2)
}
console.log(`type check clean — tsc --noEmit over tsconfig.json, deps from ${where}`)
