import { redirect } from 'next/navigation'

/**
 * `/listen` is where this section lived when it was music-only.
 *
 * Sessions deep-link as `?game=<uuid>`, so the query string has to survive the
 * redirect or every link anyone has saved lands on the picker instead of their
 * game. A server redirect rather than a client one, so a shared link never renders
 * the old page for a frame.
 *
 * `searchParams` is a plain object here, not a promise — that is the Next 14
 * signature. It became a promise in 15, so this is the one line in the section that
 * has to change on that upgrade.
 */
export const dynamic = 'force-dynamic'

export default function ListenRedirect({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(searchParams ?? {})) {
    if (typeof v === 'string') qs.set(k, v)
    else if (Array.isArray(v) && v[0]) qs.set(k, v[0])
  }
  const query = qs.toString()
  redirect(query ? `/play?${query}` : '/play')
}
