<?php

/**
 * Server Executor Class File
 *
 * Contains the ServerExector class that performs all the tasks for the main Server
 *
 * @author Robbie Hott
 * @license https://opensource.org/licenses/BSD-3-Clause BSD 3-Clause
 * @copyright 2016 the Rector and Visitors of the University of Virginia, and
 *            the Regents of the University of California
 */
namespace asci\server;
//todo: we might want seperate classes around certain functionality 
use asci\server\database\DatabaseConnector as DatabaseConnector;

class ServerExecutor{
    /**
     * Database connector object
     *
     * @var \asci\server\database\DatabaseConnector object.
     */

    //Database connection and database interactive model objects
    private $db = null;
    public $userStore = null; // The user storage 

    //Model state (NOT interacting with DB)
    //NONE YET BUT COMING SOON

    //Result that is passed back to Server
    public $result = null;


    //Logging
    private $logger;

    /***
     *  index.php --> Server.run() --> ServerExecutor functions (do the work)
     *
     *  CONTROLLER -- /server
     *  ServerExecutor:
     *      - db --- connection to the database
     *      - userStore --- a DBUser object (functions to handle user stuff)
     *          - DBUser takes User object, calls functions in SQL.php that actually have SQL
     *
     *  MODEL     -- /data
     *  Data objects:
     *      - /data/User - A user object (name, id, ...)
     *          - fetch from the DB use userStore (DBuser->fetchUser())
     *          - instantiate from front end and verify by fetch to DB
     *
     */


    public function __construct(){
        global $log;
        
        $this->db = new \asci\server\database\DatabaseConnector();
        $this->userStore = new \asci\server\database\DBUser($this->db);
        // Check $_SERVER["uid"]; // their computing ID  (name and id can come from roster)

        // create a log channel
        $this->logger = new \Monolog\Logger('ServerExecutor');
        $this->logger->pushHandler($log);
    }



    /*
     * General function for creating (and returning) an error
     * used anytime a general error is found and occurs
     */
    public function err($errorText){
        $result = [];
        $result["success"] = "false";
        $result["error"] = $errorText;
        return $result;
    }


    /**
     * Handle User Login
     *
     * Sets current session for new
     *
     * @return bool login success
     */
    public function loginHandler($computing_id){
        $user = $this->userStore->getUser($computing_id)->toArray();

        if($user == null || $user["computing_id"] == null){
            $user = ["success" => "false"];
        }
        else{
            $user["success"] = "true";
        }

        return $user;
    }

    /*
     * Given a user, gets all the courses that user is associated with 
     * in the system. See UserCourse for object structure
    */
    public function getCoursesHandler($computing_id){
        $result = [];

        $courses = (new \asci\server\database\DBUserCourse($this->db))->getCoursesForUser($computing_id);

        $result["courses"] = [];
        foreach ($courses as $course){
            $result["courses"][$course->getCourseId()] = $course->toArray();
        }

        $result["success"] = "true";

        return $result;
    }

    /*
     * Given comp_id and course_id, gets the current state the user is in
     * 
     */
    public function sessionPingHandler($computing_id, $course_id){
        //0: Grab the user
        $user = $this->userStore->getUser($computing_id);
 
        //1: Get UserCourse (add function to get just one course)
        $course = (new \asci\server\database\DBUserCourse($this->db))->getCourseForUser($user->getComputingId(), $course_id);

        //2: See if a session already exists for this person / course combo?
        $session = (new \asci\server\database\DBSession($this->db))->getSessionForUser($user->getId(), $course->getCourseId());

        $response = [];
        $response["usercourse"] = $course->toArray();
        $response["session"] = ($session === null) ? null : $session->toArray();
        $response["success"] = "true";

        return $response;

    }

