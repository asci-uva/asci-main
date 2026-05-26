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

    public function updateQuest($quest_id, $mnemonic, $name, $description, $total_points)
    {
        $query = 'update quests set mnemonic = $2, name = $3, description = $4, total_points = $5, where id = $1';
        $params = array($quest_id, $mnemonic, $name, $description, $total_points);

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

    public function createQuest($mnemonic, $name, $description, $total_points) {
         // check if the quest is already in the database or not
         $checkQuestQuery = 'SELECT id FROM quests WHERE mnemonic = $1 AND name = $2 AND description = $3 AND total_points = $4';
         $result = $this->db->query($checkQuestQuery, array($mnemonic, $name, $description, $total_points));
 
         // if the quest has been created, do not create it twice!
         $row = $this->db->fetchrow($result);
         if ($row) {
             $this->logger->error("Quest already exists with ID: " . $row['id']);
             return false;
         }

        // Insert the new quest into the 'quests' table
        $insertQuestQuery = 'insert into quests (mnemonic, name, description, total_points) values ($1, $2, $3, $4) returning id';
        $params = array($mnemonic, $name, $description, $total_points);
    
        $result = $this->db->query($insertQuestQuery, $params);
    
        if (!$result) {
            $this->logger->error("Failed to create quest");
            return false;
        }

        // Get the ID of the newly created quest
        $questId = $this->db->fetchrow($result)['id'];

        return $questId;
    }

    public function getAllQuests()
    {
        $query = 'select id,mnemonic,name,description,total_points from quests';

        $result = $this->db->query($query, array());

        $quests = $this->db->fetchAll($result);

        $toReturn = [];
        /* Loop through and make quests objects for each */
        foreach ($quests as $quest){
            $toAdd = new \asci\data\Quest();
            $toAdd->fromArray($quest);
            array_push($toReturn, $toAdd);
        }

        return $toReturn;
    }

    public function deleteQuest($quest_id)
    {
        //delete from each of the user_quests, to avoid FK conflict
        $query = 'delete from user_quests where quest_id=$1';
        $result = $this->db->query($query, array($quest_id));

        //delete from each of the course_quests, to avoid FK conflict
        $query = 'delete from course_quests where quest_id=$1';
        $result = $this->db->query($query, array($quest_id));

        if (!$result) {
            $this->logger->error("Failed to delete quest from course quest");
        }
        
        $query = 'delete from quests where id=$1';
        $result = $this->db->query($query, array($quest_id));

        if (!$result) {
            $this->logger->error("Failed to delete quest");
            return false;
        }
        return true;
    }
}
