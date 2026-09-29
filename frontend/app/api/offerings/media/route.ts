import { NextRequest, NextResponse } from 'next/server'
import { MEDIUM_LIST, availableMedia } from '@/lib/correlate/media'

/**
 * Which media this deployment can actually serve.
 *
 * Exists because one medium (film & TV) is gated on a credential the client
 * cannot see. A medium whose key is absent is *hidden* rather than offered and
 * then failing at the first search — a picker tab that cannot work is worse than
 * one that is not there.
 *
 * Public: it leaks nothing but the shape of the build, and the game picker needs
 * it before a session exists.
 */
export async function GET(_req: NextRequest) {
  const available = availableMedia(process.env as Record<string, string | undefined>)
  return NextResponse.json({
    media: available,
    // The registry itself, so the client does not carry a second copy of the
    // labels and framing hints.
    registry: MEDIUM_LIST.filter(m => available.includes(m.id)),
  })
}