    public function joinQueueHandler($computing_id, $course_id, $question, $subject, $location, $is_group){

        //0: Grab the user
        $user = $this->userStore->getUser($computing_id);
 
        //1: Get UserCourse (add function to get just one course)
        $course = (new \asci\server\database\DBUserCourse($this->db))->getCourseForUser($user->getComputingId(), $course_id);


        //2: See if a session already exists for this person / course combo?
        $dbsession = new \asci\server\database\DBSession($this->db);
        $session = $dbsession->getSessionForUser($user->getId(), $course->getCourseId());

        $result = [];
        $result["usercourse"] = $course->toArray();

        //If no session yet, insert one and send the new one back
        if($session == null){
            //create a new one and return it back
            $session = $dbsession->createNewStudentSession($user->getId(), $course->getCourseId(), $course->getRole(), $question, $subject, $location, $is_group);
            $result["session"] = $session->toArray();
        }
        else{
            //session already active, just use it.
            $result["session"] = $session->toArray();
        }

        $result["success"] = "true";

        return $result;
    }



    /*
     * Fetches and active session (waiting or in-progress) for the given computing id
     * and returns it if it exists
     */
    public function getQueueStatus($computing_id, $course_id){

        //0: Grab the user
        $user = $this->userStore->getUser($computing_id);
 
        //1: Get UserCourse (add function to get just one course)
        $course = (new \asci\server\database\DBUserCourse($this->db))->getCourseForUser($user->getComputingId(), $course_id);


        //2: See if a session already exists for this person / course combo?
        $dbsession = new \asci\server\database\DBSession($this->db);
        $session = $dbsession->getSessionForUser($user->getId(), $course->getCourseId());

        $result = [];
        $result["user"] = $user->toArray();
        $result["usercourse"] = $course->toArray();

        //If no session yet, insert one and send the new one back
        if($session == null){
            $result["session"] = null;
        }
        else{
            //session already active, just use it.
            $result["session"] = $session->toArray();
        }

        $result["success"] = "true";

        return $result;
    }

    public function leaveQueue($computing_id, $course_id){

        //0: Grab the user
        $user = $this->userStore->getUser($computing_id);

        //2: See if a session already exists for this person / course combo?
        $dbsession = new \asci\server\database\DBSession($this->db);
        $session = $dbsession->closeAllSessions($user->getId(), $course_id);

        $result = [];
        $result["user"] = $user->toArray();
        $result["success"] = "true";

        return $result;
    }

    
    /*
     * Given TA computing id and courseId, get a student for this TA to work
     * with and setup DB to reflect this.
     */
    public function getStudentForTA($computing_id, $course_id){
        //DB objects we will be using
        $dbsession = new \asci\server\database\DBSession($this->db);
        $dbsessusr = new \asci\server\database\DBSessionUser($this->db);

        //0: Grab the user
        $user = $this->userStore->getUser($computing_id);

        $result = [];

        //2: Grab the next student that is waiting
        $session = $dbsession->getLongestWaitingSession($user->getId(), $course_id);

        if($session == null){
            $result["success"] = "false";
            $result["error"] = "No student in queue";
            return $result;
        }

        //Ok, we have a waiting session. Let's get the session_user
        $sessUsr = $dbsessusr->getSessionUserByRole($session->getId(), 'student');

        if($sessUsr == null){
            $result["success"] = "false";
            $result["error"] = "ERROR: Session does not have any associated students";
            return $result;
        }

        //Get the student that the TA will be helping
        $student = $this->userStore->getUser($sessUsr->getUserId());

        //Ok, we have info, let's create a user session for TA that is helping
        $TASessUsr = new \asci\data\SessionUser();
        $TASessUsr->fromParams($user->getId(), $session->getId(), 'ta', 'active');
        $dbsessusr->insert($TASessUsr);

        //Ok, Let's update the session itself
        $dbsession->fulfillSession($session->getId());

        $result["success"] = "true";
        $result["error"] = "none";

        return $result;
    }


