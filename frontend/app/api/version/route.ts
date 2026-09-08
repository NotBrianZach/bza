import { NextResponse } from 'next/server'

// Public build/version endpoint. Used by templedb (and scripts/verify-live-sha.sh)
// to verify that the running deployment matches the last recorded deploy in the graph.
//
// BUILD_SHA and BUILD_TIME are injected at build time via next.config.js's env
// block, which reads them from process.env. See templedb var set bza BUILD_SHA=...
// If either is missing, returns "unknown" — expected during local dev.

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
