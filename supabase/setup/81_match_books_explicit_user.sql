-- 81_match_books_explicit_user.sql — scope the match by argument, not only by RLS.
--
-- Migration 80 shipped `match_books` as `security invoker` and said RLS would
-- scope it. That is true of a browser calling with the user's JWT and FALSE of
-- the only caller that matters here.
--
-- Every server route in this app builds a SERVICE-ROLE client. The reason is
-- recorded in generate-image: the new Supabase key format uses ES256, and
-- forwarding user JWTs to PostgREST for RLS does not work with it, so the app
-- "enforce[s] data isolation explicitly via user_id filters on every query".
-- Under that client RLS is bypassed and `auth.uid()` is null — so the
-- librarian runner, which is a server route, would have ranked one user's
-- query against EVERY user's library.
--
-- Nothing had been built on it yet, which is the only reason this is a
-- follow-up migration rather than an incident.
--
-- ── WHY BOTH, AND NOT JUST THE ARGUMENT ───────────────────────────────────
--
-- The explicit `match_user_id` filter is what makes it safe under the service
-- role. `security invoker` STAYS so that a direct call from the browser is
-- still scoped by RLS on top: a caller who passes somebody else's id gets
-- nothing, because the policy also has to pass. Defence that only works in
-- one of the two call paths is the thing that went wrong the first time.
--
-- The parameter is deliberately NOT defaulted. A default would make the unsafe
-- call the short one, and the whole failure above was an unsafe call that
-- looked complete.

drop function if exists bza_public.match_books(extensions.vector, text, int, double precision);

create or replace function bza_public.match_books(
  match_user_id uuid,
  query_embedding extensions.vector(1536),
  match_model text,
  match_count int default 5,
  frecency_weight double precision default 0.25
)
returns table (
  book_id bigint,
  title text,
  similarity double precision,
  frecency double precision,
  score double precision
)
language sql
stable
security invoker
set search_path = bza_public, extensions, public
as $$
  with scored as (
    select
      e.book_id,
      f.title,
      1 - (e.embedding <=> query_embedding) as similarity,
      coalesce(f.frecency, 0) as frecency,
      max(coalesce(f.frecency, 0)) over () as max_frecency
    from bza_public.book_embeddings e
    join bza_public.book_frecency f
      on f.book_id = e.book_id
     -- Both sides, because a book and its embedding each carry a user_id and
     -- trusting one of them is how a join quietly widens.
     and f.user_id = e.user_id
    where e.model = match_model
      and e.user_id = match_user_id
  )
  select
    book_id,
    title,
    similarity,
    frecency,
    (1 - frecency_weight) * similarity
      + frecency_weight * (case when max_frecency > 0 then frecency / max_frecency else 0 end)
      as score
  from scored
  order by score desc
  limit match_count;
$$;

comment on function bza_public.match_books is
  'Rank one user''s books against a query vector, blending cosine similarity '
  'with normalised frecency. Scoped TWICE on purpose: match_user_id filters '
  'explicitly, which is what makes it safe under the service-role client every '
  'server route uses, and security invoker keeps RLS applying on top for a '
  'direct call from the browser.';

grant execute on function bza_public.match_books to authenticated;
