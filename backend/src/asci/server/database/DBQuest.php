<?php

namespace asci\server\database;

error_reporting(E_ALL);
ini_set('display_errors', 0);

use asci\data\Quest as Quest;

class DBQuest
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
        $this->logger = new \Monolog\Logger('DBQuest');
        $this->logger->pushHandler($log);
    }

    public function getQuestById($quest_id)
    {
        $query = 'select * from quests where id = $1';
    
        $result = $this->db->query($query, array($quest_id));
        
        $row = $this->db->fetchrow($result);

        // if the assignment is not valid, return false
        if(!$row){
            return false;
        }
        
        $quest = new \asci\data\Quest($row);
        $quest->fromArray($row);

        return $quest;
    }

    // public function getAssignmentsByCourseId($course_id)
    // {
    //     $query = 'select * from quests where course_id = $1';
        
    //     $result = $this->db->query($query, array($course_id));

    //     if (!$result) {
    //         $this->logger->error("Failed to retrieve quests for course ID: $course_id");
    //         return false;
    //     }

    //     $quests = [];
    //     while ($row = $this->db->fetchrow($result)) {
    //         $quests[] = new \asci\data\Quest($row);
    //     }

    //     return $quests;
    // }


    public function updateQuest($quest_id, $course_id, $name, $description, $total_points)
    {
        $query = 'update quests set course_id = $2, name = $3, description = $4, total_points = $5, where id = $1';
        $params = array($quest_id, $course_id, $name, $description, $total_points);

        try {
            $result = $this->db->query($query, $params);
            if ($result) {
                return true;
            } else {
                $this->logger->error("Failed to update quest with ID: $quest_id");
                return false; 
            }
        } catch (\Exception $e) {
            $this->logger->error("Error updating quest: " . $e->getMessage());
            return false;
        }
    }

    public function createQuest($quest_id, $course_id, $name, $description, $total_points) {
        // Insert the new assignment into the 'assignments' table
        $insertQuestQuery = 'insert into quests (course_id, name, description, total_points) value ($1, $2, $3, $4) returning id';
        $params = array($course_id, $name, $description, $total_points);
    
        $result = $this->db->query($insertQuestQuery, $params);
    
        if (!$result) {
            $this->logger->error("Failed to create quest");
            return false;
        }

        // Get the ID of the newly created assignment
        $questId = $this->db->fetchrow($result)['id'];

        return $questId;
    }

}
