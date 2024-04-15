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
    public function getQuestsForUser($computing_id)
    {
        $query = 'select quest_id,user_id,status,name,description,total_points from (quests Q JOIN user_quests U on Q.id = U.quest_id) J JOIN users Us on J.user_id = Us.id where computing_id=$1';

        $result = $this->db->query($query, array($computing_id));

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

    public function getPointsForUser($computing_id)
    {
        $query = 'select sum(total_points) from (quests Q JOIN user_quests U on Q.id = U.quest_id) J JOIN users Us on J.user_id = Us.id where computing_id=$1 and status=\'Completed\'';

        $result = $this->db->query($query, array($computing_id));
        $row = $this->db->fetchrow($result);

        return $row["sum"];
    }
}
