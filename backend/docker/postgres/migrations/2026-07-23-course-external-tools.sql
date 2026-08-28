-- Migration: course_external_tools table (2026-07-23)
--
-- Adds the per-tool enable-flag table backing the "External Tools" redo. Each
-- row is a (course_id, tool) pair whose `enabled` flag is the first gate
-- consulted before any of that tool's features run.
-- This table is a pure registry: per-tool settings live in that tool's own
-- typed table (e.g. canvas_lms_courses), not here, and secure data (e.g. Canvas
-- access tokens) stays in its own table.
--
-- Backfill: any course that already has a linked Canvas course (a row in
-- canvas_lms_courses) is treated as Canvas-enabled so the tool keeps
-- working after the upgrade with no re-setup. Every other tool (including
-- Gradescope) starts disabled. New courses default all tools disabled.
--
-- Usage:
--   psql -U asci -d asci -f 2026-07-23-course-external-tools.sql
--
-- Run order: depends on canvas_lms_courses existing, so it must run after
-- 2026-06-10-canvas-lms-tables.sql. No ordering dependency with the other
-- migrations.
--
-- Idempotent: the legacy-rename block only fires when the pre-rename names are
-- actually present, the external_tool enum is created only if absent (CREATE
-- TYPE has no IF NOT EXISTS, so it is guarded by a DO block that swallows
-- duplicate_object), CREATE TABLE IF NOT EXISTS makes re-creation a no-op, and
-- the backfill uses ON CONFLICT (course_id, tool) DO NOTHING so a second run
-- neither errors nor overwrites a flag an instructor may have since toggled.
-- The whole script runs in one transaction. Only needed for databases
-- initialized before this migration; fresh installs get the type + table from
-- init.sql.
--
-- Adding a future tool: extend the enum with
--   ALTER TYPE external_tool ADD VALUE IF NOT EXISTS '<tool>';
-- in that tool's migration (mirrors 2026-07-14-primary-instructor.sql). Note
-- ALTER TYPE ... ADD VALUE cannot be used later in the same transaction, so such
-- a migration must commit the new value before inserting rows that reference it.

BEGIN;

-- An earlier revision of this migration named the type `integration_tool` and
-- the table `course_integrations`. Rename them (and the constraint names
-- Postgres derived from the old table name) in place so a database that ran
-- that revision converts, keeping its rows, instead of ending up with both the
-- old and the new object. Every check is guarded, so this whole block is a
-- no-op on a fresh database or on one already using the new names.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'integration_tool') THEN
    ALTER TYPE integration_tool RENAME TO external_tool;
  END IF;

  IF to_regclass('course_integrations') IS NOT NULL THEN
    ALTER TABLE course_integrations RENAME TO course_external_tools;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'course_integrations_pkey') THEN
      ALTER TABLE course_external_tools
        RENAME CONSTRAINT course_integrations_pkey TO course_external_tools_pkey;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'course_integrations_course_id_fkey') THEN
      ALTER TABLE course_external_tools
        RENAME CONSTRAINT course_integrations_course_id_fkey TO course_external_tools_course_id_fkey;
    END IF;
  END IF;
END
$$;

-- Create the external_tool enum if it does not already exist.
DO $$
BEGIN
  CREATE TYPE external_tool AS ENUM ('canvas', 'gradescope');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS course_external_tools (
  course_id  INT  NOT NULL REFERENCES courses(id),
  tool       external_tool NOT NULL,
  enabled    BOOL NOT NULL DEFAULT false,
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (course_id, tool)
);

-- Backfill Canvas as enabled for every course with a linked Canvas course.
INSERT INTO course_external_tools (course_id, tool, enabled)
SELECT clc.asci_course_id, 'canvas', true
FROM canvas_lms_courses clc
ON CONFLICT (course_id, tool) DO NOTHING;

COMMIT;
