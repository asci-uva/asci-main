<?php

namespace asci\server\database;

/*
 * Interacts with the database to fetch courses associated with a specific user
 * or set of users.
 */
class DBStudentTracking
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
        $this->logger = new \Monolog\Logger('DBStudentTracking');
        $this->logger->pushHandler($log);
    }

    /*
     * Fetches all the courses for a given computing_id and loads them into
     * UserCourse objects. Returns the array of UserCourse objects.
     */
    public function getStudentsFallingBehind($course_id)
    {

        //CRAZY Query
        //combines the grades, piazza, and office hours data into one summary table.
        $query='SELECT usertable.*,gradestable.subcount,piazzatable.posts,piazzatable.asks,piazzatable.answers,coalesce(ohtable.ohcount,0) as ohcount from (SELECT C.user_id,U.computing_id,U.fname,U.lname from (users U JOIN user_courses C ON U.id=C.user_id) where C.course_id=$1 and C.role=\'student\') usertable LEFT JOIN (SELECT S.user_id, COUNT(*) AS subcount FROM (submissions S JOIN assignments A ON S.assignment_id=A.id) WHERE A.course_id=$2 and (S.score / S.max_score)<0.6 GROUP BY user_id) gradestable on usertable.user_id=gradestable.user_id LEFT JOIN (SELECT P.user_id,P.posts,P.asks,P.answers from piazza_raw_stats P where P.course_id=$3) piazzatable on piazzatable.user_id=usertable.user_id LEFT JOIN (SELECT U.user_id,COUNT(*) AS ohcount FROM (sessions Q JOIN session_users U on Q.id=U.session_id) where Q.course_id=$4 and U.role=\'student\' GROUP BY user_id) ohtable on ohtable.user_id=usertable.user_id where gradestable.subcount>=0 ORDER BY gradestable.subcount DESC LIMIT 30';



        $result = $this->db->query($query, array($course_id, $course_id, $course_id, $course_id));

        $students = $this->db->fetchAll($result);

        return $students;
    }

    
   
}
