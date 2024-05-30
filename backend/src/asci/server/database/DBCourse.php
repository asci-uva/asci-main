<?php

namespace asci\server\database;

use asci\data\Course as Course;

class DBCourse
{
    /* Reference to the database connection */
    private $db;

    /**
     * @var \Monolog\Logger $logger Logger for this class
     */
    private $logger = null;

    public function __construct($db)
    {
        global $log;

        $this->db = $db;
        $this->logger = new \Monolog\Logger('DBCourse');
        $this->logger->pushHandler($log);
    }

    public function getCourseById($course_id)
    {
        $query = 'select * from courses where id = $1';
    
        $result = $this->db->query($query, array($course_id));
        
        $row = $this->db->fetchrow($result);

        // if the course is not valid, return false
        if(!$row){
            return false;
        }
        
        $course = new \asci\data\Course($row);
        

        return $course;
    }

    public function updateCourse($course_id, $mnemonic, $number, $name, $semester)
    {
        $query = 'UPDATE courses SET mnemonic = $2, number = $3, name = $4, semester = $5 WHERE id = $1';
        $params = array($course_id, $mnemonic, $number, $name, $semester);

        try {
            $result = $this->db->query($query, $params);
            if ($result) {
                return true;
            } else {
                $this->logger->error("Failed to update course with ID: $course_id");
                return false; 
            }
        } catch (\Exception $e) {
            $this->logger->error("Error updating course: " . $e->getMessage());
            return false;
        }
    }

    public function createCourse($user, $mnemonic, $number, $name, $semester) {
        // check if the course has already in the database or not
        $checkCourseQuery = 'SELECT id FROM courses WHERE mnemonic = $1 AND number = $2 AND name = $3 AND semester = $4';
        $result = $this->db->query($checkCourseQuery, array($mnemonic, $number, $name, $semester));

        // if the course has been created, do not create it twice!
        $row = $this->db->fetchrow($result);
        if ($row) {
            $this->logger->error("Course already exists with ID: " . $row['id']);
            return false;
        }

        // Insert the new course into the 'courses' table
        $insertCourseQuery = 'INSERT INTO courses (mnemonic, number, name, semester) VALUES ($1, $2, $3, $4) RETURNING id';
        $params = array($mnemonic, $number, $name, $semester);
    
        $result = $this->db->query($insertCourseQuery, $params);
    
        if (!$result) {
            $this->logger->error("Failed to create course");
            return false;
        }
        
        // Get the ID of the newly created course
        $courseId = $this->db->fetchrow($result)['id'];

        // Retrieve the user_id for the given computing_id
        $userIdQuery = 'SELECT id FROM users WHERE computing_id = $1';
        $result = $this->db->query($userIdQuery, array($user));

        // Check if the user exists
        $row = $this->db->fetchrow($result);
        if (!$row) {
            // Handle the error if no user found
            return false;
        }
        $userId = $row['id'];
        
        // Create a usercourse relation to make the $user an instructor of the course
        $insertUserCourseQuery = 'INSERT INTO user_courses (user_id, course_id, role) VALUES ($1, $2, $3)';
        $params = array($userId, $courseId, 'instructor');
    
        $result = $this->db->query($insertUserCourseQuery, $params);
    
        if (!$result) {
            $this->logger->error("Failed to create user-course relation");
            return false;
        }
    
        return true;
    }
    
}
