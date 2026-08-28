<?php

namespace asci\server\database;

/*
 * Interacts with the database to fetch settings for an individual course.
 */
class DBCourseSettings
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
        $this->logger = new \Monolog\Logger('DBSession');
        $this->logger->pushHandler($log);
    }

    /*
     * Updates the course settings with the provided one
     */
    public function update($course_settings){

        $query = 'UPDATE course_settings SET
            show_queue_list = $1,
            discord_server_id = $2,
            grouping_enabled = $3,
            smart_grouping = $4,
            show_quests = $5,
            llm_enabled = $6,
            archived = $7
            WHERE course_id = $8';

        // Normalize boolean values: handles PHP true/false, DB strings "t"/"f",
        // and JSON strings "true"/"false" so both EditCourseSettings and DiscordActivity work.
        $boolParam = function($v) {
            if ($v === null) return null;
            if ($v === true || $v === 't' || $v === 'true' || $v === '1' || $v === 1) return 't';
            return 'f';
        };

        $result = $this->db->query($query, array(
            $boolParam($course_settings->show_queue_list),
            $course_settings->discord_server_id,
            $boolParam($course_settings->grouping_enabled),
            $boolParam($course_settings->smart_grouping),
            $boolParam($course_settings->show_quests),
            $boolParam($course_settings->llm_enabled),
            $boolParam($course_settings->archived),
            $course_settings->course_id
        ));

        if($result) return true;
        else return false;
    }


    /*
     * Gets the course settings for the given course_id
     */
    public function getCourseSettings($course_id){
        $query = 'SELECT * FROM course_settings WHERE course_id=$1';

        $result = $this->db->query($query, array($course_id));
        $settings = $this->db->fetchrow($result);

        #creates a new course settings entry if it does not exist
        if($settings == null){
            if (!$this->createCourseSettings($course_id)){
                return null;
            } else {
                $result = $this->db->query($query, array($course_id));
                $settings = $this->db->fetchrow($result);
            }
        }

        return (new \asci\data\CourseSettings())->fromArray($settings);
    }
    /*
     * Creates a new course settings entry in the database
     */
    public function createCourseSettings($course_id){
        $query = 'INSERT INTO course_settings (course_id) VALUES ($1)';
        $result = $this->db->query($query, array($course_id));

        if($result) return true;
        else return false;
    }
}
