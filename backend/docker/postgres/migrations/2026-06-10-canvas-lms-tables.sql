-- Migration: Canvas LMS base tables (2026-06-10)
--
-- Creates the two tables the Canvas LMS external tool depends on:
--   canvas_lms_access_tokens  per-user encrypted Canvas API token
--   canvas_lms_courses        link between an ASCI course and a Canvas course
--
-- These tables were originally introduced by editing init.sql directly (the
-- project had no standalone migrations at the time), so databases initialized
-- before the Canvas external tool have no migration to create them. This file
-- backfills that gap. The autosync columns on canvas_lms_courses are added
-- separately by 2026-06-26-canvas-autosync-columns.sql (kept split to mirror
-- the order the columns actually shipped).
--
-- Usage:
--   psql -U asci -d asci -f 2026-06-10-canvas-lms-tables.sql
--
-- Run order: this is the earliest migration in the chain. It must run before
-- 2026-06-26-canvas-autosync-columns.sql and before
-- 2026-07-16-users-computing-id-unique.sql, whose dedupe step references
-- canvas_lms_access_tokens.
--
-- Idempotent: CREATE TABLE IF NOT EXISTS makes a second run (or a run against
-- a database that already has these tables) a no-op. The whole script runs in
-- one transaction. Only needed for databases initialized before the Canvas
-- external tool; fresh installs get these tables from init.sql.

BEGIN;

CREATE TABLE IF NOT EXISTS canvas_lms_access_tokens (
  user_id INT PRIMARY KEY,
  access_token TEXT,
  access_token_iv TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS canvas_lms_courses (
  asci_course_id INT PRIMARY KEY,
  canvas_course_id TEXT,
  name TEXT,
  course_code TEXT,
  FOREIGN KEY (asci_course_id) REFERENCES courses(id)
);

COMMIT;
