-- Migration: canvas_lms_assignments table (2026-08-08)
--
-- Creates the table holding the assignments pulled from a linked Canvas
-- course. One row per (ASCI course, Canvas assignment); the Canvas-side id is
-- kept as TEXT because Canvas ids are opaque and only unique per instance.
--
--   missing_from_canvas_at  stamped when a sync no longer sees the assignment
--                           in Canvas, cleared when it reappears (soft delete,
--                           so a transient Canvas hiccup never drops rows that
--                           canvas_lms_submissions still points at)
--
-- Originally shipped by editing init.sql directly, so databases initialized
-- before the assignments sync have no migration to create this table. This
-- file backfills that gap. The missing_from_canvas_at column shipped a little
-- later than the rest of the table, so it is also added separately below for
-- databases that have the table without it.
--
-- Usage:
--   psql -U asci -d asci -f 2026-08-08-canvas-lms-assignments.sql
--
-- Run order: after 2026-06-10-canvas-lms-tables.sql (the FK references
-- canvas_lms_courses) and before 2026-08-17-canvas-lms-submissions.sql (whose
-- FK references this table).
--
-- Idempotent: CREATE TABLE / CREATE INDEX / ADD COLUMN are all IF NOT EXISTS,
-- so a second run (or a run against a database that already has the table) is
-- a no-op. The whole script runs in one transaction. Only needed for databases
-- initialized before the assignments sync; fresh installs get this table from
-- init.sql.

BEGIN;

CREATE TABLE IF NOT EXISTS canvas_lms_assignments (
  id SERIAL PRIMARY KEY,
  asci_course_id INT NOT NULL,
  canvas_assignment_id TEXT NOT NULL,
  canvas_assignment_group_id TEXT,
  name TEXT,
  description TEXT,
  html_url TEXT,
  due_at TIMESTAMP,
  unlock_at TIMESTAMP,
  lock_at TIMESTAMP,
  points_possible FLOAT,
  grading_type TEXT,
  submission_types TEXT[],
  allowed_attempts INT,
  position INT,
  published BOOLEAN,
  workflow_state TEXT,
  omit_from_final_grade BOOLEAN,
  canvas_created_at TIMESTAMP,
  canvas_updated_at TIMESTAMP,
  last_synced_at TIMESTAMP,
  missing_from_canvas_at TIMESTAMP,
  UNIQUE (asci_course_id, canvas_assignment_id),
  FOREIGN KEY (asci_course_id) REFERENCES canvas_lms_courses(asci_course_id)
);

-- For databases that created the table before the soft-delete stamp existed.
ALTER TABLE canvas_lms_assignments
  ADD COLUMN IF NOT EXISTS missing_from_canvas_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS canvas_lms_assignments_course
ON canvas_lms_assignments (asci_course_id);

COMMIT;
