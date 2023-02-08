ALTER DATABASE asci SET timezone TO 'America/New_York';

CREATE TYPE roles AS ENUM (
  'student',
  'instructor',
  'ta'
);

CREATE TYPE status_type AS ENUM (
  'waiting',
  'in_progress',
  'completed'
);

CREATE TYPE session_user_status AS ENUM (
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
  entry_time timestamp DEFAULT (now()),
  fulfillment_time timestamp,
  exit_time timestamp
);

CREATE TABLE survey (
  session_id SERIAL PRIMARY KEY,
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



-- insert some dummy data
-- insert mark and nada,
-- make up two dummy courses. Make them student and TA in each 

INSERT INTO users (id, computing_id, fname, lname , pname)
VALUES (1, 'mrf8t', 'Mark', 'Floryan', 'Mark');

INSERT INTO users (id, computing_id, fname, lname , pname)
VALUES (2, 'nb3f', 'Nada', 'Basit', 'Nada');

INSERT INTO users (id, computing_id, fname, lname , pname)
VALUES (3, 'jh2jf', 'John', 'Hott', 'Robbie');

INSERT INTO courses (id, mnemonic, number, name, semester)
VALUES (1, 'CS', '2130', 'CSO1', 'SP-23');

INSERT INTO courses (id, mnemonic, number, name, semester)
VALUES (2, 'CS', '3100', 'DSA2', 'SP-23');

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


