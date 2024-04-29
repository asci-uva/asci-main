<?php

namespace asci\server\database;

error_reporting(E_ALL);
ini_set('display_errors', 0);
/*
 * Interacts with the database to fetch quests associated with a specific user
 * or set of users.
 */
class DBUserQuest
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
        $this->logger = new \Monolog\Logger('DBUserQuest');
        $this->logger->pushHandler($log);
    }

    /*
     * Fetches all the quests for a given computing_id and loads them into
     * UserQuest objects. Returns the array of UserQuest objects.
     */
    public function getQuestsForUser($computing_id, $course_id)
    {
        $query = 'select quest_id,user_id,status,mnemonic,name,description,total_points from ((quests Q JOIN user_quests U on Q.id = U.quest_id) J JOIN users Us on J.user_id = Us.id) Qs NATURAL JOIN course_quests CQ where computing_id=$1 and course_id=$2';

        $result = $this->db->query($query, array($computing_id, $course_id));

        $quests = $this->db->fetchAll($result);

        $toReturn = [];
        /* Loop through and make user quest objects for each */
        foreach ($quests as $quest){
            $toAdd = new \asci\data\UserQuest();
            $toAdd->fromArray($quest);
            array_push($toReturn, $toAdd);
        }

        return $toReturn;
    }

    public function getPointsForUser($computing_id, $course_id)
    {
        $query = 'select sum(total_points) from ((quests Q JOIN user_quests U on Q.id = U.quest_id) J JOIN users Us on J.user_id = Us.id) Qs NATURAL JOIN course_quests CQ where computing_id=$1 and course_id=$2 and status=\'Completed\'';

        $result = $this->db->query($query, array($computing_id, $course_id));
        $row = $this->db->fetchrow($result);

        return $row["sum"];
    }

    public function updateQuestStatus($quest_id, $user_id, $status)
    {
        $query = 'update user_quests set status = $3 where quest_id = $1 and user_id = $2';
        $params = array($quest_id, $user_id, $status);

        try {
            $result = $this->db->query($query, $params);
            if ($result) {
                return true;
            } else {
                $this->logger->error("Failed to update status for user: $user_id , quest with ID: $quest_id");
                return false; 
            }
        } catch (\Exception $e) {
            $this->logger->error("Error updating quest status: " . $e->getMessage());
            return false;
        }
    }

    public function addQuestsForUser($quest_id, $user_id)
    {
        $query = 'insert into user_quests (quest_id, user_id) values ($1, $2)';

        $result = $this->db->query($query, array($quest_id, $user_id));

        if (!$result) {
            $this->logger->error("Failed to create quest for user");
            return false;
        }
        return true;
    }
}
