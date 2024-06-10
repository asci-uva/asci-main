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

error_reporting(E_ALL);
ini_set('display_errors', 0);

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
     *  CONTROLLER -- /serverf
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

        $result = [];
        if($user == null || $user["computing_id"] == null){
            $result["success"] = "false";
        }
        else{
            $result["user"] = $user;
            $courses = $this->getCoursesHandler($computing_id);
            if ($courses["success"] == "true") {
                $result["courses"] = $courses["courses"];
            }
            $result["success"] = "true";
        }

        return $result;
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
     * Given a user and a role, gets all the courses that user is associated with that role
     * in the system. See UserCourse for object structure
    */
    public function getCoursesByRoleHandler($computing_id, $role){
        $result = [];
        
        $courses = (new \asci\server\database\DBUserCourse($this->db))->getCoursesForUserByRole($computing_id, $role);

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

    public function joinQueueHandler($computing_id, $course_id, $question, $subject, $location, $groupOption){

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
            $session = $dbsession->createNewSession($user->getId(), $course->getCourseId(), $course->getRole(), $question, $subject, $location, "waiting", $groupOption);
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

        //If no session yet, just return null
        if($session == null){
            $result["session"] = null;
        }
        else{
            //session already active, just use it.
            $result["session"] = $session->toArray();

            //setup the session_user too
            $dbsessionusr = new \asci\server\database\DBSessionUser($this->db);
            $result["session_user"] = $dbsessionusr->getSessionUser($user->getId(), $session->getId())->toArray();
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

        //Grab the settings for this course
        $dbcrsset = new \asci\server\database\DBCourseSettings($this->db);
        $settings = $dbcrsset->getCourseSettings($course_id);
        if($settings == null) return $this->err("This course id does not have any associated course settings");

        //2: Grab the next student that is waiting
        $session = $dbsession->getLongestWaitingSession($user->getId(), $course_id);

        if($session == null){
            $result["success"] = "false";
            $result["error"] = "No student in queue";
            return $result;
        }
        //Check if the student wants to be in a group
        $groupOption = $session->getGroupOption();
        if($groupOption == "true" && $settings->grouping_enabled=="t"){
            $result["group_option"] = "true";
        }
        else{
            $result["group_option"] = "false";
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
        $TASessUsr->fromParams($user->getId(), $session->getId(), 'ta', 'active', 'false');
        $dbsessusr->insert($TASessUsr);

        //Ok, Let's update the session itself
        $dbsession->fulfillSession($session->getId(), $result["group_option"]);

        $result["success"] = "true";
        $result["error"] = "none";

        return $result;
    }

    /*
     * Used when TA has asked to take a specific student off the queue
     */
    public function takeSpecificStudentForTA($computing_id, $course_id, $session_id){
        //DB objects we will be using
        $dbsession = new \asci\server\database\DBSession($this->db);
        $dbsessusr = new \asci\server\database\DBSessionUser($this->db);

        //0: Grab the user
        $user = $this->userStore->getUser($computing_id);

        $result = [];

        //Grab the settings for this course
        $dbcrsset = new \asci\server\database\DBCourseSettings($this->db);
        $settings = $dbcrsset->getCourseSettings($course_id);
        if($settings == null) return $this->err("This course id does not have any associated course settings");

        //2: Grab the session
        $session = $dbsession->getSession($session_id);

        if($session == null){
            return $this->err("Could not find the given session");
        }
        if($session->status != 'waiting'){
            return $this->err("Session is not in the waiting status");
        }
        if($session->course_id != $course_id){
            return $this->err("Session is not in the given course!");
        }
        
        //Check if the student wants to be in a group
        $groupOption = $session->getGroupOption();
        if($groupOption == "true" && $settings->grouping_enabled == "t"){
            $result["group_option"] = "true";
        }
        else{
            $result["group_option"] = "false";
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
        $TASessUsr->fromParams($user->getId(), $session->getId(), 'ta', 'active', 'false');
        $dbsessusr->insert($TASessUsr);

        //Ok, Let's update the session itself
        $dbsession->fulfillSession($session->getId(), $result["group_option"]);

        $result["success"] = "true";
        $result["error"] = "none";

        return $result;
    }

    /*
     * Get all the matched students' info and display it for the TA.
     */
    public function getPotentialGroupInfo($computing_id, $course_id){
        
        /* FIRST, GRAB JUST THE MAIN USER THE TA IS INTERACTING WITH */

        //DB objects we will be using
        $dbsession = new \asci\server\database\DBSession($this->db);
        $dbsessusr = new \asci\server\database\DBSessionUser($this->db);

        //0: Grab the user
        $user = $this->userStore->getUser($computing_id);

        $result = [];

        //2: Grab session for the given user (TA must be in the stud session at this point)
        $session = $dbsession->getSessionForUser($user->getId(), $course_id);

        if($session == null){
            $result["success"] = "false";
            $result["error"] = "No session exists for this TA course combo";
            return $result;
        }
        else if($session->getStatus() != "grouping"){
            $result["success"] = "false";
            $result["error"] = "session is not in the grouping state (and it should be)";
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

        /* SECOND, GRAB POTENTIAL GROUP MEMBERS TO ALSO SEND BACK */
        /* Limit is 30 but we will trim that down to max group size */
        $group_sessions = $dbsession->getPotentialGroupSessions($course_id, 30);
        $max_group_options = 8;

        /* TWO CASES: We want to group or we just take the top available (else clause) */
        if(count($group_sessions) > $max_group_options && \asci\Config::$SMART_GROUP_MATCHING){
            
            /* initialize cosine simulator class */
            $cosSim = new \asci\util\CosineSim();

            /* Construct the list of issues (first one is main student's issue) */
            $all_issues = [$session->issue_subject . " " . $session->issue];
            foreach($group_sessions as $grpsess){
                $all_issues[] = $grpsess->issue_subject . " " . $grpsess->issue;
            }

            /* Get the matches among everything */
            $buffer = $cosSim->findMatches($all_issues);

            $this->logger->addDebug("Cos Sim Buffer", array("buffer" => $buffer));

            /* If the cos. sim. call failed, report that to frontend */
            if($buffer == null || $buffer[0] != 0) return $this->err("Cosine similarity call failed");

            /* We made it, return the sessions (up to max) that we care about */
            $group_sessions_ret = [];
            $match_indices = explode("##", $buffer[1]);

            /* Special case, matches are nothing but "" */
            if(count($match_indices)==1 && $match_indices[0] == ""){
                $result["group_sessions"] = [];
            }
            else{
                $i=0;
                $this->logger->addDebug("Stuff", array("match ind" => $match_indices));
                while($i<$max_group_options && $i<count($match_indices)){
                    $group_sessions_ret[] = $group_sessions[$match_indices[$i]];
                    $i=$i+1;
                }
                $result["group_sessions"] = $group_sessions_ret;
            }
            
        }
        else{

            /* Trim down to max option size */
            if(count($group_sessions) > $max_group_options)
                $group_sessions = array_slice($group_sessions, 0, $max_group_options);
            $result["group_sessions"] = $group_sessions;
        }


        return $result;
    }

    /*
     * Put the chosen students into a group meeting
     * $ta_computing_id is the comp. id of the TA
     * $course_id is the id of the course
     * $session_id is the session of the main student TA is helping
     * $group_sessions is a list of the other sessions that should be joined with session_id
     */
    public function createGroup($ta_computing_id, $course_id, $session_id, $group_sessions, $location){

        //DB objects we will be using
        $dbsession = new \asci\server\database\DBSession($this->db);
        $dbsessusr = new \asci\server\database\DBSessionUser($this->db);
        $dbgroupmap = new \asci\server\database\DBGroupMapping($this->db);

        /* Grab the TA */
        $taUser = $this->userStore->getUser($ta_computing_id);

        /* First, set the main session to in_progress (easy part) */
        $mainSession = $dbsession->getSession($session_id);

        if($mainSession == null) return $this->err("No session exists for given sessionId");

        $mainSession->status = "in_progress";
        $result = $dbsession->update($mainSession);
        if(!$result) return $this->err("failure to update session to in_progress state");

        /* if group_sessions has any actual sessions to group in, then remove TA from main session and create a TA session to mash all users into */
        if(count($group_sessions) > 0){

            /* Remove the TA from the main session first!! */
            $taMainSessUsr = $dbsessusr->getSessionUser($taUser->id, $mainSession->id);
            if(!($dbsessusr->delete($taMainSessUsr))) return $this->err("Error deleting TA from main session");

            /* Now, create a new session for the TA to run for this group */
            $newTASess = $dbsession->createNewSession($taUser->id, $course_id, "ta", "Group session", "Group session", $location, "in_progress", "true");

            /* Link in the main session manually */
            $gr_map = new \asci\data\GroupMapping();
            $gr_map->from_session = $mainSession->id;
            $gr_map->to_session = $newTASess->id;
            $gr_map->status = "active";
            $result = $dbgroupmap->insert($gr_map);
            if(!$result) return $this->err("Error creating group session map");

            /* Then, for each group session, check if still waiting */
            /* If so, add a group mapping row to the main session and set to in progress */
            foreach($group_sessions as $gr_sess_id){
                /* gr_sess_id is just the id of the session, pull the session first */
                $gr_sess = $dbsession->getSession($gr_sess_id);
                if($gr_sess == null) return $this->err("Group sess id does not exist");

                /* If it is still waiting, change to in progress and write it */
                if($gr_sess->status == "waiting"){
                    $gr_sess->status = "in_progress";
                    $gr_sess->fulfillment_time = "now()";
                    $result = $dbsession->update($gr_sess);
                    if(!$result) return $this->err("Error updating group session to in progress");

                    /* Now create the group mapping for this session */
                    $gr_map = new \asci\data\GroupMapping();
                    $gr_map->from_session = $gr_sess_id;
                    $gr_map->to_session = $newTASess->id;
                    $gr_map->status = "active";

                    $result = $dbgroupmap->insert($gr_map);

                    if(!$result) return $this->err("Error creating group session map");

                }
            }
        }

        $result = [];
        $result["success"] = "true";
        return $result;

    }

    public function cancelGroup($ta_computing_id, $course_id, $session_id){

        //DB objects we will be using
        $dbsession = new \asci\server\database\DBSession($this->db);
        $dbsessusr = new \asci\server\database\DBSessionUser($this->db);

        /* Grab the TA */
        $taUser = $this->userStore->getUser($ta_computing_id);

        /* First, set the main session to in_progress (easy part) */
        $mainSession = $dbsession->getSession($session_id);

        if($mainSession == null) return $this->err("No session exists for given sessionId");

        //set session back to waiting
        $mainSession->status = "waiting";
        $result = $dbsession->update($mainSession);
        if(!$result) return $this->err("failure to update session to in_progress state");

        /* Grab the TA session user */
        $sessUsr = $dbsessusr->getSessionUser($taUser->id, $session_id);
        if($sessUsr==null) return err("No session user for this TA in this session");

        $dbsessusr->setInactive($sessUsr);

        $result = [];
        $result["success"] = "true";
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
        $dbgroupmap = new \asci\server\database\DBGroupMapping($this->db);

        //0: Grab the user
        $user = $this->userStore->getUser($computing_id);

        $result = [];

        /* Initially, result is NOT a group, but this could be overridden later */
        $result["is_group"] = false;
        $result["group_session"] = null;

        //2: Grab the session for this user that is active
        $session = $dbsession->getSessionForUser($user->getId(), $course_id);
        $group_session = null; //could be set later

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


        /* Session does not have a TA, might be a group meeting though */
        /* So, if not TA, throw error but if group set the group info up */
        if($sessUsr == null){
            
            /* See if an entry in the group mapping exists */
            $gr_map = $dbgroupmap->getMappingFromSession($session->id);

            if($gr_map == null){
                return $this->err("ERROR: Session does not have any associated tas and is not a group");
            }
            else{
                /* It is a group! */
                $result["is_group"] = true;

                /* Pull the OTHER user's session that this one was joined to */
                $group_session = $dbsession->getSession($gr_map->to_session);

                if($group_session == null) return $this->err("Student session is grouped, but not mapped to a valid other session");

                /* Grab the sess_usr from the group session instead */
                $sessUsr = $dbsessusr->getSessionUserByRole($group_session->getId(), 'ta');

                /* If still null, crash */
                if($sessUsr == null) return $this->err("group session has no ta associated");
            }

        }
        else{
            /* This user is being helped, but let's check if anybody is grouped TO them */
            $gr_map = $dbgroupmap->getMappingToSession($session->id);
            if(count($gr_map) > 0) $result["is_group"] = true;
        }

        //Now, grab the ta by either the group 
        $ta = $this->userStore->getUserById($sessUsr->getUserId());

        if($ta == null){
            $result["success"] = "false";
            $result["error"] = "ERROR: Could not find ta information for session";
            return $result;
        }

        //Done. Set up the info to return
        $result["success"] = "true";
        $result["session"] = $session->toArray();
        $result["group_session"] = $group_session;
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
        $dbgroupmap = new \asci\server\database\DBGroupMapping($this->db);

        //0: Grab the user
        $user = $this->userStore->getUser($computing_id);

        $result = [];

        /* Initially, result is NOT a group, but this could be overridden later */
        $result["is_group"] = false;
        $result["group_sessions"] = null;
        $result["group_members"] = null;

        //2: Grab the session that this TA is a part of
        $session = $dbsession->getSessionForUser($user->getId(), $course_id);

        if($session == null)
            return $this->err("No session exists for this TA course combo");    
        else if($session->getStatus() != "in_progress")
            return $this->err("session is not in the in_progress state (and it should be)");


        //Ok, let's try to grab the student's information
        $sessUsr = $dbsessusr->getSessionUserByRole($session->getId(), 'student');
        $student = null;
        
        //Now, grab the student if feasible
        if($sessUsr != null)
            $student = $this->userStore->getUserById($sessUsr->getUserId());


        /* See if any group members exist */
        $gr_map = $dbgroupmap->getMappingToSession($session->id);
        if(count($gr_map) > 0){
            $result["is_group"] = true;

            $group_sessions = [];
            $group_members = [];
            foreach($gr_map as $grm){
                $gr_sess = $dbsession->getSession($grm->from_session);
                if($gr_sess == null) return $this->err("There is a session mapped to this one that does not exist");

                $gr_stud = $dbsessusr->getSessionUserByRole($gr_sess->getId(), 'student');
                if($gr_stud == null) return $this->err("Group member does not exist");

                $gr_student = $this->userStore->getUserById($gr_stud->userId);
                if($gr_student == null) return $this->err("Group member does not exist");

                $group_sessions[] = $gr_sess;
                $group_members[] = $gr_student;
            }

            $result["group_sessions"] = $group_sessions;
            $result["group_members"] = $group_members;
        }

        //Done. Set up the info to return
        $result["success"] = "true";
        $result["session"] = $session;
        $result["student"] = $student;
        $result["error"] = "none";

        return $result;
    }

    /*
     * Given a computing_id and session_id, end the session
     * IF computing_id is actually part of that session
     * AND the session status is currently "in_progress"
     * Also ends any session that was added TO this one for group purposes
     */
    public function endSession($computing_id, $session_id){
        //DB objects we will be using
        $dbsession = new \asci\server\database\DBSession($this->db);
        $dbsessusr = new \asci\server\database\DBSessionUser($this->db);
        $dbgroupmap = new \asci\server\database\DBGroupMapping($this->db);

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

        if($sessUsr == null) return $this->err("This user is not a part of this session, so cannot end it");

        //Ok, go ahead and end the session
        if(!($dbsession->endSession($session_id))) return $this->err("Something went wrong when ending the session");

        /* Make all group sessions FROM this one inactive */
        if(!($dbgroupmap->endAllSessionsFrom($session_id))) return $this->err("Error ending group sessions from this one");

        /* Success! Now check for group sessions that were added to this one */
        $group_session_mappings = $dbgroupmap->getMappingToSession($session_id);
        foreach($group_session_mappings as $grp_sess_map){
            $from_sess_id = $grp_sess_map->from_session;

            /* Need to grab sessionuser to get userId */
            $grp_sess_usr = $dbsessusr->getSessionUserByRole($from_sess_id, 'student');
            if($grp_sess_usr == null) return $this->err("No session user for group mapping");

            $grp_user = $this->userStore->getUserById($grp_sess_usr->userId);
            if($grp_user == null) return $this->err("No group user found!");

            /* Recursively end the session that points to this one */
            $this->endSession($grp_user->computing_id, $from_sess_id);
        }


        //Done. Set up the info to return
        $result["success"] = "true";
        $result["session"] = $session->toArray();
        $result["error"] = "none";
        return $result;
    }


    /*
     * Given computing id and course_id, return number of students
     * in queue iff user is ta for that course
     */
    public function getWaitingSessions($computing_id, $course_id){
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
        else if($userCourse->getRole() != "ta" && $userCourse->getRole() != "instructor"){
            $result["success"] = "false";
            $result["error"] = "ERROR: This user not a ta for this course";
            return $result;
        }

        //Ok, looks good. Grab the number of waiting students
        $waitingSessions = $dbsession->getWaitingSessions($course_id);


        $result["success"] = "true";
        $result["waiting"] = count($waitingSessions);
        $result["sessions"] = $waitingSessions;
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
        $dbgroupmap = new \asci\server\database\DBGroupMapping($this->db);

        //0: Grab the user and student
        $ta = $this->userStore->getUser($user);
        $student = $this->userStore->getUser($studentId);

        $result = [];

        //2: grab the session
        $session = $dbsession->getSession($sessionId);

        if($session == null) return $this->err("No session exists with the provided session_id");

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

        if(!$res1 || !$res2) return $this->err("Error updating session or sess_user objects");

        /* See if any other sessions were grouped to this one. If so, put them back too */
        $grp_maps = $dbgroupmap->getMappingToSession($sessionId, 'active');

        foreach($grp_maps as $grp_map){
            
            /* Grab the session that was grouped to this one */
            $grp_sess = $dbsession->getSession($grp_map->from_session);

            if($grp_sess != null){
                $grp_sess->fulfillment_time = "now()";
                $grp_sess->status = "waiting";
                if(!$dbsession->update($grp_sess))
                    return $this->err("Error updating a group session to waiting");
            }

            $grp_map->status = 'inactive';
            if(!$dbgroupmap->update($grp_map)) return $this->err("Error updating grp map");
        }

        /* Made it! Return success!! */    
        $result["success"] = "true";
        return $result;
        
    }



    /*
     * Grabs the session info by session id for a survey. Very similar to
     * get meeting details but with a set session id.
     */
    public function getSessionForSurvey($computing_id, $course_id, $session_id){
        /* Database Objects we are going to need */
        $dbsession = new \asci\server\database\DBSession($this->db);
        $dbsessusr = new \asci\server\database\DBSessionUser($this->db);
        $dbgroupmap = new \asci\server\database\DBGroupMapping($this->db);

        /* Grab the user object */
        $user = $this->userStore->getUser($computing_id);

        /* This method grabs the session obj for needed survey */
        $session = $dbsession->getSessionForUserById($user->getId(), $session_id);

        if($session == null)
            return $this->err("There is no session for this user with this session id to survey");

        $sessionusr = $dbsessusr->getSessionUser($user->getId(), $session->getId());

        if($sessionusr == null)
            return $this->err("There is no session user for this user session combo to survey");

        /* Ok, get the person with the other role (through the session user obj) */
        $role = "student";
        if($sessionusr->getRole() == "student") $role = "ta"; //opposite role as this user

        $sessUsr = $dbsessusr->getSessionUserByRole($session->getId(), $role);

        /* Could be a group, so check for that */
        if($sessUsr == null){
            
            /* Not sure which way the relationship goes so check both */
            $grpMapStudentList = null;
            $grpMapTA = null;
            if($role == "student")
                $grpMapStudentList = $dbgroupmap->getMappingToSession($session_id, 'inactive');
            else
                $grpMapTA = $dbgroupmap->getMappingFromSession($session_id, 'inactive');

            if(($grpMapStudentList == null || count($grpMapStudentList) == 0) && $grpMapTA == null)
                return $this->err("ERROR: Cannot find other group member(s) for survey");

            /* Great! Pull other person from one of the two maps */
            $sessUsr = null;
            if($grpMapTA != null)
                $sessUsr = $dbsessusr->getSessionUserByRole($grpMapTA->to_session, 'ta');
            else if(count($grpMapStudentList) > 0)
                $sessUsr = $dbsessusr->getSessionUserByRole($grpMapStudentList[0]->from_session, 'student');


            if($sessUsr==null) return $this->err("grp session does not have ta either");
        }



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
        $dbgroupmap = new \asci\server\database\DBGroupMapping($this->db);

        /* Grab the user object */
        $user = $this->userStore->getUser($computing_id);

        /* This method grabs the session obj for needed survey */
        $session = $dbsession->getSessionWithNoSurvey($user->getId(), $course_id);

        if($session == null)
            return $this->err("There is no session for this user course combo to survey");

        /* Now get the session user */
        $sessionusr = $dbsessusr->getSessionUser($user->getId(), $session->getId());

        if($sessionusr == null)
            return $this->err("There is no session user for this user session combo to survey");

        /* Ok, get the person with the other role (through the session user obj) */
        $role = "student";
        if($sessionusr->getRole() == "student") $role = "ta"; //opposite role as this user

        $sessUsr = $dbsessusr->getSessionUserByRole($session->getId(), $role);

        /* Could be a group, so check for that */
        if($sessUsr == null){
            
            /* Not sure which way the relationship goes so check both */
            $grpMapStudentList = null;
            $grpMapTA = null;
            if($role == "student")
                $grpMapStudentList = $dbgroupmap->getMappingToSession($session->id, 'inactive');
            else
                $grpMapTA = $dbgroupmap->getMappingFromSession($session->id, 'inactive');

            if(($grpMapStudentList == null || count($grpMapStudentList) == 0) && $grpMapTA == null)
                return $this->err("ERROR: Cannot find other group member(s) for survey");

            /* Great! Pull other person from one of the two maps */
            $sessUsr = null;
            if($grpMapTA != null)
                $sessUsr = $dbsessusr->getSessionUserByRole($grpMapTA->to_session, 'ta');
            else if(count($grpMapStudentList) > 0)
                $sessUsr = $dbsessusr->getSessionUserByRole($grpMapStudentList[0]->from_session, 'student');


            if($sessUsr==null) return $this->err("grp session does not have ta either");
        }




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

    public function getCourseSettings($course_id){

        /* Database Object we are going to need */
        $dbcrsset = new \asci\server\database\DBCourseSettings($this->db);

        $settings = $dbcrsset->getCourseSettings($course_id);
        
        if($settings == null) return $this->err("This course id does not have any associated course settings");

        //Done. Set up the info to return
        $result = [];
        $result["success"] = "true";
        $result["settings"] = $settings->toArray();
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

    /*
     * Inserts the survey into the DB
     */
    public function clearQueue($computing_id, $course_id){

        /* Grab the user first */
        $user = $this->userStore->getUser($computing_id);

        //Some DB objects we will be using
        $dbsession = new \asci\server\database\DBSession($this->db);

        /* Make sure user is TA for this course */
        //Get the UserCourse object
        $userCourse = (new \asci\server\database\DBUserCourse($this->db))->getCourseForUser($user->getComputingId(), $course_id);

        if($userCourse == null) return $this->err("ERROR: This user not associated with this course");
        else if($userCourse->getRole() != "ta") return $this->err("ERROR: This user not a ta for this course");
        

        $result = [];

        $dbsession->closeAllSessionsForCourse($course_id);
        
        $result["success"] = "true";
        return $result;
        

        //-------------------------------------------
        //-------------------------------------------
    }

    // manually add student/ta to the course
    public function manuallyAddStudentHandler($fname, $lname, $pname, $computing_id, $role, $course_id) {
        $user = [
            'fname' => $fname,
            'lname' => $lname,
            'pname' => $pname,
            'computing_id' => $computing_id,
            'role' => $role
        ];
        
        $users = [$user];  // Wrap the single user in an outer array

        // Now, we can pass $users and $course_id to manuallyAddStudentsHandler        
        $results = (new \asci\server\database\DBUser($this->db))->ManuallyAddUsersForCourse($users, $course_id);

        // Here, $results is an associative array with computing_id as key and true/false as value indicating success/failure.
        $response = [];
        foreach ($results as $computing_id => $success) {
            if ($success) {
                $response[$computing_id] = ["success" => true];
            } else {
                $response[$computing_id] = ["success" => false];
            }
        }

        $response["success"] = true;
        return $response;
    }

    // upload roster
    public function uploadRosterHandler($users, $course_id) {
        // Note: $users should be an array of associative arrays, where each associative array represents a user with keys 'fname', 'lname', 'pname', 'computing_id', and 'role'.        
        $results = (new \asci\server\database\DBUser($this->db))->ManuallyAddUsersForCourse($users, $course_id);

        // Here, $results is an associative array with computing_id as key and true/false as value indicating success/failure.
        $response = [];
        foreach ($results as $computing_id => $success) {
            if ($success) {
                $response[$computing_id] = ["success" => true];
            } else {
                $response[$computing_id] = ["success" => false];
            }
        }

        return $response;
    }



    /**
     * Creates a new User in the database
     *
     * Generates password, new User then stores into DB
     *
     * @return bool login success
     */
    public function createUser($computing_id, $fname, $lname, $pname) {
        $success = (new \asci\server\database\DBUser($this->db))->createUser($computing_id, $fname, $lname, $pname);
        $result = [];
        if ($success) {
            $result["success"] = true;
        } else {
            $result["success"] = false;
        }

        return $result;
    }

    public function createCourse($user, $mnemonic, $number, $name, $semester) {
        $success = (new \asci\server\database\DBCourse($this->db))->createCourse($user, $mnemonic, $number, $name, $semester);
        $result = [];
        if ($success) {
            $result["success"] = true;
        } else {
            $result["success"] = false;
        }
    
        return $result;
    }

    public function registerUser($data) {
        return $this->userStore->register($data["userid"],$data["password"]);
    }

    public function startLlmChat($data) {
        
        // similar to $cosSim
        $chat = new \asci\util\LlmChat();

        // always print "received data" in all situations
        // echo "=======\n";   

        /* Get the matches among everything */
        $buffer = $chat->getLlmResponse($data);

        $this->logger->info("LLM Chat Buffer", array("buffer" => $buffer));

        /* If the LLM Chat call failed, report that to frontend */
        if($buffer == null || $buffer[0] != 0) return $this->err("LLM Chat call failed");

        /* We made it, return the sessions (up to max) that we care about */
        $jsonResponse = $buffer[1];


        // Log the response into the database
        $computing_id = $data["user"];
        $user = $this->userStore->getUser($computing_id)->toArray();
        $user_id = $user["id"];

        $dbLogger = new \asci\server\database\DBLogs($this->db);
        $type = $data["command"];
        $studentString = json_encode(["role" => "user", "content" => $data["studentQuestion"]]);
        $logString = $studentString . ":" . $jsonResponse;

        $dbLogger->log($user_id, $type, $logString);

        $result = [];
        $result["response"] = $jsonResponse;
        return $result;
    }
    
    public function updateCourseInfoHandler($course_id, $mnemonic, $number, $name, $semester) {
        // Retrieve the original course data using the getCourseById method
        $originalCourse = (new \asci\server\database\DBCourse($this->db))->getCourseById($course_id);

        if (!$originalCourse) {
            // Handle the error if no course found
            return ["success" => false, "message" => "Original course not found"];
        }
    
        // If any attribute is empty, use the original value
        $originalCourse->mnemonic = empty($mnemonic) ? $originalCourse->getMnemonic() : $mnemonic;
        $originalCourse->number = empty($number) ? $originalCourse->getNumber() : $number;
        $originalCourse->name = empty($name) ? $originalCourse->getName() : $name;
        $originalCourse->semester = empty($semester) ? $originalCourse->getSemester() : $semester;
    
        // Now update the course with the potentially updated attributes
        $success = (new \asci\server\database\DBCourse($this->db))->updateCourseByObject($originalCourse);
    
        $result = [];
        if ($success) {
            $result["success"] = true;
        } else {
            $result["success"] = false;
        }
    
        $result["course"] = $originalCourse;
        return $result;
    }
    
    /*
     * Given a course, gets all the assignments that course is associated with 
    */
    public function getAssignmentsHandler($course_id){
        $result = [];

        $assignments = (new \asci\server\database\DBAssignment($this->db))->getAssignmentsByCourseId($course_id);

        $result["assignments"] = [];
        foreach ($assignments as $assignment){
            $result["assignments"][$assignment->getId()] = $assignment->toArray();
        }

        $result["success"] = "true";

        return $result;
    }

    public function runGradescopeDataDownload($email, $password, $courseNumber)
    {
        $result = [];
        // check the gradescope_download python script path
        $scriptPath = \asci\Config::$GRADESCOPE_SYNC_SCRIPT;
        if (!file_exists($scriptPath)) {
            $this->logger->error("Python script does not exist at $scriptPath");
            $result["success"]="false";
            $result["message"]="Download Gradescope data Python script not found";
            return $result;
        }

        // setup the chromium and chrome-driver path in Docker
        $chromedriverPath = \asci\Config::$CHROME_DRIVER_PATH; 
        $chromiumPath = \asci\Config::$CHROMIUM_PATH;
        
        // Construct an absolute path for the download directory
        //TODO: Get random number and create new dir under that path with that number
        //TODO: remember this number and use it throughout.
        $downloadPath = \asci\Config::$GRADESCOPE_DOWNLOAD_PATH;
        $this->logger->debug("Download path is: $downloadPath");

        // Escaping arguments to ensure safe command execution
        $cmd = sprintf(
            'python3 %s %s %s %s %s %s %s 2>&1',      
            escapeshellarg($scriptPath),
            escapeshellarg($email),
            escapeshellarg($password),
            escapeshellarg($downloadPath),
            escapeshellarg($chromedriverPath),
            escapeshellarg($chromiumPath),
            escapeshellarg($courseNumber)
        );

        // Execute the Python script with the provided arguments
        exec($cmd, $output, $returnVar);

        //<TODO: Change this to return the filedpath directly. Don't scan output like this>
        $downloadedFileName = '';
        foreach ($output as $line) {
            // Look for the line that contains the filename
            if (strpos($line, "Latest downloaded file:") !== false) {
                // Extract the filename from the line
                $downloadedFileName = trim(str_replace("Latest downloaded file:", "", $line));
                break;
            }
        }

        // if the download failed, return success as null. Else return success as true
        if ($returnVar !== 0) {
            // Handle the error case
            // echo "Error: Download Gradescope data Python script returned an error.\n";
            // foreach ($output as $line) {
            //     echo $line . "\n";
            // }
            $result["success"]="false";
            $result["message"]="Download Gradescope data Python script returned an error.";
            return $result;
        } else {
            // Handle the success case
            // echo "Success: Download Gradescope data Python script executed without errors.\n";
            // foreach ($output as $line) {
            //     echo $line . "\n";
            // }
            $result["success"]="true";
            $result["message"]="Python script run and successfully download Gradescope data.";
            $result["filename"] = $downloadedFileName;
            return $result;
        }
    }

    
    public function updateGradescopeDataByCourseHandler($course_id, $download_file_name) {
        $result = [];

        $missingStudents = (new \asci\server\database\DBSynchronization($this->db))->updateGradescopeAssignmentSubmissionByCourseId($course_id, $download_file_name);

        if($missingStudents){
            $result["missingStudents"] = $missingStudents;
            $result["message"]="GradeScope downloaded data successfully inserted into the database.";
            $result["success"] = "true";
        }
        else{
            $result["missingStudents"] = [];
            $result["message"]="GradeScope downloaded data failed to be inserted into the database.";
            $result["success"] = "false";
        }
        return $result;
    }

    public function getQuestsForUserHandler($computing_id, $course_id){
        $result = [];

        $quests = (new \asci\server\database\DBUserQuest($this->db))->getQuestsForUser($computing_id, $course_id);
        $result["quests"] = [];

        $status = new  \asci\data\QuestInfo\QuestStatus($this->db, $course_id);

        foreach ($quests as $quest){
            // modify the quest status
            $status -> changeStatus($quest);
            $result["quests"][$quest->getQuestId()] = $quest->toArray();
        }

        $this->logger->addDebug("Quest result", array("quests" => $quests));

        $result["success"] = "true";

        return $result;
    }

    public function getPointsForUserHandler($computing_id, $course_id){
        $result = [];

        $points = (new \asci\server\database\DBUserQuest($this->db))->getPointsForUser($computing_id, $course_id);

        if ($points === null) {
            $result["points"] = 0;
        }
        else {  
            $result["points"] = $points;
        }
        $result["success"] = "true";
        return $result;
    }

    public function getAllQuestsHandler(){
        $result = [];

        $quests = (new \asci\server\database\DBQuest($this->db))->getAllQuests();
        $result["quests"] = [];

        foreach ($quests as $quest){
            $result["quests"][$quest->getId()] = $quest->toArray();
        }

        $this->logger->addDebug("Quest result", array("quests" => $quests[0]));

        $result["success"] = "true";

        return $result;
    }

    public function addQuestForCourseHandler($quest_id, $course_id){
        // add the quest to the course
        $courseQuestSuccess = (new \asci\server\database\DBCourseQuest($this->db))->addQuestToCourse($quest_id, $course_id);
        if ($courseQuestSuccess) {
            // get all users
            $user_courses = (new \asci\server\database\DBUserCourse($this->db))->getStudentsForCourse($course_id);
            // add the quest to each user in the course 
            foreach ($user_courses as $u_c) {
                $user_id = ((new \asci\server\database\DBUser($this->db))->getUser($u_c -> getComputingId())) -> getId();
                $userQuestSuccess = (new \asci\server\database\DBUserQuest($this->db))->addQuestToUser($quest_id, $user_id, $course_id);
                if (!$userQuestSuccess) {
                    $result["success"] = false;
                }
            }
        }
        else {
            $result["success"] = false;
        }
        $result["success"] = true;

        return $result;
    }

    public function removeQuestForCourseHandler($quest_id, $course_id){
        // remove the quest from the course
        $courseQuestSuccess = (new \asci\server\database\DBCourseQuest($this->db))->removeQuestFromCourse($quest_id, $course_id);
        if ($courseQuestSuccess) {
            // get all users
            $user_courses = (new \asci\server\database\DBUserCourse($this->db))->getStudentsForCourse($course_id);
            // remove the quest from users in the course 
            foreach ($user_courses as $u_c) {
                $user_id = ((new \asci\server\database\DBUser($this->db))->getUser($u_c -> getComputingId())) -> getId();
                $userQuestSuccess = (new \asci\server\database\DBUserQuest($this->db))->removeQuestFromUser($quest_id, $user_id, $course_id);
                if (!$userQuestSuccess) {
                    $result["success"] = false;
                }
            }
        }
        else {
            $result["success"] = false;
        }
        $result["success"] = true;

        return $result;
    }

}
