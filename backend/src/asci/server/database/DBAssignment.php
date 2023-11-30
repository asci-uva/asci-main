<?php

namespace asci\server\database;

use asci\data\Assignment as Assignment;

class DBAssignment
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
        $this->logger = new \Monolog\Logger('DBAssignment');
        $this->logger->pushHandler($log);
    }

    public function getAssignmentById($assignment_id)
    {
        $query = 'SELECT * FROM assignments WHERE id = $1';
    
        $result = $this->db->query($query, array($assignment_id));
        
        $row = $this->db->fetchrow($result);

        // if the assignment is not valid, return false
        if(!$row){
            return false;
        }
        
        $assignment = new \asci\data\Assignment($row);
        return $assignment;
    }

    public function getAssignmentsByCourseId($course_id)
    {
        $query = 'SELECT * FROM assignments WHERE course_id = $1';
        
        $result = $this->db->query($query, array($course_id));

        if (!$result) {
            $this->logger->error("Failed to retrieve assignments for course ID: $course_id");
            return false;
        }

        $assignments = [];
        while ($row = $this->db->fetchrow($result)) {
            $assignments[] = new \asci\data\Assignment($row);
        }

        return $assignments;
    }


    public function updateAssignment($assignment_id, $course_id, $name, $description, $due_date, $max_score, $type)
    {
        $query = 'UPDATE assignments SET course_id = $2, name = $3, description = $4, due_date = $5, max_score = $6, type = $7 WHERE id = $1';
        $params = array($assignment_id, $course_id, $name, $description, $due_date, $max_score, $type);

        try {
            $result = $this->db->query($query, $params);
            if ($result) {
                return true;
            } else {
                $this->logger->error("Failed to update assignment with ID: $assignment_id");
                return false; 
            }
        } catch (\Exception $e) {
            $this->logger->error("Error updating assignment: " . $e->getMessage());
            return false;
        }
    }

    public function createAssignment($course_id, $name, $description, $due_date, $max_score, $type) {
        // Insert the new assignment into the 'assignments' table
        $insertAssignmentQuery = 'INSERT INTO assignments (course_id, name, description, due_date, max_score, type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id';
        $params = array($course_id, $name, $description, $due_date, $max_score, $type);
    
        $result = $this->db->query($insertAssignmentQuery, $params);
    
        if (!$result) {
            $this->logger->error("Failed to create assignment");
            return false;
        }

        // Get the ID of the newly created assignment
        $assignmentId = $this->db->fetchrow($result)['id'];

        return $assignmentId;
    }

}
