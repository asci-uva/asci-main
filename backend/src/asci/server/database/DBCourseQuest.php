<?php

namespace asci\server\database;

error_reporting(E_ALL);
ini_set('display_errors', 0);
/*
 * Interacts with the database to fetch quests associated with a specific course
 * or set of courses.
 */
class DBCourseQuest
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
        $this->logger = new \Monolog\Logger('DBCourseQuest');
        $this->logger->pushHandler($log);
    }

    /*
     * Fetches all the quests for a given computing_id and loads them into
     * CourseQuest objects. Returns the array of CourseQuest objects.
     */
    public function getQuestsForCourse($course_id)
    {
        $query = 'select quest_id,course_id,name,description,total_points from (quests Q JOIN course_quests U on Q.id = U.quest_id) where course_id=$1';

        $result = $this->db->query($query, array($course_id));

        $quests = $this->db->fetchAll($result);

        $toReturn = [];
        /* Loop through and make course quest objects for each */
        foreach ($quests as $quest){
            $toAdd = new \asci\data\CourseQuest();
            $toAdd->fromArray($quest);
            array_push($toReturn, $toAdd);
        }

        return $toReturn;
    }

    public function addQuestToCourse($quest_id, $course_id)
    {
        $query = 'insert into course_quests (quest_id, course_id) values ($1, $2)';

        $result = $this->db->query($query, array($quest_id, $course_id));

        if (!$result) {
            $this->logger->error("Failed to create quest for course");
            return false;
        }
        return true;
    }

    public function removeQuestFromCourse($quest_id, $course_id)
    {
        $query = 'delete from course_quests where quest_id=$1 and course_id=$2';

        $result = $this->db->query($query, array($quest_id, $course_id));

        if (!$result) {
            $this->logger->error("Failed to delete quest for course");
            return false;
        }
        return true;
    }
}
