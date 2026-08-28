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
        //combines the grades, exam performance, piazza, and office hours data into one summary table.
        $query='SELECT usertable.*, gradestable.subcount, piazzatable.posts, piazzatable.asks, piazzatable.answers, coalesce(ohtable.ohcount,0) as ohcount, examtable.exam_avg, homeworktable.homework_avg, quiztable.quiz_avg
                FROM (SELECT C.user_id, U.computing_id, U.fname, U.lname
                      FROM (users U JOIN user_courses C ON U.id = C.user_id)
                      WHERE C.course_id = $1 AND C.role = \'student\') usertable
                LEFT JOIN (SELECT S.user_id, COUNT(*) AS subcount
                           FROM (submissions S JOIN assignments A ON S.assignment_id = A.id)
                           WHERE A.course_id = $2 AND (S.score / S.max_score) < 0.6
                           GROUP BY S.user_id) gradestable
                    ON usertable.user_id = gradestable.user_id
                LEFT JOIN (SELECT P.user_id, P.posts, P.asks, P.answers
                           FROM piazza_raw_stats P
                           WHERE P.course_id = $3) piazzatable
                    ON piazzatable.user_id = usertable.user_id
                LEFT JOIN (SELECT U.user_id, COUNT(*) AS ohcount
                           FROM (sessions Q JOIN session_users U ON Q.id = U.session_id)
                           WHERE Q.course_id = $4 AND U.role = \'student\'
                           GROUP BY U.user_id) ohtable
                    ON ohtable.user_id = usertable.user_id
                LEFT JOIN (SELECT S.user_id, AVG((S.score / S.max_score) * 100.0) AS exam_avg
                           FROM submissions S
                           JOIN assignments A ON S.assignment_id = A.id
                           WHERE A.course_id = $2 AND A.type IN (\'midterm\', \'final_exam\') AND S.max_score > 0
                           GROUP BY S.user_id) examtable
                    ON examtable.user_id = usertable.user_id
                LEFT JOIN (SELECT S.user_id, AVG((S.score / S.max_score) * 100.0) AS homework_avg
                           FROM submissions S
                           JOIN assignments A ON S.assignment_id = A.id
                           WHERE A.course_id = $2 AND A.type = \'homework\' AND S.max_score > 0
                           GROUP BY S.user_id) homeworktable
                    ON homeworktable.user_id = usertable.user_id
                LEFT JOIN (SELECT S.user_id, AVG((S.score / S.max_score) * 100.0) AS quiz_avg
                           FROM submissions S
                           JOIN assignments A ON S.assignment_id = A.id
                           WHERE A.course_id = $2 AND A.type = \'quiz\' AND S.max_score > 0
                           GROUP BY S.user_id) quiztable
                    ON quiztable.user_id = usertable.user_id
                WHERE gradestable.subcount >= 0
                ORDER BY gradestable.subcount DESC
                LIMIT 30';



        $result = $this->db->query($query, array($course_id, $course_id, $course_id, $course_id));

        $students = $this->db->fetchAll($result);

        return $students;
    }

    
   
}
