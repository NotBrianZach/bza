import { NextResponse } from 'next/server'

// Public build/version endpoint. Used by templedb (and scripts/verify-live-sha.sh)
// to verify that the running deployment matches the last recorded deploy in the graph.
//
// Both values are inlined at build time by next.config.js's `env` block, but they
// come from different places and only one of them is a TempleDB var:
//
//   BUILD_SHA  — a TempleDB commit id, so nothing in the build can derive it. Both
//                deploy entry points stamp it from the graph head themselves; do
//                NOT pre-set it by hand, that is what used to go stale.
//   BUILD_TIME — computed in next.config.js with new Date() and deliberately NOT
//                read from the environment, because a leftover var used to outrank
//                the real build time and this endpoint then served the previous
//                deploy's builtAt indefinitely.
//
// "unknown" is expected in local dev, where neither is injected. A *deployed*
// response of sha="unknown" is a real fault, and verify-live-sha.sh treats it as a
// MISMATCH rather than letting it pass as merely unset.

export async function GET() {
  return NextResponse.json({
    sha: process.env.BUILD_SHA ?? 'unknown',
    builtAt: process.env.BUILD_TIME ?? 'unknown',
  }, {
    headers: {
      'Cache-Control': 'no-store, must-revalidate',
    },
  })
}
