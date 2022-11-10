CREATE SCHEMA "oh";

CREATE SCHEMA "session";

CREATE TYPE "oh"."roles" AS ENUM (
  'student',
  'instructor',
  'ta'
);

CREATE TYPE "session"."status" AS ENUM (
  'waiting',
  'in_progress',
  'completed'
);

CREATE TABLE "oh"."users" (
  "id" SERIAL PRIMARY KEY,
  "computing_id" CHAR(6),
  "first_name" TEXT,
  "last_name" TEXT,
  "preferred_name" TEXT,
  "password" CHAR(64)
);

CREATE TABLE "oh"."user_courses" (
  "user_id" INT,
  "course_id" INT,
  "role" oh.roles,
  PRIMARY KEY ("user_id", "course_id")
);

CREATE TABLE "oh"."courses" (
  "id" INT PRIMARY KEY,
  "mnemonic" VARCHAR(10),
  "number" SMALLINT,
  "name" TEXT,
  "semester" TEXT
);

CREATE TABLE "session"."users" (
  "session_id" INT PRIMARY KEY,
  "user_id" INT,
  "role" oh.roles
);

CREATE TABLE "session"."sessions" (
  "id" INT PRIMARY KEY,
  "course_id" INT,
  "issue" TEXT,
  "issue_subject" TEXT,
  "status" session.status,
  "entry_time" timestamp,
  "fulfillment_time" timestamp,
  "exit_time" timestamp
);

CREATE TABLE "session"."feedback" (
  "session_id" INT PRIMARY KEY,
  "user_id" INT,
  "role" oh.roles,
  "rating" INT,
  "feedback" TEXT
);

CREATE TABLE "session"."logs" (
  "session_id" INT PRIMARY KEY,
  "action" TEXT,
  "timestamp" timestamp DEFAULT (now())
);

ALTER TABLE "oh"."user_courses" ADD FOREIGN KEY ("user_id") REFERENCES "oh"."users" ("id");

ALTER TABLE "session"."users" ADD FOREIGN KEY ("user_id") REFERENCES "oh"."users" ("id");

ALTER TABLE "session"."feedback" ADD FOREIGN KEY ("user_id") REFERENCES "oh"."users" ("id");

ALTER TABLE "oh"."user_courses" ADD FOREIGN KEY ("course_id") REFERENCES "oh"."courses" ("id");

ALTER TABLE "session"."sessions" ADD FOREIGN KEY ("course_id") REFERENCES "oh"."courses" ("id");

ALTER TABLE "session"."logs" ADD FOREIGN KEY ("session_id") REFERENCES "session"."sessions" ("id");

ALTER TABLE "session"."users" ADD FOREIGN KEY ("session_id") REFERENCES "session"."sessions" ("id");

ALTER TABLE "session"."feedback" ADD FOREIGN KEY ("session_id") REFERENCES "session"."sessions" ("id");
