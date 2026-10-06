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
 */
export const dbSchema = { db: { schema: DB_SCHEMA } } as const

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
