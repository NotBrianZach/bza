/**
 * Which Postgres schema the application lives in.
 *
 * Everything moved out of `public` and into `bza_public` — see
 * supabase/setup/57_move_public_to_bza_public.sql for the move and why it was
 * worth doing. Two tables stayed behind (`_applied_migrations`,
 * `_schema_migrations`), and scripts/db-migrate.sh addresses those with an
 * explicit `public.` prefix, so nothing here concerns them.
 *
 * The reason this is a constant and not a string literal typed 44 times: a
 * client pointed at the wrong schema does not error. PostgREST resolves
 * `.from('books')` against whatever the client's default schema is, finds
 * nothing there, and returns an empty result set with a 200. A missed site
 * therefore reads as "this user has no books" rather than as a bug, which is
 * the worst possible failure mode for a cutover touching every table at once.
 *
 * `tests/supabase-schema.mjs` asserts that every client construction in the
 * tree either uses `DB_SCHEMA` or is explicitly exempted with a reason. That
 * test is the actual safeguard; this file just gives it something to look for.
 */

export const DB_SCHEMA = 'bza_public' as const

/**
 * The options fragment every data-reading client needs.
 *
 * Spread it rather than assigning it, so a site that already passes `auth`,
 * `cookies` or `global` options keeps them:
 *
 *     createClient(url, key, { ...dbSchema, auth: { persistSession: false } })
 *
 * On the SERVER, prefer `serverData` below — it is this plus a no-store fetch,
 * and the fetch half is not optional. `dbSchema` alone is right only for the
 * browser client.
 */
export const dbSchema = { db: { schema: DB_SCHEMA } } as const

/**
 * The options fragment every SERVER-SIDE client needs, for a different reason.
 *
 * supabase-js issues its queries through the GLOBAL `fetch`, and Next
 * instruments that fetch with its own data cache. Two identical PostgREST GETs
 * in one deployment can therefore be served from a response captured earlier —
 * including one captured before a write that has since landed.
 *
 * Caught in production code on 2026-10-21. `/api/suggest/digest` was called
 * before any digest existed, PostgREST correctly returned an empty set, and
 * Next cached it against that URL. A digest was then built and stored — one
 * row, sixteen item rows, confirmed in psql — and every later read returned
 * the cached empty set, so `/api/suggest/metrics` reported "no digest has been
 * generated yet" while the digest sat in the table.
 *
 * ── Why this is the same hazard DB_SCHEMA guards against ──────────────────
 *
 * There is **no error at any layer.** PostgREST answers 200, supabase-js
 * returns `{data: null, error: null}`, and `maybeSingle()` on an empty set is
 * legitimately null. Every layer reports success. That is exactly the failure
 * shape described at the top of this file for a client pointed at the wrong
 * schema: a wrong read comes back empty rather than throwing, so "this user has
 * nothing" and "this read was served from a stale cache" look identical.
 *
 * Which is why it lives here, next to `dbSchema`, and why
 * tests/supabase-schema.mjs checks for it the same way: the invariant cannot be
 * "we remembered at 33 sites."
 *
 * ── What does NOT fix it ──────────────────────────────────────────────────
 *
 * `export const dynamic = 'force-dynamic'` on the route. That stops the
 * route's own render from being cached and says nothing whatsoever about
 * fetches made inside it. Do not be reassured by seeing it at the top of a
 * file.
 *
 * ── Why it is safe everywhere ─────────────────────────────────────────────
 *
 * There is no case where Next's opaque data cache in front of PostgREST is
 * wanted without an explicit decision. Writes are not cached by Next anyway,
 * so adding this to a write-only client costs nothing; reads are the ones at
 * risk. Caching a Supabase read is a thing to opt into deliberately, with
 * `cache-exempt:` and a reason — not the default you inherit by forgetting.
 *
 * NOT needed for `createBrowserClient`: there is no Next fetch cache in a
 * browser.
 */
export const noStoreFetch = {
  global: {
    fetch: (input: RequestInfo | URL, init?: RequestInit) =>
      fetch(input, { ...init, cache: 'no-store' as RequestCache }),
  },
} as const

/**
 * Both fragments at once, for a server-side data client.
 *
 * Spread FIRST in the options object so a site that passes its own `global`
 * or `db` can still override — the explicit thing a call site wrote should win
 * over a default it inherited:
 *
 *     createClient(url, key, { ...serverData, auth: { persistSession: false } })
 */
export const serverData = { ...dbSchema, ...noStoreFetch } as const

/**
 * The same thing for code that talks to PostgREST by hand.
 *
 * `db.schema` above is a supabase-js setting: it only affects requests the
 * client builds. A raw `fetch(`${url}/rest/v1/books`)` has no client, so it
 * resolves against the server's default schema no matter what any client
 * nearby is configured to do. Several routes read this way to avoid pulling
 * supabase-js into an edge bundle, and `scripts/reconcile-overages.sh` calls
 * the billing RPC with curl — none of those are reached by the client change.
 *
 * PostgREST takes the schema from a header, and which header depends on the
 * verb: `Accept-Profile` for GET/HEAD, `Content-Profile` for POST/PATCH/PUT/
 * DELETE. Both are sent on every request here on purpose. Choosing per call
 * site means getting it right 14 times and re-deciding it on every new one,
 * and a GET that sends only Content-Profile reads `public` silently. PostgREST
 * ignores whichever header does not apply to the verb.
 *
 * Spread into an existing headers object:
 *
 *     headers: { ...schemaHeaders, apikey: key, Authorization: `Bearer ${key}` }
 */
export const schemaHeaders = {
  'Accept-Profile': DB_SCHEMA,
  'Content-Profile': DB_SCHEMA,
} as const
