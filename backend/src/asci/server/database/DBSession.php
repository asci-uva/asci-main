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
     * Updates the session with the provided one
     */
    public function update($session){
        $query = 'UPDATE sessions SET
            id = $1,
            course_id = $2,
            issue = $3,
            issue_subject = $4,
            location = $5,
            status = $6,
            group_option = $7,
            entry_time = $8,
            fulfillment_time = $9,
            exit_time = $10
            WHERE id = $11';

        $result = $this->db->query($query, array(
            $session->getId(),
            $session->getCourseId(),
            $session->getIssue(),
            $session->getIssueSubject(),
            $session->getLocation(),
            $session->getStatus(),
            $session->getGroupOption(),
            $session->getEntryTime(),
            $session->getFulfillmentTime(),
            $session->getExitTime(),
            $session->getId(),
        ));

        if($result) return true;
        else return false;
    }


    /*
     * Gets a session by session_id
     */
    public function getSession($session_id){
        $query = 'select * from sessions where id=$1';

        $result = $this->db->query($query, array($session_id));
        $session = $this->db->fetchrow($result);

        if($session == null){
            return null;
        }

        return (new \asci\data\Session())->fromArray($session);
    }

    /*
     * Fetches the session object (with user role and id) by a specific session id.
     *
     * RETURNS: Session object (with user id and role filled in)
     */
    public function getSessionForUserById($user_id, $session_id)
    {
        $query = 'select * from sessions S JOIN session_users U on S.id = U.session_id where user_id=$1 and session_id=$2';


        $result = $this->db->query($query, array($user_id, $session_id));
        $session = $this->db->fetchrow($result);


        if($session == null){
            return null;
        }
        else{

            return (new \asci\data\Session())->fromArray($session);
        }


    }

    /*
     * Fetches the most recent "waiting" or "in-progress" session for the given
     * userId courseId combination.
     *
     * RETURNS: Session object
     */
    public function getSessionForUser($user_id, $course_id)
    {
        $query = 'select * from sessions S JOIN session_users U on S.id = U.session_id where user_id=$1 and course_id=$2 and (S.status!=\'completed\') and U.user_status = \'active\'';


        $result = $this->db->query($query, array($user_id, $course_id));
        $session = $this->db->fetchrow($result);


        if($session == null){
            return null;
        }
        else{

            return (new \asci\data\Session())->fromArray($session);
        }


    }



    /*
     * Creates a new session for this user in this course and sets state to 
     * "waiting". 
     * 
     * Returns Session object of new session or null if none created
     */
    public function createNewSession($user_id, $course_id, $role, $question, $subject, $location, $status, $groupOption){

        $query = 'insert into sessions (course_id, issue, issue_subject, location, status, group_option, entry_time, fulfillment_time, exit_time) values ($1, $2, $3, $4, $5, $6, now(), null, null) returning id';

        $result = $this->db->query($query, array($course_id, $question, $subject, $location, $status, $groupOption));
        $id = $this->db->fetchrow($result)["id"];

        if($id == null){
            return null;
        }
        else{

            //insert a session_users row for this combo
            //TODO: THIS REALLY SHOULDN"T BE A PART OF THIS METHOD.
            $query = 'insert into session_users (session_id, user_id, role, user_status) values ($1, $2, $3, $4)';
            $result = $this->db->query($query, array($id, $user_id, $role, 'active'));            

            return $this->getSessionForUser($user_id, $course_id);

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
     * Closes all sessions associated with this user_id course combination
     * by setting each to "completed" EXCEPT the one provided
     */
    public function closeAllOtherSessions($user_id, $course_id, $session_id){

        $query = 'update sessions set status = \'completed\' from (select * from sessions JOIN session_users on id=session_id) S where S.id = sessions.id and sessions.course_id=$1 and S.user_id=$2 and sessions.id != $3';

        $result = $this->db->query($query, array($course_id, $user_id, $session_id));
        
        return true;

    }

    /*
     * Returns the number of students waiting in the course
     */
    public function getNumWaiting($course_id){

        $query = 'select count(*) from sessions where course_id=$1 and status=\'waiting\'';

        $result = $this->db->query($query, array($course_id));
        $row = $this->db->fetchrow($result);

        if ($row != null){
            return $row;
        }
        
        return null;

    }


    /*
     * Fetches the Session for this courseId that has been in the "waiting"
     * state the longest that this TA has NO session for already
     */
    public function getLongestWaitingSession($ta_id, $course_id){

        //Normal get not caring about session status
        $query = 'select * from sessions where course_id=$1 and status=\'waiting\' and id not in (select distinct S.id from (sessions S join session_users U on S.id=U.session_id) where U.user_id=$2) order by entry_time';

        $result = $this->db->query($query, array($course_id, $ta_id));
        $row = $this->db->fetchrow($result);

        if ($row != null){
            $sess = new \asci\data\Session();
            $sess->fromArray($row);
            return $sess;
        }
        
        return null;

    }



    /*
     * Gets the most recent session (fulfillment_time) for which no survey
     * has been submitted by the current user
     */
    public function getSessionWithNoSurvey($user_id, $course_id){
        $query = 'SELECT * FROM (sessions S JOIN session_users U on S.id=U.session_id) where U.user_id=$1 and S.course_id=$2 and S.id not in (SELECT session_id FROM survey where user_id=$3) and S.fulfillment_time IS NOT NULL order by S.fulfillment_time DESC';

        $result = $this->db->query($query, array($user_id, $course_id, $user_id));
        $session = $this->db->fetchrow($result);

        if($session == null){
            return null;
        }

        return (new \asci\data\Session())->fromArray($session);
    }

    /*
     * Sets the current session to 'in-progress' and sets the fulfillment time
     */
    public function fulfillSession($session_id, $group_option){
        /* If no grouping, just set status to in progress for the one student */
        /* If grouping, set status to the temporary "grouping" state while TA selects group */
        $status = "in_progress";
        if($group_option == "true"){
            $status = "grouping";
        }
        $query = 'update sessions set status=$2, fulfillment_time=now() where id=$1';

        $result = $this->db->query($query, array($session_id, $status));

        return $result;
    }

    /*
     * Sets the current session to 'on-hold' and sets the fulfillment time
     */
    public function holdSession($session_id){
        $query = 'update sessions set status=\'on_hold\', fulfillment_time=now() where id=$1';

        $result = $this->db->query($query, array($session_id));

        return $result;
    }


    /*
     * Ends Session with session_id by setting exit_time and status
     */
    public function endSession($session_id){
        $query = 'update sessions set status=\'completed\', exit_time=now() where id=$1';

        $result = $this->db->query($query, array($session_id));

        return $result;
    }

    public function getPotentialGroupSessions($course_id, $limit=6){
        $query = 'SELECT * FROM sessions S WHERE S.status=\'waiting\' AND S.course_id=$1 ORDER BY S.entry_time LIMIT $2';

        $result = $this->db->query($query, array($course_id, $limit));

        $sessions = [];
        while($row = $this->db->fetchrow($result)){
            $sessions[] = (new \asci\data\Session())->fromArray($row);
        }

        return $sessions;


    }
   
}
