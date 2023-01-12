CREATE TYPE "roles" AS ENUM (
  'student',
  'instructor',
  'ta'
);

CREATE TYPE "status_type" AS ENUM (
  'waiting',
  'in_progress',
  'completed'
);

CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "computing_id" VARCHAR(7),
  "fname" TEXT,
  "lname" TEXT,
  "pname" TEXT,
  "password" VARCHAR(255)
);

CREATE TABLE "user_courses" (
  "user_id" INT,
  "course_id" INT,
  "role" roles,
  PRIMARY KEY ("user_id", "course_id")
);

CREATE TABLE "courses" (
  "id" SERIAL PRIMARY KEY,
  "mnemonic" VARCHAR(10),
  "number" SMALLINT,
  "name" TEXT,
  "semester" TEXT
);

CREATE TABLE "session_users" (
  "session_id" SERIAL PRIMARY KEY,
  "user_id" INT,
  "queue_id" INT,
  "role" roles
);

CREATE TABLE "sessions" (
  "id" SERIAL PRIMARY KEY,
  "course_id" INT,
  "issue" TEXT,
  "issue_subject" TEXT,
  "status" status_type,
  "entry_time" timestamp DEFAULT (now()),
  "fulfillment_time" timestamp,
  "exit_time" timestamp
);

CREATE TABLE "feedback" (
  "session_id" SERIAL PRIMARY KEY,
  "user_id" INT,
  "role" roles,
  "rating" INT,
  "feedback" TEXT
);

CREATE TABLE "logs" (
  "session_id" SERIAL PRIMARY KEY,
  "action" TEXT,
  "timestamp" timestamp DEFAULT (now())
);

CREATE TABLE "queue" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INT,
  "course_id" INT,
  "issue" TEXT,
  "issue_subject" TEXT,
  "status" status_type,
  "entry_time" timestamp DEFAULT (now()),
  "exit_time" timestamp
);

ALTER TABLE "session_users" ADD FOREIGN KEY ("queue_id") REFERENCES "queue" ("id");

ALTER TABLE "queue" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "queue" ADD FOREIGN KEY ("course_id") REFERENCES "courses" ("id");

ALTER TABLE "user_courses" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "session_users" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "feedback" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "user_courses" ADD FOREIGN KEY ("course_id") REFERENCES "courses" ("id");

ALTER TABLE "sessions" ADD FOREIGN KEY ("course_id") REFERENCES "courses" ("id");

ALTER TABLE "logs" ADD FOREIGN KEY ("session_id") REFERENCES "sessions" ("id");

ALTER TABLE "session_users" ADD FOREIGN KEY ("session_id") REFERENCES "sessions" ("id");

ALTER TABLE "feedback" ADD FOREIGN KEY ("session_id") REFERENCES "sessions" ("id");