    /*
     * Given the Student's computing Id and courseId
     * gets the meeting details for the Student
     */
    public function getMeetingDetails($computing_id, $course_id){
        //DB objects we will be using
        $dbsession = new \asci\server\database\DBSession($this->db);
        $dbsessusr = new \asci\server\database\DBSessionUser($this->db);

        //0: Grab the user
        $user = $this->userStore->getUser($computing_id);

        $result = [];

        //2: Grab the next student that is waiting
        $session = $dbsession->getSessionForUser($user->getId(), $course_id);

        if($session == null){
            $result["success"] = "false";
            $result["error"] = "No session exists for this Student Course combo";
            return $result;
        }
        else if($session->getStatus() != "in_progress"){
            $result["success"] = "false";
            $result["error"] = "session is not in the in_progress state (and it should be)";
            return $result;
        }

        //Ok, let's try to grab the ta's information
        $sessUsr = $dbsessusr->getSessionUserByRole($session->getId(), 'ta');

        if($sessUsr == null){
            $result["success"] = "false";
            $result["error"] = "ERROR: Session does not have any associated tas";
            return $result;
        }

        //Now, grab the ta
        $ta = $this->userStore->getUserById($sessUsr->getUserId());

        if($ta == null){
            $result["success"] = "false";
            $result["error"] = "ERROR: Could not find ta information for session";
            return $result;
        }

        //Done. Set up the info to return
        $result["success"] = "true";
        $result["session"] = $session->toArray();
        $result["ta"] = $ta->toArray();
        $result["error"] = "none";

        return $result;
    }


    /*
     * Given the TAs computing Id and courseId
     * gets the meeting details for the TA
     */
    public function getTAMeetingDetails($computing_id, $course_id){
        //DB objects we will be using
        $dbsession = new \asci\server\database\DBSession($this->db);
        $dbsessusr = new \asci\server\database\DBSessionUser($this->db);

        //0: Grab the user
        $user = $this->userStore->getUser($computing_id);

        $result = [];

        //2: Grab the next student that is waiting
        $session = $dbsession->getSessionForUser($user->getId(), $course_id);

        if($session == null){
            $result["success"] = "false";
            $result["error"] = "No session exists for this TA course combo";
            return $result;
        }
        else if($session->getStatus() != "in_progress"){
            $result["success"] = "false";
            $result["error"] = "session is not in the in_progress state (and it should be)";
            return $result;
        }

        //Ok, let's try to grab the student's information
        $sessUsr = $dbsessusr->getSessionUserByRole($session->getId(), 'student');

        if($sessUsr == null){
            $result["success"] = "false";
            $result["error"] = "ERROR: Session does not have any associated students";
            return $result;
        }

        //Now, grab the student
        $student = $this->userStore->getUserById($sessUsr->getUserId());

        if($student == null){
            $result["success"] = "false";
            $result["error"] = "ERROR: Could not find student information for session";
            return $result;
        }

        //Done. Set up the info to return
        $result["success"] = "true";
        $result["session"] = $session->toArray();
        $result["student"] = $student->toArray();
        $result["error"] = "none";

        return $result;
    }

    /*
     * Given a computing_id and session_id, end the session
     * IF computing_id is actually part of that session
     * AND the session status is currently "in_progress"
     */
    public function endSession($computing_id, $session_id){
        //DB objects we will be using
        $dbsession = new \asci\server\database\DBSession($this->db);
        $dbsessusr = new \asci\server\database\DBSessionUser($this->db);

        //0: Grab the user
        $user = $this->userStore->getUser($computing_id);

        $result = [];

        //2: grab the session
        $session = $dbsession->getSession($session_id);

        if($session == null){
            $result["success"] = "false";
            $result["error"] = "No session exists with the provided session_id";
            return $result;
        }
        else if($session->getStatus() == "completed"){
            $result["success"] = "true";
            $result["session"] = $session->toArray();
            $result["error"] = "Warning: Session already completed by another party";
            return $result;
        }
        else if($session->getStatus() != "in_progress"){
            $result["success"] = "true";
            $result["error"] = "Warning: Session is not in progress. Possibly because TA put student back on queue";
            return $result;
        }

        //Ok, let's grab the session_usr and make sure the user that 
        //is trying to end this session is actually a part of that session
        $sessUsr = $dbsessusr->getSessionUser($user->getId(), $session->getId());

        if($sessUsr == null){
            $result["success"] = "false";
            $result["error"] = "This user is not a part of this session, so cannot end it";
            return $result;
        }

        //Ok, go ahead and end the session
        if($dbsession->endSession($session_id)){
            //Done. Set up the info to return
            $result["success"] = "true";
            $result["session"] = $session->toArray();
            $result["error"] = "none";
            return $result;
        }
        else{
            $result["success"] = "false";
            $result["error"] = "Something updating session to completed status";
            return $result;
        }
    }


