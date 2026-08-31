ALTER DATABASE asci SET timezone TO 'America/New_York';

CREATE TYPE roles AS ENUM (
  'student',
  'instructor',
  'primary_instructor',
  'ta'
);

CREATE TYPE status_type AS ENUM (
  'waiting',
  'in_progress',
  'completed',
  'grouping',
  'group'
);

CREATE TYPE session_user_status AS ENUM (
  'active',
  'inactive'
);

CREATE TYPE group_mapping_status AS ENUM (
  'active',
  'inactive'
);

CREATE TYPE external_tool AS ENUM (
  'canvas',
  'gradescope',
  'piazza'
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  computing_id VARCHAR(12),
  fname TEXT,
  lname TEXT,
  pname TEXT,
  discord_username VARCHAR(30),
  password TEXT
);

CREATE UNIQUE INDEX users_computing_id_lower_unique
ON users (LOWER(computing_id));

CREATE TABLE user_courses (
  user_id INT,
  course_id INT,
  role roles,
  PRIMARY KEY (user_id, course_id)
);

CREATE UNIQUE INDEX user_courses_one_primary_instructor
ON user_courses (course_id)
WHERE role = 'primary_instructor';

CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  mnemonic VARCHAR(10),
  number SMALLINT,
  name TEXT,
  semester TEXT
);

CREATE TABLE ta_activity (
  id SERIAL,
  user_id INT,
  course_id INT,
  entry_time timestamp default (now()),
  exit_time timestamp default (now())
);

CREATE TABLE session_users (
  session_id SERIAL,
  user_id INT,
  role roles,
  user_status session_user_status
);

DROP TABLE IF EXISTS sessions;

CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  course_id INT,
  issue TEXT,
  issue_subject TEXT,
  location TEXT,
  status status_type,
  group_option TEXT,
  entry_time timestamp DEFAULT (now()),
  fulfillment_time timestamp,
  exit_time timestamp,
  code TEXT,
  llm_summary TEXT
);

CREATE TABLE group_mapping (
  from_session INT,
  to_session INT,
  status group_mapping_status
);

CREATE TABLE survey (
  session_id INT,
  user_id INT,
  q1_score INT,
  q2_score INT,
  q3_score INT,
  q4_score INT,
  q5_score INT,
  feedback TEXT
);

CREATE TABLE course_settings (
  course_id INT,
  discord_server_id TEXT,
  show_queue_list BOOL DEFAULT (true),
  grouping_enabled BOOL DEFAULT (true),
  smart_grouping BOOL DEFAULT (true),
  self_grouping BOOL DEFAULT (true),
  show_quests BOOL DEFAULT (true),
  llm_enabled BOOL DEFAULT (true),
  archived BOOL DEFAULT (false)
);

CREATE TABLE logs (
  log_id SERIAL PRIMARY KEY,
  user_id SERIAL,
  log_type TEXT,
  action TEXT,
  timestamp TIMESTAMP DEFAULT (now())
);




CREATE TABLE queue (
  id SERIAL PRIMARY KEY,
  user_id INT,
  session_id INT
);

CREATE TYPE assignment_type AS ENUM (
  'quiz',
  'programming_assignment',
  'written_assignment',
  'homework',
  'midterm',
  'final_exam'
);

CREATE TABLE assignments (
  id SERIAL PRIMARY KEY,
  course_id INT,
  name TEXT,
  description TEXT,
  max_score FLOAT,
  type assignment_type,
  FOREIGN KEY (course_id) REFERENCES courses (id)
);

CREATE TYPE submission_status AS ENUM (
  'graded',
  'missing'
);

