<?php

namespace asci\server\database;

/*
 * Interacts with the database to fetch courses associated with a specific user
 * or set of users.
 */
class DBUserCourse
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
        $this->logger = new \Monolog\Logger('DBUserCourse');
        $this->logger->pushHandler($log);
    }

    /*
     * Fetches all the courses for a given computing_id and loads them into
     * UserCourse objects. Returns the array of UserCourse objects.
     */
    public function getCoursesForUser($computing_id)
    {
        $query = 'select course_id,mnemonic,number,name,semester,role from (courses C JOIN user_courses U on C.id = U.course_id) J JOIN users Us on J.user_id = Us.id where computing_id=$1';

        $result = $this->db->query($query, array($computing_id));

        $courses = $this->db->fetchAll($result);

        $toReturn = [];
        /* Loop through and make user course objects for each */
        foreach ($courses as $course){
            //add computing id then convert
            $course["computing_id"] = $computing_id;
            $toAdd = new \asci\data\UserCourse();
            $toAdd->fromArray($course);
            array_push($toReturn, $toAdd);
        }

        return $toReturn;
    }

    /*
     * Fetches all the courses for a given computing_id and loads them into
     * UserCourse objects. Returns the array of UserCourse objects.
     */
    public function getCourseForUser($computing_id, $course_id)
    {
        $query = 'select course_id,mnemonic,number,name,semester,role from (courses C JOIN user_courses U on C.id = U.course_id) J JOIN users Us on J.user_id = Us.id where computing_id=$1 and course_id=$2';

        $result = $this->db->query($query, array($computing_id, $course_id));

        $course = $this->db->fetchrow($result);
        
        $course["computing_id"] = $computing_id;
        
        $toReturn = new \asci\data\UserCourse();
        $toReturn->fromArray($course);
            
        return $toReturn;
    }

    public function getCoursesForUserByRole($computing_id, $role)
    {
        $query = 'select course_id,mnemonic,number,name,semester,role from (courses C JOIN user_courses U on C.id = U.course_id) J JOIN users Us on J.user_id = Us.id where computing_id=$1 and role=$2';

        $result = $this->db->query($query, array($computing_id, $role));

        $courses = $this->db->fetchAll($result);

        $toReturn = [];
        /* Loop through and make user course objects for each */
        foreach ($courses as $course){
            //add computing id then convert
            $course["computing_id"] = $computing_id;
            $toAdd = new \asci\data\UserCourse();
            $toAdd->fromArray($course);
            array_push($toReturn, $toAdd);
        }

        return $toReturn;
    }

    // returns UserCourse objects for users in the course
    public function getStudentsForCourse($course_id)
    {
        $query = 'select computing_id,course_id,mnemonic,number,name,semester,role from (courses C JOIN user_courses U on C.id = U.course_id) J JOIN users Us on J.user_id = Us.id where course_id=$1 and role=\'student\'';

        $result = $this->db->query($query, array($course_id));

        $courses = $this->db->fetchAll($result);

        $toReturn = [];
        /* Loop through and make user course objects for each */
        foreach ($courses as $course){
            $toAdd = new \asci\data\UserCourse();
            $toAdd->fromArray($course);
            array_push($toReturn, $toAdd);
        }

        return $toReturn;
    }
   
}