    /*
     * Given computing id and course_id, return number of students
     * in queue iff user is ta for that course
     */
    public function getNumberWaiting($computing_id, $course_id){
        //DB objects we will be using
        $dbsession = new \asci\server\database\DBSession($this->db);
        $dbsessusr = new \asci\server\database\DBSessionUser($this->db);

        //0: Grab the user
        $user = $this->userStore->getUser($computing_id);

        $result = [];

        //Get the UserCourse object
        $userCourse = (new \asci\server\database\DBUserCourse($this->db))->getCourseForUser($user->getComputingId(), $course_id);

        if($userCourse == null){
            $result["success"] = "false";
            $result["error"] = "ERROR: This user not associated with this course";
            return $result;
        }
        else if($userCourse->getRole() != "ta"){
            $result["success"] = "false";
            $result["error"] = "ERROR: This user not a ta for this course";
            return $result;
        }

        //Ok, looks good. Grab the number of waiting students
        $numWaiting = $dbsession->getNumWaiting($course_id);

        if($numWaiting == null){
            $result["success"] = "false";
            $result["error"] = "ERROR: Failed to fetch number of students waiting";
            return $result;
        }

        $result["success"] = "true";
        $result["waiting"] = $numWaiting["count"];
        $result["usercourse"] = $userCourse->toArray();
        return $result;
    }

    /*
     * Given a computing_id (ta), computing_id (student) and session_id
     * Put the student back on the queue
     * by closing students other sessions (make them inactive)
     * AND resetting the fulfillment time of this session
     * AND set session back to "waiting" state
     */
    public function putStudentBackOnQueue($user, $studentId, $sessionId){
        //DB objects we will be using
        $dbsession = new \asci\server\database\DBSession($this->db);
        $dbsessusr = new \asci\server\database\DBSessionUser($this->db);

        //0: Grab the user and student
        $ta = $this->userStore->getUser($user);
        $student = $this->userStore->getUser($studentId);

        $result = [];

        //2: grab the session
        $session = $dbsession->getSession($sessionId);

        if($session == null){
            $result["success"] = "false";
            $result["error"] = "No session exists with the provided session_id";
            return $result;
        }

        //Ok, let's grab the session_usr for the student and ta
        $sessUsrTA = $dbsessusr->getSessionUser($ta->getId(), $session->getId());
        $sessUsrStudent = $dbsessusr->getSessionUser($student->getId(), $session->getId());

        if($sessUsrTA == null || $sessUsrStudent == null){
            $result["success"] = "false";
            $result["error"] = "This TA or Student is not a part of this session, so cannot end it";
            return $result;
        }

        //Ok, we need to end any other session the student is a part of
        $dbsession->closeAllOtherSessions($student->getId(), $session->getCourseId(), $session->getId());

        //Now set the session to 'waiting' with a new fulfillment time
        $session->fulfillment_time = "now()";
        $session->status = "waiting";
        $res1 = $dbsession->update($session);

        //Now set the session_user for the ta to inactive
        $sessUsrTA->user_status = 'inactive';
        $res2 = $dbsessusr->update($sessUsrTA);

        if($res1 && $res2){
            $result["success"] = "true";
            return $result;
        }
        else{
            $result["success"] = "false";
            $result["error"] = "Something went wrong. Updating session users failed";
            return $result;
        }
    }



    /*
     * Grabs the session info by session id for a survey. Very similar to
     * get meeting details but with a set session id.
     */
    public function getSessionForSurvey($computing_id, $course_id, $session_id){
        /* Database Objects we are going to need */
        $dbsession = new \asci\server\database\DBSession($this->db);
        $dbsessusr = new \asci\server\database\DBSessionUser($this->db);

        /* Grab the user object */
        $user = $this->userStore->getUser($computing_id);

        /* This method grabs the session obj for needed survey */
        $session = $dbsession->getSessionForUserById($user->getId(), $session_id);

        if($session == null)
            return $this->err("There is no session for this user with this session id to survey");

        /* Ok, get the person with the other role (through the session user obj) */
        $role = "student";
        if($session->getRole() == "student") $role = "ta"; //opposite role as this user

        $sessUsr = $dbsessusr->getSessionUserByRole($session->getId(), $role);

        if($sessUsr == null)
            return $this->err("ERROR: Session does not have any associated other user");

        /* Now grab the other user */
        $other = $this->userStore->getUserById($sessUsr->getUserId());

        if($other == null)
            return $this->err("ERROR: Could not find student information for session");

        //Done. Set up the info to return
        $result = [];
        $result["success"] = "true";
        $result["session"] = $session->toArray();
        $result["other"] = $other->toArray();
        $result["error"] = "none";

        return $result;
    }


