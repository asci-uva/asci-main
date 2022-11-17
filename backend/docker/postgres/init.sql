CREATE TYPE "roles" AS ENUM (
  'student',
  'instructor',
  'ta'
);

CREATE TYPE "status" AS ENUM (
  'waiting',
  'in_progress',
  'completed'
);

CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "computing_id" VARCHAR(7),
  "first_name" TEXT,
  "last_name" TEXT,
  "preferred_name" TEXT,
  "password" CHAR(64)
);

CREATE TABLE "user_courses" (
  "user_id" INT,
  "course_id" INT,
  "role" roles,
  PRIMARY KEY ("user_id", "course_id")
);

CREATE TABLE "courses" (
  "id" INT PRIMARY KEY,
  "mnemonic" VARCHAR(10),
  "number" SMALLINT,
  "name" TEXT,
  "semester" TEXT
);

CREATE TABLE "users" (
  "session_id" INT PRIMARY KEY,
  "user_id" INT,
  "role" roles
);

CREATE TABLE "sessions" (
  "id" INT PRIMARY KEY,
  "course_id" INT,
  "issue" TEXT,
  "issue_subject" TEXT,
  "status" session.status,
  "entry_time" timestamp,
  "fulfillment_time" timestamp,
  "exit_time" timestamp
);

CREATE TABLE "feedback" (
  "session_id" INT PRIMARY KEY,
  "user_id" INT,
  "role" roles,
  "rating" INT,
  "feedback" TEXT
);

CREATE TABLE "logs" (
  "session_id" INT PRIMARY KEY,
  "action" TEXT,
  "timestamp" timestamp DEFAULT (now())
);

ALTER TABLE "user_courses" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "users" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "feedback" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "user_courses" ADD FOREIGN KEY ("course_id") REFERENCES "courses" ("id");

ALTER TABLE "sessions" ADD FOREIGN KEY ("course_id") REFERENCES "courses" ("id");

ALTER TABLE "logs" ADD FOREIGN KEY ("session_id") REFERENCES "sessions" ("id");

ALTER TABLE "users" ADD FOREIGN KEY ("session_id") REFERENCES "sessions" ("id");

ALTER TABLE "feedback" ADD FOREIGN KEY ("session_id") REFERENCES "sessions" ("id");
