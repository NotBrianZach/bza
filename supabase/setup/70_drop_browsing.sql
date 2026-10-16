-- Drop the browsing/neko tables. The feature is gone, and it was already dead.
--
-- ── IT WAS NOT WORKING BEFORE THIS ────────────────────────────────────────
--
-- NEKO_MGR_URL pointed at https://browser.aireadalong.com, which has no DNS
-- record on the zone at all -- the records are the apex, www, three MX, a TXT,
-- a DKIM key and math-worker. So every browser-session route called a hostname
-- that does not resolve. This removal is cleanup of dead code, not the
-- retirement of a working feature.
--
-- ── WHAT WENT WITH IT ─────────────────────────────────────────────────────
--
-- 15 frontend files, ~1,750 lines: the /site page, SitePanel and its sidebar,
-- WorkspaceEditor, SessionCard, lib/browser/{provider,nekoProvider}, and eight
-- routes under /api/browser-session. app/dashboard/page.tsx survives -- it is
-- the library dashboard, not the browsing page -- with its session list, fetch
-- and card branch taken out.
--
-- Seven npm dependencies went too (@replit/codemirror-{emacs,vim},
-- @uiw/react-codemirror, @codemirror/{lang-markdown,state,view}, codemirror):
-- WorkspaceEditor was the only consumer of all of them. @codemirror/state
-- already had none. One of those is @replit/codemirror-emacs, whose missing
-- package-lock entry broke every bza deploy earlier the same day -- the fix for
-- that, and now the dependency itself, both gone.
--
-- Also retired: the NEKO_MGR_TOKEN, NEKO_MGR_URL and HYPERBEAM_API_KEY secrets,
-- which the deploy pushed into the Cloudflare Worker on every release, and the
-- neko-remote NixOS host.
--
-- ── THE DATA ──────────────────────────────────────────────────────────────
--
-- 21 browser_sessions, 3 bookmarks, 3 extractions, 0 chats. Small, and dumped
-- before this ran -- schema and data both -- to
-- ~/.local/share/bza-retired/browsing-neko/. Restoring means replaying
-- browsing-schema.sql then browsing-data.sql; nothing here is unrecoverable.
--
-- Order matters: the three child tables reference browser_sessions, so they go
-- first. CASCADE is deliberately NOT used -- if something outside this set
-- turns out to reference these tables, the drop should fail loudly rather than
-- quietly take that something with it.

drop table if exists bza_public.browser_session_chats;
drop table if exists bza_public.browser_session_bookmarks;
drop table if exists bza_public.browser_extractions;
drop table if exists bza_public.browser_sessions;

-- ── AFTER ─────────────────────────────────────────────────────────────────
--
--   select count(*) from information_schema.tables
--    where table_schema='bza_public' and table_name like 'browser%';
--   → 0
--
-- supabase/setup/00_baseline_bza_public.sql still contains them: it is a
-- snapshot of the schema as it was at the cutover, and regenerating it is a
-- deliberate act (see its header). It will stop containing them the next time
-- it is regenerated, which is correct -- a baseline describes a moment, and
-- this migration is what moves the schema past that moment.