CREATE TABLE submissions (
  id SERIAL PRIMARY KEY,
  assignment_id INT,
  user_id INT,
  score FLOAT,
  max_score FLOAT,
  status submission_status,
  lateness TEXT,
  view_count INT,
  submission_count INT,
  FOREIGN KEY (assignment_id) REFERENCES assignments (id),
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Piazza Data
CREATE TABLE piazza_stream (
  id SERIAL PRIMARY KEY,
  user_id INT,
  course_id INT,
  post_no INT,
  time timestamp,
  submission text,
  subject text,
  action text,
  endorsed boolean DEFAULT false,
  FOREIGN KEY (course_id) REFERENCES courses (id),
  FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE UNIQUE INDEX piazza_stream_contribution_unique
ON piazza_stream (course_id, post_no, user_id, time) NULLS NOT DISTINCT;

CREATE TABLE piazza_raw_stats (
  id SERIAL PRIMARY KEY,
  user_id INT,
  course_id INT,
  days int,
  posts int,
  asks int,
  answers int,
  views int,
  FOREIGN KEY (course_id) REFERENCES courses (id),
  FOREIGN KEY (user_id) REFERENCES users (id)
);




CREATE TYPE quest_completion_status AS ENUM (
  'Locked',
  'Not started',
  'In progress',
  'Completed',
  'Completed - Pending Approval'
);


-- Quest Tables
CREATE TABLE quests (
  id SERIAL PRIMARY KEY,
  mnemonic VARCHAR(10),
  name TEXT,
  description TEXT,
  total_points INT
);

CREATE TABLE user_quests (
  quest_id INT,
  user_id INT,
  course_id INT,
  status quest_completion_status,
  PRIMARY KEY (user_id, quest_id, course_id)
);

CREATE TABLE course_quests (
  quest_id INT,
  course_id INT,
  PRIMARY KEY (course_id, quest_id)
);

-- External tools
CREATE TABLE course_external_tools (
  course_id  INT NOT NULL REFERENCES courses(id),
  tool       external_tool NOT NULL,
  enabled    BOOL NOT NULL DEFAULT false,
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (course_id, tool)
);

-- Canvas LMS
CREATE TABLE canvas_lms_access_tokens (
  user_id INT PRIMARY KEY,
  access_token TEXT,
  access_token_iv TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE canvas_lms_courses (
  asci_course_id INT PRIMARY KEY,
  canvas_course_id TEXT,
  name TEXT,
  course_code TEXT,
  last_synced_at TIMESTAMP,
  stale_period INTERVAL NOT NULL DEFAULT '7 days',
  autosync_enabled BOOLEAN NOT NULL DEFAULT false,
  FOREIGN KEY (asci_course_id) REFERENCES courses(id)
);

CREATE TABLE canvas_lms_assignments (
  id SERIAL PRIMARY KEY,
  asci_course_id INT NOT NULL,
  canvas_assignment_id TEXT NOT NULL,
  canvas_assignment_group_id TEXT,
  name TEXT,
  description TEXT,
  html_url TEXT,
  due_at TIMESTAMP,
  unlock_at TIMESTAMP,
  lock_at TIMESTAMP,
  points_possible FLOAT,
  grading_type TEXT,
  submission_types TEXT[],
  allowed_attempts INT,
  position INT,
  published BOOLEAN,
  workflow_state TEXT,
  omit_from_final_grade BOOLEAN,
  canvas_created_at TIMESTAMP,
  canvas_updated_at TIMESTAMP,
  last_synced_at TIMESTAMP,
  missing_from_canvas_at TIMESTAMP,
  UNIQUE (asci_course_id, canvas_assignment_id),
  FOREIGN KEY (asci_course_id) REFERENCES canvas_lms_courses(asci_course_id)
);

CREATE INDEX canvas_lms_assignments_course
ON canvas_lms_assignments (asci_course_id);

CREATE TABLE canvas_lms_submissions (
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

CREATE UNIQUE INDEX canvas_lms_submissions_canvas_user
ON canvas_lms_submissions (canvas_lms_assignment_id, canvas_user_id)
WHERE canvas_user_id IS NOT NULL;

CREATE UNIQUE INDEX canvas_lms_submissions_asci_user
ON canvas_lms_submissions (canvas_lms_assignment_id, user_id)
WHERE user_id IS NOT NULL;

CREATE INDEX canvas_lms_submissions_assignment
ON canvas_lms_submissions (canvas_lms_assignment_id);

CREATE INDEX canvas_lms_submissions_user
ON canvas_lms_submissions (user_id);

ALTER TABLE queue ADD FOREIGN KEY (user_id) REFERENCES users (id);

ALTER TABLE queue ADD FOREIGN KEY (session_id) REFERENCES sessions (id);

ALTER TABLE user_courses ADD FOREIGN KEY (user_id) REFERENCES users (id);

ALTER TABLE session_users ADD FOREIGN KEY (user_id) REFERENCES users (id);

ALTER TABLE user_courses ADD FOREIGN KEY (course_id) REFERENCES courses (id);

ALTER TABLE sessions ADD FOREIGN KEY (course_id) REFERENCES courses (id);

ALTER TABLE logs ADD FOREIGN KEY (user_id) REFERENCES users (id);

ALTER TABLE session_users ADD FOREIGN KEY (session_id) REFERENCES sessions (id);

ALTER TABLE survey ADD FOREIGN KEY (session_id) REFERENCES sessions (id);

ALTER TABLE survey ADD FOREIGN KEY (user_id) REFERENCES users (id);

ALTER TABLE group_mapping ADD FOREIGN KEY (from_session) REFERENCES sessions (id);

ALTER TABLE group_mapping ADD FOREIGN KEY (to_session) REFERENCES sessions (id);


-- insert some dummy data
-- insert mark and nada,
-- make up two dummy courses. Make them student and TA in each 

INSERT INTO users (id, computing_id, fname, lname , pname, password)
VALUES (1, 'mrf8t', 'Mark', 'Floryan', 'Mark', '$2y$10$diohkfZSkNpwzTW9ONHrvusUK/GdjFCoNNUpm8qzQGAuJFAEJq0dC');

INSERT INTO users (id, computing_id, fname, lname , pname, password)
VALUES (2, 'nb3f', 'Nada', 'Basit', 'Nada', '$2y$10$diohkfZSkNpwzTW9ONHrvusUK/GdjFCoNNUpm8qzQGAuJFAEJq0dC');

INSERT INTO users (id, computing_id, fname, lname , pname, password)
VALUES (3, 'jh2jf', 'John', 'Hott', 'Robbie', '$2y$10$diohkfZSkNpwzTW9ONHrvusUK/GdjFCoNNUpm8qzQGAuJFAEJq0dC');

INSERT INTO users (id, computing_id, fname, lname , pname, password)
VALUES (4, 'hz9xs', 'Hanzhang', 'Zhao', 'Hanzhang', '$2y$10$diohkfZSkNpwzTW9ONHrvusUK/GdjFCoNNUpm8qzQGAuJFAEJq0dC');

INSERT INTO courses (id, mnemonic, number, name, semester)
VALUES (1, 'CS', '2130', 'CSO1', 'SP-23');

INSERT INTO courses (id, mnemonic, number, name, semester)
VALUES (2, 'CS', '3100', 'DSA2', 'SP-23');

INSERT INTO courses (id, mnemonic, number, name, semester)
VALUES (3, 'CS', '3120', 'DMT2', 'F-23');

INSERT INTO user_courses (user_id, course_id, role)
VALUES (1, 1, 'student');

INSERT INTO user_courses (user_id, course_id, role)
VALUES (1, 2, 'primary_instructor');

INSERT INTO user_courses (user_id, course_id, role)
VALUES (2, 1, 'ta');

INSERT INTO user_courses (user_id, course_id, role)
VALUES (2, 2, 'student');

INSERT INTO user_courses (user_id, course_id, role)
VALUES (3, 1, 'student');

INSERT INTO course_settings (course_id, show_queue_list, grouping_enabled, smart_grouping, self_grouping)
VALUES (1, true, true, true, true);

INSERT INTO course_settings (course_id, show_queue_list, grouping_enabled, smart_grouping, self_grouping)
VALUES (2, true, true, true, true);

INSERT INTO user_courses (user_id, course_id, role)
VALUES (4, 3, 'primary_instructor');

INSERT INTO user_courses (user_id, course_id, role)
VALUES (2, 3, 'student');

INSERT INTO user_courses (user_id, course_id, role)
VALUES (3, 3, 'student');

INSERT INTO assignments (course_id, name, description, type, max_score)
VALUES 
(3, 'Assignment 1', 'First assignment for CSO1', 'quiz', 100),
(3, 'Assignment 2', 'Second assignment for CSO1', 'programming_assignment', 100);

INSERT INTO submissions (assignment_id, user_id, score, max_score, status, lateness, view_count, submission_count)
VALUES 
(1, 2, 90, 100, 'graded', '00:00:00', 3, 1),
(1, 3, 80, 100, 'graded', '00:00:00', 2, 1),
(2, 2, 50, 100, 'graded', '00:00:00', 8, 5),
(2, 3, NULL, 100, 'missing', NULL, 0, 0);

-- Quest data
INSERT INTO quests (id, mnemonic, name, description , total_points)
VALUES (1, 'OH1', 'Attend Office Hours One Time', 'Get help at office hours the one time, minimum 5 minutes', 10);

INSERT INTO quests (id, mnemonic, name, description , total_points)
VALUES (2, 'OH3', 'Attend Office Hours Three Times', 'Get help at office hours two times, each session minimum 5 minutes', 10);

INSERT INTO quests (id, mnemonic, name, description , total_points)
VALUES (3, 'OH10', 'Attend Office Hours Ten Times', 'Get help at office hours ten times, each session minimum 5 minutes', 10);

ALTER TABLE user_quests ADD FOREIGN KEY (user_id) REFERENCES users (id);
ALTER TABLE user_quests ADD FOREIGN KEY (quest_id) REFERENCES quests (id);
ALTER TABLE user_quests ADD FOREIGN KEY (course_id) REFERENCES courses (id);

INSERT INTO user_quests (quest_id, user_id, course_id, status)
VALUES (1, 1, 1, 'Not started');

INSERT INTO user_quests (quest_id, user_id, course_id, status)
VALUES (2, 1, 1, 'Not started');


INSERT INTO course_quests (quest_id, course_id)
VALUES (1, 1);

INSERT INTO course_quests (quest_id, course_id)
VALUES (2, 1);

INSERT INTO sessions (id, course_id, fulfillment_time, exit_time)
VALUES (1, 1, '2024-01-08 04:05:00', '2024-01-08 04:10:00');

INSERT INTO session_users (session_id, user_id)
VALUES (1, 1);