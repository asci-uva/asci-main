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
        $this->logger->debug("updating course settings: ", array("settings" => $course_settings));
        $this->logger->debug("smart grouping setting: ", array("setting" => $course_settings->smart_grouping));

        $query = 'UPDATE course_settings SET
            show_queue_list = $1,
            grouping_enabled = $2,
            smart_grouping = $3,
            show_quests = $4
            WHERE course_id = $5';

        $result = $this->db->query($query, array(
            json_encode($course_settings->show_queue_list),
            json_encode($course_settings->grouping_enabled),
            json_encode($course_settings->smart_grouping),
            json_encode($course_settings->show_quests),
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

        if($settings == null){
            //return null;
            $settings = [];
        }

        return (new \asci\data\CourseSettings())->fromArray($settings);
    }
}
