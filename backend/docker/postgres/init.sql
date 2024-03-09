ALTER DATABASE asci SET timezone TO 'America/New_York';

CREATE TYPE roles AS ENUM (
  'student',
  'instructor',
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

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  computing_id VARCHAR(12),
  fname TEXT,
  lname TEXT,
  pname TEXT
);

CREATE TABLE user_courses (
  user_id INT,
  course_id INT,
  role roles,
  PRIMARY KEY (user_id, course_id)
);

CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  mnemonic VARCHAR(10),
  number SMALLINT,
  name TEXT,
  semester TEXT
);

CREATE TABLE session_users (
  session_id SERIAL,
  user_id INT,
  role roles,
  user_status session_user_status
);

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
  exit_time timestamp
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

CREATE TABLE logs (
  session_id SERIAL PRIMARY KEY,
  action TEXT,
  timestamp timestamp DEFAULT (now())
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


ALTER TABLE queue ADD FOREIGN KEY (user_id) REFERENCES users (id);

ALTER TABLE queue ADD FOREIGN KEY (session_id) REFERENCES sessions (id);

ALTER TABLE user_courses ADD FOREIGN KEY (user_id) REFERENCES users (id);

ALTER TABLE session_users ADD FOREIGN KEY (user_id) REFERENCES users (id);

ALTER TABLE user_courses ADD FOREIGN KEY (course_id) REFERENCES courses (id);

ALTER TABLE sessions ADD FOREIGN KEY (course_id) REFERENCES courses (id);

ALTER TABLE logs ADD FOREIGN KEY (session_id) REFERENCES sessions (id);

ALTER TABLE session_users ADD FOREIGN KEY (session_id) REFERENCES sessions (id);

ALTER TABLE survey ADD FOREIGN KEY (session_id) REFERENCES sessions (id);

ALTER TABLE survey ADD FOREIGN KEY (user_id) REFERENCES users (id);

ALTER TABLE group_mapping ADD FOREIGN KEY (from_session) REFERENCES sessions (id);

ALTER TABLE group_mapping ADD FOREIGN KEY (to_session) REFERENCES sessions (id);


-- insert some dummy data
-- insert mark and nada,
-- make up two dummy courses. Make them student and TA in each 

INSERT INTO users (id, computing_id, fname, lname , pname)
VALUES (1, 'mrf8t', 'Mark', 'Floryan', 'Mark');

INSERT INTO users (id, computing_id, fname, lname , pname)
VALUES (2, 'nb3f', 'Nada', 'Basit', 'Nada');

INSERT INTO users (id, computing_id, fname, lname , pname)
VALUES (3, 'jh2jf', 'John', 'Hott', 'Robbie');

INSERT INTO users (id, computing_id, fname, lname , pname)
VALUES (4, 'hz9xs', 'Hanzhang', 'Zhao', 'Hanzhang');

INSERT INTO courses (id, mnemonic, number, name, semester)
VALUES (1, 'CS', '2130', 'CSO1', 'SP-23');

INSERT INTO courses (id, mnemonic, number, name, semester)
VALUES (2, 'CS', '3100', 'DSA2', 'SP-23');

INSERT INTO courses (id, mnemonic, number, name, semester)
VALUES (3, 'CS', '3120', 'DMT2', 'F-23');

INSERT INTO user_courses (user_id, course_id, role)
VALUES (1, 1, 'student');

INSERT INTO user_courses (user_id, course_id, role)
VALUES (1, 2, 'ta');

INSERT INTO user_courses (user_id, course_id, role)
VALUES (2, 1, 'ta');

INSERT INTO user_courses (user_id, course_id, role)
VALUES (2, 2, 'student');

INSERT INTO user_courses (user_id, course_id, role)
VALUES (3, 1, 'student');

INSERT INTO user_courses (user_id, course_id, role)
VALUES (4, 3, 'instructor');

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



