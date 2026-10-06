-- Migration: course_settings.queue_enabled (2026-10-06)
--
-- Lets instructors turn the office-hours Queue on or off per course, the same
-- way llm_enabled controls the LLM Chat Bot. When false, the Queue nav link and
-- the home page "Join Queue" card are hidden.
--
-- Defaults to true so existing courses keep their queue.
--
-- Usage:
--   psql -U asci -d asci -f 2026-10-06-queue-enabled.sql
--
-- Idempotent: ADD COLUMN IF NOT EXISTS is a no-op on a second run. Only needed
-- for databases initialized before this migration; fresh installs get the
-- column from init.sql.

BEGIN;

ALTER TABLE course_settings ADD COLUMN IF NOT EXISTS queue_enabled BOOL DEFAULT (true);

COMMIT;
