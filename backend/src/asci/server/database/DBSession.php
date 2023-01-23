<?php

namespace asci\server\database;

/*
 * Interacts with the database to fetch sessions and data about sessions.
 */
class DBSession
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
     * Fetches the most recent "waiting" or "in-progress" session for the given
     * userId courseId combination.
     *
     * RETURNS: Session object
     */
    public function getSessionsForUser($user_id, $course_id)
    {
        $query = 'select * from sessions S JOIN session_users U on S.id = U.session_id where user_id=$1 and course_id=$2 and (status=\'waiting\' or status=\'in_progress\')';

        $this->logger->addWarning("getSessions", array("query" => $query));
        $this->logger->addWarning("getSessions", array("userId" => $user_id, "course_id" => $course_id));

        $result = $this->db->query($query, array($user_id, $course_id));
        $session = $this->db->fetchrow($result);

        $this->logger->addWarning("getSessions", array("session" => $session));

        if($session == null){
            $this->logger->addWarning("SESSION IS NULL", array("query" => $query));
            return null;
        }
        else{
            $this->logger->addWarning("SESSION IS NOT NULL", array("query" => $query));

            return (new \asci\data\Session())->fromArray($session);
        }


    }

    /*
     * Creates a new session for this user in this course and sets state to 
     * "waiting". 
     * 
     * Returns Session object of new session or null if none created
     */
    public function createNewStudentSession($user_id, $course_id, $role, $question){

        $query = 'insert into sessions (course_id, issue, issue_subject, status, entry_time, fulfillment_time, exit_time) values ($1, $2, $3, \'waiting\', now(), null, null) returning id';

        $result = $this->db->query($query, array($course_id, $question, $question));
        $id = $this->db->fetchrow($result)["id"];

        if($id == null){
            return null;
        }
        else{

            //insert a session_users row for this combo
            $query = 'insert into session_users (session_id, user_id, role) values ($1, $2, $3)';
            $result = $this->db->query($query, array($id, $user_id, $role));            

            return $this->getSessionsForUser($user_id, $course_id);

        }

    }

    /*
     * Closes all sessions associated with this user_id course combination
     * by setting each to "completed"
     */
    public function closeAllSessions($user_id, $course_id){

        $query = 'update sessions set status = \'completed\' from (select * from sessions JOIN session_users on id=session_id) S where S.id = sessions.id and sessions.course_id=$1 and S.user_id=$2';

        $result = $this->db->query($query, array($course_id, $user_id));
        
        return true;

    }


    /*
     * Fetches the Session for this courseId that has been in the "waiting"
     * state the longest.
     */
    public function getLongestWaitingSession($course_id){

        $query = 'select * from sessions where course_id=$1 order by entry_time';

        $result = $this->db->query($query, array($course_id));
        $row = $this->db->fetchrow($result);

        if ($row != null){
            $sess = new \asci\data\Session();
            $sess->fromArray($row);
            return $sess;
        }
        
        return null;

    }

    /*
     * Sets the current session to 'in-progress' and sets the fulfillment time
     */
    public function fulfillSession($session_id){
        $query = 'update sessions set status=\'in_progress\', fulfillment_time=now() where id=$1';

        $result = $this->db->query($query, array($session_id));

        return $result;
    }

    
   
}
