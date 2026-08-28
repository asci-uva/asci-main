-- Migration: primary_instructor role (2026-07-14)
--
-- Adds the 'primary_instructor' value to the roles enum, promotes the
-- lowest-user_id instructor of each course that has no primary instructor,
-- and enforces at most one primary instructor per course.
--
-- Usage:
--   psql -U asci -d asci -f 2026-07-14-primary-instructor.sql
--
-- IMPORTANT: do NOT run this file with `psql --single-transaction` and do not
-- wrap it in BEGIN/COMMIT. A value added to an enum cannot be used inside the
-- same transaction that added it (Postgres: "unsafe use of new value of enum
-- type"), so the ALTER TYPE below must commit before the backfill UPDATE.
-- Plain `psql -f` autocommits each statement, which is exactly what we need;
-- if run with --single-transaction the script fails cleanly with zero rows
-- changed.
--
-- Idempotent: safe to re-run. The ALTER uses IF NOT EXISTS, the backfill
-- skips courses that already have a primary instructor, and the index uses
-- IF NOT EXISTS.
--
-- Only needed for databases initialized before commit 1ecddb2e5; fresh
-- installs get all of this from init.sql.

ALTER TYPE roles ADD VALUE IF NOT EXISTS 'primary_instructor';

UPDATE user_courses uc
SET role = 'primary_instructor'
WHERE uc.role = 'instructor'
  AND uc.user_id = (
    SELECT MIN(uc2.user_id) FROM user_courses uc2
    WHERE uc2.course_id = uc.course_id AND uc2.role = 'instructor'
  )
  AND NOT EXISTS (
    SELECT 1 FROM user_courses p
    WHERE p.course_id = uc.course_id AND p.role = 'primary_instructor'
  );

CREATE UNIQUE INDEX IF NOT EXISTS user_courses_one_primary_instructor
ON user_courses (course_id)
WHERE role = 'primary_instructor';
