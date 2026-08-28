-- Migration: piazza_stream post_no + endorsed, one row per contribution
-- (2026-08-23)
--
-- Adds the two columns the Piazza CSV upload now reads:
--   post_no   the Piazza post the contribution belongs to
--   endorsed  whether an instructor endorsed it (shown in Analytics)
--
-- and the unique index that turns the upload from a blind append into an
-- upsert. The insert in DBUserCourse::updatePiazzaStreamForCourse() targets
-- `on conflict (course_id, post_no, user_id, time)`, so it fails outright
-- until this index exists. NULLS NOT DISTINCT matters: rows whose post_no or
-- time could not be parsed still collapse to one row per contribution instead
-- of duplicating on every re-upload.
--
-- Dedupe: pre-existing rows were appended without any uniqueness, so a course
-- whose CSV was uploaded more than once has duplicates that would make the
-- index fail to build. Duplicates are deleted first, keeping the lowest id of
-- each group -- the rows differ only in id, since every column the index
-- compares is equal and the remaining columns come from the same CSV row.
--
-- Usage:
--   psql -U asci -d asci -f 2026-08-23-piazza-stream-contributions.sql
--
-- To preview what would be deleted, run this first:
--
--   SELECT course_id, post_no, user_id, time, COUNT(*)
--   FROM piazza_stream
--   GROUP BY course_id, post_no, user_id, time HAVING COUNT(*) > 1;
--
-- Run order: no dependency on the other migrations, though it pairs with
-- 2026-08-21-external-tool-piazza.sql.
--
-- ADD COLUMN puts post_no at the end of the table rather than mid-table where
-- init.sql declares it, so a migrated database and a fresh one differ in
-- column order. Harmless: every read and write of piazza_stream names its
-- columns. It is the only difference a pg_dump comparison of the two shows.
--
-- Idempotent: ADD COLUMN / CREATE INDEX are IF NOT EXISTS and a second run
-- finds nothing left to dedupe. The whole script runs in one transaction, so
-- a failed index build rolls the deletes back too.

BEGIN;

ALTER TABLE piazza_stream ADD COLUMN IF NOT EXISTS post_no INT;
ALTER TABLE piazza_stream ADD COLUMN IF NOT EXISTS endorsed BOOLEAN DEFAULT false;

-- Collapse duplicate contributions to the oldest row so the unique index can
-- build. IS NOT DISTINCT FROM matches the index's NULLS NOT DISTINCT
-- semantics, so rows that are both NULL in a column count as duplicates.
DELETE FROM piazza_stream dup
USING piazza_stream keep
WHERE dup.id > keep.id
  AND dup.course_id IS NOT DISTINCT FROM keep.course_id
  AND dup.post_no   IS NOT DISTINCT FROM keep.post_no
  AND dup.user_id   IS NOT DISTINCT FROM keep.user_id
  AND dup.time      IS NOT DISTINCT FROM keep.time;

CREATE UNIQUE INDEX IF NOT EXISTS piazza_stream_contribution_unique
ON piazza_stream (course_id, post_no, user_id, time) NULLS NOT DISTINCT;

COMMIT;
