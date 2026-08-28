-- Migration: canvas_lms_submissions table (2026-08-17)
--
-- Creates the table holding per-student submission results for the assignments
-- in canvas_lms_assignments, backing the Assessments and Analytics pages.
--
-- A row identifies its student by whichever side is known:
--   canvas_user_id  the Canvas-side user (always known for a synced row)
--   user_id         the ASCI user, once the roster resolves that Canvas user
-- The CHECK requires at least one of the two, and the two partial unique
-- indexes keep one submission per assignment per student on each side while
-- letting the not-yet-resolved half stay NULL without colliding.
--
-- ON DELETE RESTRICT on the assignment FK is deliberate: assignments that
-- vanish from Canvas are soft-deleted with missing_from_canvas_at rather than
-- removed, so a delete that would orphan submissions is a bug, not a cascade.
--
-- Originally shipped by editing init.sql directly, so databases initialized
-- before the Assessments page have no migration to create this table. This
-- file backfills that gap.
--
-- Usage:
--   psql -U asci -d asci -f 2026-08-17-canvas-lms-submissions.sql
--
-- Run order: after 2026-08-08-canvas-lms-assignments.sql (the FK references
-- canvas_lms_assignments). No ordering dependency with the piazza migrations.
--
-- Idempotent: CREATE TABLE / CREATE INDEX are IF NOT EXISTS, so a second run
-- (or a run against a database that already has the table) is a no-op. The
-- whole script runs in one transaction. Only needed for databases initialized
-- before the Assessments page; fresh installs get this table from init.sql.

BEGIN;

CREATE TABLE IF NOT EXISTS canvas_lms_submissions (
  id SERIAL PRIMARY KEY,
  canvas_lms_assignment_id INT NOT NULL,
  canvas_user_id TEXT,
  user_id INT,
  canvas_submission_id TEXT,
  score NUMERIC(6,2),
  submitted_at TIMESTAMP,
  lateness INTERVAL,
  workflow_state TEXT,
  attempt INT,
  source TEXT,
  last_synced_at TIMESTAMP,
  last_uploaded_at TIMESTAMP,
  CHECK (canvas_user_id IS NOT NULL OR user_id IS NOT NULL),
  FOREIGN KEY (canvas_lms_assignment_id) REFERENCES canvas_lms_assignments(id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS canvas_lms_submissions_canvas_user
ON canvas_lms_submissions (canvas_lms_assignment_id, canvas_user_id)
WHERE canvas_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS canvas_lms_submissions_asci_user
ON canvas_lms_submissions (canvas_lms_assignment_id, user_id)
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS canvas_lms_submissions_assignment
ON canvas_lms_submissions (canvas_lms_assignment_id);

CREATE INDEX IF NOT EXISTS canvas_lms_submissions_user
ON canvas_lms_submissions (user_id);

COMMIT;
