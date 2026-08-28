-- Migration: 'piazza' external tool (2026-08-21)
--
-- Adds 'piazza' to the external_tool enum so Piazza can be toggled per course
-- from the External Tools page like Canvas and Gradescope. The Piazza upload
-- moved out of Admin and behind this flag, and the Piazza analytics components
-- hide themselves when the tool is disabled.
--
-- Backfill: any course that already has Piazza data (a row in piazza_stream or
-- piazza_raw_stats) is treated as Piazza-enabled so the upload and analytics
-- keep working after the upgrade with no re-setup. Every other course starts
-- disabled, matching the default for a new course.
--
-- Usage:
--   psql -U asci -d asci -f 2026-08-21-external-tool-piazza.sql
--
-- Run order: after 2026-07-23-course-external-tools.sql, which creates the
-- external_tool enum and the course_external_tools table.
--
-- Two transactions on purpose: ALTER TYPE ... ADD VALUE cannot be *used* later
-- in the transaction that adds it, so the enum change must commit before the
-- backfill can insert rows naming 'piazza'.
--
-- Idempotent: ADD VALUE IF NOT EXISTS is a no-op once the value exists, and
-- the backfill uses ON CONFLICT (course_id, tool) DO NOTHING so a second run
-- neither errors nor overwrites a flag an instructor may have since toggled.
-- Only needed for databases initialized before Piazza became a togglable tool;
-- fresh installs get the enum value from init.sql.

BEGIN;

ALTER TYPE external_tool ADD VALUE IF NOT EXISTS 'piazza';

COMMIT;

BEGIN;

-- Backfill Piazza as enabled for every course that already has Piazza data.
-- 'piazza' is cast explicitly: the UNION below resolves the select list's
-- types on its own, before the INSERT gets a chance to coerce a bare literal
-- to the target column's enum.
INSERT INTO course_external_tools (course_id, tool, enabled)
SELECT course_id, 'piazza'::external_tool, true
FROM (
  SELECT course_id FROM piazza_stream
  UNION
  SELECT course_id FROM piazza_raw_stats
) piazza_courses
WHERE course_id IS NOT NULL
ON CONFLICT (course_id, tool) DO NOTHING;

COMMIT;
