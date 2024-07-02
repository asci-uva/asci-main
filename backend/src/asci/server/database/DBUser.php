<?php

namespace asci\server\database;

use asci\data\User as User;

class DBUser
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
        $this->logger = new \Monolog\Logger('DBUser');
        $this->logger->pushHandler($log);
    }

    public function getUser($computing_id)
    {
        $query = 'select * from users where computing_id = $1';
        $result = $this->db->query($query, array($computing_id));


        $row = $this->db->fetchrow($result);

        $user = new \asci\data\User();
        $user->fromArray($row);

        return $user;
    }

    public function getRosterForCourse($course_id){
        $query = 'SELECT U.computing_id, U.fname, U.lname, U.pname, C.role FROM (users U JOIN user_courses C on U.id=C.user_id) WHERE C.course_id=$1';

        $result = $this->db->query($query, array($course_id));

        if(!$result) return null;

        $roster = [];
        while($row = $this->db->fetchrow($result)){
            $roster[] = $row;
        }

        return $roster;
    }

    public function getUserById($user_id){
        $query = 'select * from users where id = $1';
        $result = $this->db->query($query, array($user_id));


        $row = $this->db->fetchrow($result);

        $user = new \asci\data\User();
        $user->fromArray($row);

        return $user;
    }

    public function createUser($computing_id, $fname, $lname, $pname) {
        // SQL query to check if a user with the given computing_id already exists
        $checkQuery = 'SELECT id FROM users WHERE computing_id = $1';
        
        // Check if the user already exists
        $existingUser = $this->db->query($checkQuery, array($computing_id));
        $row = $this->db->fetchrow($existingUser);
    
        if ($row) {
            // User already exists
            $this->logger->info("User with computing_id: $computing_id already exists.");
            return true;
        }
    
        // If the user does not exist, send SQL query to insert a new user
        $insertQuery = 'INSERT INTO users (computing_id, fname, lname, pname) VALUES ($1, $2, $3, $4)';
    
        // Parameters for the query
        $params = array($computing_id, $fname, $lname, $pname);
    
        try {
            // Execute the query to insert the user
            $result = $this->db->query($insertQuery, $params);
            
            // Check if the user was successfully inserted
            if ($result) {
                return true; // Successfully inserted the user
            } else {
                $this->logger->error("Failed to insert new user with computing_id: $computing_id");
                return false; // Failed to insert the user
            }
        } catch (\Exception $e) {
            $this->logger->error("Error inserting new user: " . $e->getMessage());
            return false; // Error occurred while inserting the user
        }
    }
    
    public function ManuallyAddUsersForCourse($users, $course_id) {
        $results = [];
    
        foreach ($users as $user) {
            $fname = $user['fname'];
            $lname = $user['lname'];
            $pname = $user['pname'];
            $computing_id = $user['computing_id'];
            $role = $user['role'];
    
            $userExists = $this->createUser($computing_id, $fname, $lname, $pname);
    
            if (!$userExists) {
                $this->logger->error("Failed to find or create user with computing_id: $computing_id");
                $results[$computing_id] = false;
                continue; // skip to the next user
            }
    
            $userIdQuery = 'SELECT id FROM users WHERE computing_id = $1';
            $result = $this->db->query($userIdQuery, array($computing_id));
            $row = $this->db->fetchrow($result);
    
            if (!$row) {
                $this->logger->error("Unexpected error: User with computing_id $computing_id not found after creation.");
                $results[$computing_id] = false;
                continue;
            }
            $userId = $row['id'];
    
            $checkUserCourseQuery = 'SELECT user_id FROM user_courses WHERE user_id = $1 AND course_id = $2';
            $result = $this->db->query($checkUserCourseQuery, array($userId, $course_id));
    
            if ($row = $this->db->fetchrow($result)) {
                $this->logger->info("User-course relation already exists with ID: " . $userId);
                $results[$computing_id] = false;
                continue;
            }
    
            $insertUserCourseQuery = 'INSERT INTO user_courses (user_id, course_id, role) VALUES ($1, $2, $3)';
            $params = array($userId, $course_id, $role);
    
            try {
                $result = $this->db->query($insertUserCourseQuery, $params);
                if ($result) {
                    $results[$computing_id] = true;
                } else {
                    $this->logger->error("Failed to insert user-course relation for computing_id: $computing_id");
                    $results[$computing_id] = false;
                }
            } catch (\Exception $e) {
                $this->logger->error("Error inserting user-course relation: " . $e->getMessage());
                $results[$computing_id] = false;
            }
        }
    
        return $results; // This will return an associative array with computing_id as key and true/false as value indicating success/failure.
    }
    
}