    /*
     * For the given computing id. Get the most recent session for which
     * this user has NOT submitted a survey yet. We are going to use
     * fulfillment_time for recency here (possible exit_time not set yet)
     */
    public function getMostRecentSessionWithNoSurvey($computing_id, $course_id){

        /* Database Objects we are going to need */
        $dbsession = new \asci\server\database\DBSession($this->db);
        $dbsessusr = new \asci\server\database\DBSessionUser($this->db);

        /* Grab the user object */
        $user = $this->userStore->getUser($computing_id);

        /* This method grabs the session obj for needed survey */
        $session = $dbsession->getSessionWithNoSurvey($user->getId(), $course_id);

        if($session == null)
            return $this->err("There is no session for this user course combo to survey");

        /* Ok, get the person with the other role (through the session user obj) */
        $role = "student";
        if($session->getRole() == "student") $role = "ta"; //opposite role as this user

        $sessUsr = $dbsessusr->getSessionUserByRole($session->getId(), $role);

        if($sessUsr == null)
            return $this->err("ERROR: Session does not have any associated other user");

        /* Now grab the other user */
        $other = $this->userStore->getUserById($sessUsr->getUserId());

        if($other == null)
            return $this->err("ERROR: Could not find student information for session");

        //Done. Set up the info to return
        $result = [];
        $result["success"] = "true";
        $result["session"] = $session->toArray();
        $result["other"] = $other->toArray();
        $result["error"] = "none";

        return $result;
    }

    
    /*
     * Inserts the survey into the DB
     */
    public function handleSubmitSurvey($computing_id, $session_id, $surveyArray){

        /* Grab the user first */
        $user = $this->userStore->getUser($computing_id);

        //Create a survey object from the given array
        $survey = new \asci\data\Survey();
        $survey->fromArray($surveyArray);

        /* Manually add user id and session id to survey object */
        $survey->user_id = $user->getId();
        $survey->session_id = $session_id;

        //Some DB objects we will be using
        $dbsession = new \asci\server\database\DBSession($this->db);
        $dbsessusr = new \asci\server\database\DBSessionUser($this->db);
        $dbsurvey = new \asci\server\database\DBSurvey($this->db);

        //-------------------------------------------
        //Check if this user is actually a part of this session
        //-------------------------------------------
        //Grab the user and session
        $session = $dbsession->getSession($session_id);

        $result = [];

        if($session == null){
            $result["success"] = "false";
            $result["error"] = "No session exists with the provided session_id";
            return $result;
        }

        $sessUsr = $dbsessusr->getSessionUser($user->getId(), $session->getId());

        if($sessUsr == null){
            $result["success"] = "false";
            $result["error"] = "This TA or Student is not a part of this session, so cannot submit a survey";
            return $result;
        }
        //-------------------------------------------
        //END: User is a part of this session
        //-------------------------------------------

        //-------------------------------------------
        //Write the survey down to the database and return results
        //-------------------------------------------
        $success = $dbsurvey->write($survey);

        if($success){
            $result["success"] = "true";
            return $result;
        }
        else{
            $result["success"] = "false";
            $result["error"] = "Something went wrong writing the survey down to the database.";
            return $result;
        }

        //-------------------------------------------
        //-------------------------------------------
    }


    /**
     * Creates a new User in the database
     *
     * Generates password, new User then stores into DB
     *
     * @return bool login success
     */
    public function createUser($data) {
        $data["password"] = password_hash($data["password"], PASSWORD_DEFAULT);
        $user = new \asci\data\User($data);

        return $this->userStore->createUser($user);
    }

    public function createCourse($data) {
        $course = new \asci\data\Course($data);
        return $this->userStore->createCourse($course);
    }

    public function registerUser($data) {
        return $this->userStore->register($data["userid"],$data["password"]);
    }

    
}
