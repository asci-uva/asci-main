-- Migration: course_external_tools.last_uploaded_at (2026-10-06)
--
-- Records when a tool's data was last uploaded for a course, the upload
-- counterpart of Canvas's last_synced_at. Stamped by the Gradescope CSV upload
-- (uploadGradescopeSubmissions) and the Piazza export upload (uploadPiazza),
-- and shown on the External Tools page and in the student Analytics view.
--
-- NULL means nothing has been uploaded since this column was added. Courses
-- that uploaded before the migration show "Never" until their next upload;
-- there is no reliable upload time to backfill from.
--
-- Usage:
--   psql -U asci -d asci -f 2026-10-06-external-tool-last-uploaded.sql
--
-- Run order: after 2026-07-23-course-external-tools.sql, which creates the
-- course_external_tools table.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS is a no-op on a second run. Only needed
-- for databases initialized before this migration; fresh installs get the
-- column from init.sql.

BEGIN;

ALTER TABLE course_external_tools ADD COLUMN IF NOT EXISTS last_uploaded_at TIMESTAMP;

COMMIT;
