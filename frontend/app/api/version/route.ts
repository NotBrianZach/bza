import { NextResponse } from 'next/server'

// Public build/version endpoint. Used by templedb reconcile to verify that
// the running deployment matches the last recorded deploy in the graph.
//
// BUILD_SHA is injected at deploy time (see deploy pipeline env vars).
// BUILD_TIME is set at build via the ISO date at build kickoff.
// If either is missing, returns "unknown" — helpful during local dev where
// no build step has run.

export const runtime = 'edge'

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
