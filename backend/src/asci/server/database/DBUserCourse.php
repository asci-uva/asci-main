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

    public function userHasPermission($user, $course_id, $permission=false) {

      $compId = $user->getComputingId();

      $this->logger->debug("Requesting permission for $compId in $course_id ($permission)");

      if ($permission === false)
        return false;
        
      $usercourse = $this->getCourseForUser($user->getComputingId(), $course_id);

      if ($usercourse == false)
        return false;

      $role = $usercourse->getRole();

      $this->logger->debug("Role is: $role");

      switch($permission) {
        case "join-queue":
          if ($role == "student")
            return true;
          break;
        case "ta-queue":
          if ($role == "ta" || $role == "instructor")
            return true;
          break;
        case "course-roster":
        case "course-settings":
        case "upload-llm":
        case "upload-piazza":
        case "course-stats":
          if ($role == "instructor")
            return true;
          break;
        case "llm-chat":
          return true;
        default:
          return false;
      }
     
      return false;
    }

    // returns UserCourse objects for users in the course
    public function getParticipantsForCourse($course_id)
    {
        $query = 'select Us.id,computing_id,course_id,mnemonic,number,name,semester,role from (courses C JOIN user_courses U on C.id = U.course_id) J JOIN users Us on J.user_id = Us.id where course_id=$1';

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

    // returns UserCourse objects for users in the course
    public function getStudentsForCourse($course_id)
    {
        $query = 'select Us.id,computing_id,course_id,mnemonic,number,name,semester,role from (courses C JOIN user_courses U on C.id = U.course_id) J JOIN users Us on J.user_id = Us.id where course_id=$1 and role=\'student\'';

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

    // 
    public function updatePiazzaStatsForCourse($courseId, $piazzaStats)
    {
      $selectquery = 'select * from piazza_raw_stats where user_id = $1 and course_id = $2;';
      $this->db->prepare("selectPiazza", $selectquery);
      $insertquery = 'insert into piazza_raw_stats (user_id, course_id, days, posts, asks, answers, views) values ($1, $2, $3, $4, $5, $6, $7);';
      $this->db->prepare("insertPiazza", $insertquery);
      $updatequery = 'update piazza_raw_stats set days = $3, posts = $4, asks = $5, answers = $6, views = $7 where user_id = $1 and course_id = $2;';
      $this->db->prepare("updatePiazza", $updatequery);


      foreach ($piazzaStats as $stat) {
        $res = $this->db->execute("selectPiazza", [$stat["user"]->getUserId(), $courseId]); 
        $rows = $this->db->fetchAll($res);

        if (empty($rows)) {
          // do insert
          $this->db->execute("insertPiazza", [$stat["user"]->getUserId(), $courseId, $stat["stats"]["days"], $stat["stats"]["posts"], $stat["stats"]["asks"], $stat["stats"]["answers"], $stat["stats"]["views"]]);
        } else {
          // do update
          $this->db->execute("updatePiazza", [$stat["user"]->getUserId(), $courseId, $stat["stats"]["days"], $stat["stats"]["posts"], $stat["stats"]["asks"], $stat["stats"]["answers"], $stat["stats"]["views"]]);
        }
      }
      return true;
    }
   
}
