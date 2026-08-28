-- Migration: unique computing_id (2026-07-16)
--
-- Merges duplicate users rows that share a computing_id (case-insensitively),
-- normalizes all stored computing_ids to lowercase, and adds a case-insensitive
-- unique index so duplicate users can never be created again.
--
-- Usage:
--   psql -U asci -d asci -f 2026-07-16-users-computing-id-unique.sql
--
-- Run order: 2026-07-14-primary-instructor.sql must be applied first (this
-- script's merge heuristics reference the 'primary_instructor' role by text,
-- so it parses without it, but the sync code deployed alongside this
-- migration requires the enum value and index from the 2026-07-14 file).
--
-- The whole script runs in a single transaction: it either fully succeeds or
-- leaves the database untouched. Idempotent: a second run merges nothing and
-- changes nothing.
--
-- To preview what would be merged, run this first:
--
--   SELECT LOWER(computing_id) AS cid, COUNT(*), array_agg(id ORDER BY id)
--   FROM users WHERE computing_id IS NOT NULL
--   GROUP BY LOWER(computing_id) HAVING COUNT(*) > 1;
--
-- Merge rules (per duplicate group; survivor = lowest users.id):
--   user_courses               keep the higher-privilege role on collision
--   user_quests                keep the more-completed status on collision
--   canvas_lms_access_tokens   survivor's token wins; adopt dup's if none
--   queue, logs, submissions, ta_activity, session_users, survey,
--   piazza_stream, piazza_raw_stats   repointed to the survivor
-- NULL computing_ids are never merged or modified.

BEGIN;

DO $$
DECLARE
  grp RECORD;
  dup RECORD;
  enr RECORD;
  q RECORD;
BEGIN
  FOR grp IN
    SELECT LOWER(computing_id) AS cid, MIN(id) AS survivor_id
    FROM users
    WHERE computing_id IS NOT NULL
    GROUP BY LOWER(computing_id)
    HAVING COUNT(*) > 1
  LOOP
    FOR dup IN
      SELECT id FROM users
      WHERE LOWER(computing_id) = grp.cid AND id <> grp.survivor_id
      ORDER BY id
    LOOP
      RAISE NOTICE 'merging duplicate user % into survivor % (computing_id: %)',
        dup.id, grp.survivor_id, grp.cid;

      -- user_courses: resolve collisions (both enrolled in the same course),
      -- deleting the dup row before any role upgrade so the one-primary-per-
      -- course partial index is never transiently violated.
      FOR enr IN
        SELECT d.course_id, d.role AS dup_role, s.role AS surv_role
        FROM user_courses d
        JOIN user_courses s
          ON s.course_id = d.course_id AND s.user_id = grp.survivor_id
        WHERE d.user_id = dup.id
      LOOP
        DELETE FROM user_courses
        WHERE user_id = dup.id AND course_id = enr.course_id;

        IF (CASE enr.dup_role::text
              WHEN 'student' THEN 1 WHEN 'ta' THEN 2
              WHEN 'instructor' THEN 3 WHEN 'primary_instructor' THEN 4
              ELSE 0 END)
         > (CASE enr.surv_role::text
              WHEN 'student' THEN 1 WHEN 'ta' THEN 2
              WHEN 'instructor' THEN 3 WHEN 'primary_instructor' THEN 4
              ELSE 0 END) THEN
          UPDATE user_courses SET role = enr.dup_role
          WHERE user_id = grp.survivor_id AND course_id = enr.course_id;
        END IF;
      END LOOP;

      UPDATE user_courses SET user_id = grp.survivor_id
      WHERE user_id = dup.id;

      -- user_quests: same pattern; "more completed" by explicit rank (the
      -- enum's declared order would wrongly rank 'Completed - Pending
      -- Approval' above 'Completed').
      FOR q IN
        SELECT d.quest_id, d.course_id, d.status AS dup_status, s.status AS surv_status
        FROM user_quests d
        JOIN user_quests s
          ON s.quest_id = d.quest_id AND s.course_id = d.course_id
         AND s.user_id = grp.survivor_id
        WHERE d.user_id = dup.id
      LOOP
        DELETE FROM user_quests
        WHERE user_id = dup.id AND quest_id = q.quest_id AND course_id = q.course_id;

        IF (CASE q.dup_status::text
              WHEN 'Locked' THEN 0 WHEN 'Not started' THEN 1
              WHEN 'In progress' THEN 2 WHEN 'Completed - Pending Approval' THEN 3
              WHEN 'Completed' THEN 4 ELSE 0 END)
         > (CASE q.surv_status::text
              WHEN 'Locked' THEN 0 WHEN 'Not started' THEN 1
              WHEN 'In progress' THEN 2 WHEN 'Completed - Pending Approval' THEN 3
              WHEN 'Completed' THEN 4 ELSE 0 END) THEN
          UPDATE user_quests SET status = q.dup_status
          WHERE user_id = grp.survivor_id AND quest_id = q.quest_id AND course_id = q.course_id;
        END IF;
      END LOOP;

      UPDATE user_quests SET user_id = grp.survivor_id
      WHERE user_id = dup.id;

      -- canvas_lms_access_tokens (PK user_id): survivor's token wins.
      IF EXISTS (SELECT 1 FROM canvas_lms_access_tokens WHERE user_id = grp.survivor_id) THEN
        DELETE FROM canvas_lms_access_tokens WHERE user_id = dup.id;
      ELSE
        UPDATE canvas_lms_access_tokens SET user_id = grp.survivor_id
        WHERE user_id = dup.id;
      END IF;

      -- Repoint-only tables (no per-user uniqueness).
      UPDATE queue            SET user_id = grp.survivor_id WHERE user_id = dup.id;
      UPDATE logs             SET user_id = grp.survivor_id WHERE user_id = dup.id;
      UPDATE submissions      SET user_id = grp.survivor_id WHERE user_id = dup.id;
      UPDATE ta_activity      SET user_id = grp.survivor_id WHERE user_id = dup.id;
      UPDATE session_users    SET user_id = grp.survivor_id WHERE user_id = dup.id;
      UPDATE survey           SET user_id = grp.survivor_id WHERE user_id = dup.id;
      UPDATE piazza_stream    SET user_id = grp.survivor_id WHERE user_id = dup.id;
      UPDATE piazza_raw_stats SET user_id = grp.survivor_id WHERE user_id = dup.id;

      DELETE FROM users WHERE id = dup.id;
    END LOOP;
  END LOOP;
END
$$;

UPDATE users SET computing_id = LOWER(computing_id)
WHERE computing_id IS NOT NULL AND computing_id <> LOWER(computing_id);

CREATE UNIQUE INDEX IF NOT EXISTS users_computing_id_lower_unique
ON users (LOWER(computing_id));

COMMIT;
