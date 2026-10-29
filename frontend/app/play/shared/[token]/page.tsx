import SharedChain from './SharedChain'

/**
 * A server shell whose only job is to await `params`.
 *
 * This was one client component that did `const { token } = use(params)`, which
 * built fine and then returned 500 on every request. `use()` on a promise
 * *suspends*, and a client component that suspends during the server render with
 * no Suspense boundary above it throws — so the page could never render, not even
 * its own not-found state.
 *
 * Awaiting in a server component removes the suspension rather than catching it.
 * The alternative — wrapping the client tree in `<Suspense>`, which is what
 * /play does for `useSearchParams` — would also work and is strictly worse here:
 * it would make a loading state exist for a value that is already known before
 * any rendering starts.
 *
 * Nothing else lives here. The chain itself needs state, effects and an audio
 * element, so it stays a client component; this file is the boundary between
 * "what was in the URL" and everything that needs a browser.
 */
export default async function SharedChainPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  return <SharedChain token={token} />
}
