-- Migration: Canvas autosync columns (2026-06-26)
--
-- Adds the roster-autosync bookkeeping columns to canvas_lms_courses:
--   last_synced_at    when the roster was last synced (NULL = never)
--   stale_period      how long a sync stays "fresh" before autosync re-runs
--   autosync_enabled  whether the course autosyncs on page load
--
-- Originally shipped by editing init.sql directly, so databases that had the
-- base canvas_lms_courses table but predate the autosync feature have no
-- migration to add these columns. This file backfills that gap.
--
-- Usage:
--   psql -U asci -d asci -f 2026-06-26-canvas-autosync-columns.sql
--
-- Run order: after 2026-06-10-canvas-lms-tables.sql (which creates
-- canvas_lms_courses) and before 2026-07-14-primary-instructor.sql.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS makes a second run (or a run against a
-- database that already has these columns) a no-op. The NOT NULL columns take
-- their DEFAULT for any existing rows. The whole script runs in one
-- transaction. Only needed for databases initialized before the autosync
-- feature; fresh installs get these columns from init.sql.

BEGIN;

ALTER TABLE canvas_lms_courses ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;
ALTER TABLE canvas_lms_courses ADD COLUMN IF NOT EXISTS stale_period INTERVAL NOT NULL DEFAULT '7 days';
ALTER TABLE canvas_lms_courses ADD COLUMN IF NOT EXISTS autosync_enabled BOOLEAN NOT NULL DEFAULT false;

COMMIT;
