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
  public $courseStore = null; // The course storage 
  public $userCourseStore = null; // The UserCourse storage 
  public $synchronizationStore = null; // The synchronization storage

  private $user = null;
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


  public function __construct($user=null){
    global $log;

    $this->db = new \asci\server\database\DatabaseConnector();
    $this->userStore = new \asci\server\database\DBUser($this->db);
    $this->courseStore = new \asci\server\database\DBCourse($this->db);
    $this->userCourseStore = new \asci\server\database\DBUserCourse($this->db);
    $this->synchronizationStore = new \asci\server\database\DBSynchronization($this->db);
    // Check $_SERVER["uid"]; // their computing ID  (name and id can come from roster)

    // This may need to change with other authentication types
    //if ($user == null)
    //  throw new \asci\exceptions\ASCIPermissionException("User must be authenticated");

    //$this->user = $this->userStore->getUser($user);

    // create a log channel
    $this->logger = new \Monolog\Logger('ServerExecutor');
    $this->logger->pushHandler($log);
  }

  public function loadUser($uid) {
    $this->user = $this->userStore->getUser($uid);
  }

  /*
   * Enforces archived-course access policy at the API boundary.
   * Archived courses are instructor-only; non-instructors are denied direct access.
   */
  public function denyArchivedCourseForStudents($computing_id, $course_id, $command = null) {
    if ($computing_id == null || $course_id == null) {
      return;
    }

    $courses = $this->userCourseStore->getCoursesForUser($computing_id);
    $roles = [];
    foreach ($courses as $course) {
      if ($course->getCourseId() == $course_id) {
        $roles[] = strtolower((string)$course->getRole());
      }
    }

    // User is not enrolled in this course; defer to normal permission checks.
    if (count($roles) == 0) {
      return;
    }

    // Instructors can access archived courses for management/restoration.
    if (in_array("instructor", $roles, true)) {
      return;
    }

    $dbcrsset = new \asci\server\database\DBCourseSettings($this->db);
    $settings = $dbcrsset->getCourseSettings($course_id);

    if ($settings != null && $settings->archived == "t") {
      throw new \asci\exceptions\ASCIPermissionException("Course is archived and unavailable to non-instructors");
    }
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
  public function loginHandler($computing_id, $password=null){
    if (empty($computing_id))
      throw new \asci\exceptions\ASCIAuthenticationException("Username not provided");

    $user = $this->userStore->getUser($computing_id);
    
    // ensure the user was found
    if($user == null || $user->getComputingId() == null){
      throw new \asci\exceptions\ASCIAuthenticationException("User not found"); 
    }
    
    $result = [];
    if (\asci\Config::$AUTH_MODE == "password") {
      // password is required
      if (empty($password))
        throw new \asci\exceptions\ASCIAuthenticationException("Password not provided"); 
      
      // check the password
      if (password_verify($password, $user->getPasswordHash()) == false) {
        throw new \asci\exceptions\ASCIAuthenticationException("Invalid password");
      } 

    } else if (\asci\Config::$AUTH_MODE == "netbadge") {
      // do nothing!
    } else {
        throw new \asci\exceptions\ASCIAuthenticationException("Authentication Mode not allowed by the system");
    }

    // Authentication checks were successful, so allow the user to continue
    $result["user"] = $user->toArray();
    $courses = $this->getCoursesHandler($computing_id);
    if ($courses["success"] == "true") {
      $result["courses"] = $courses["courses"];
    }
    $result["success"] = "true";

    $_SESSION["uid"] = $user->getComputingId();
    $this->logger->addDebug("Set SESSION Variable for user {$user->getComputingId()}", $_SESSION);

    return $result;
  }

  /*
   * Given a user, gets all the courses that user is associated with 
   * in the system. See UserCourse for object structure
   */
  public function getCoursesHandler($computing_id){
    $result = [];

    $courses = $this->userCourseStore->getCoursesForUser($computing_id);

    $result["courses"] = [];

    /* Database Object we are going to need */
    $dbcrsset = new \asci\server\database\DBCourseSettings($this->db);

    foreach ($courses as $course){
      $settings = $dbcrsset->getCourseSettings($course->getCourseId());
      if($settings == null) continue;

      $isArchived = ($settings->archived == "t");
      $role = strtolower((string)$course->getRole());
      $isInstructor = ($role == "instructor");

      // Archived courses are only visible to instructors for management/restoration.
      if($isArchived && !$isInstructor) continue;

      $courseArray = $course->toArray();
      $courseArray["archived"] = $settings->archived;
      $result["courses"][$course->getCourseId()] = $courseArray;
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

    $courses = $this->userCourseStore->getCoursesForUserByRole($computing_id, $role);

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
    $course = $this->userCourseStore->getCourseForUser($user->getComputingId(), $course_id);

    //2: See if a session already exists for this person / course combo?
    $session = (new \asci\server\database\DBSession($this->db))->getSessionForUser($user->getId(), $course->getCourseId());

    $response = [];
    $response["usercourse"] = $course->toArray();
    $response["session"] = ($session === null) ? null : $session->toArray();
    $response["success"] = "true";

    return $response;

  }

  public function joinQueueHandler($computing_id, $course_id, $question, $subject, $location, $code, $groupOption){ //add code here later

    //0: Grab the user
    $user = $this->userStore->getUser($computing_id);

    //1: Get UserCourse (add function to get just one course)
    $course = $this->userCourseStore->getCourseForUser($user->getComputingId(), $course_id);

    //1.5: Check that they have permission to join the queue
    if (!$this->userCourseStore->userHasPermission($user, $course_id, "join-queue"))
      throw new \asci\exceptions\ASCIPermissionException("Not enrolled in course");

    //2: See if a session already exists for this person / course combo?
    $dbsession = new \asci\server\database\DBSession($this->db);
    $session = $dbsession->getSessionForUser($user->getId(), $course->getCourseId());

    $result = [];
    $result["usercourse"] = $course->toArray();

    //If no session yet, insert one and send the new one back
    if($session == null){
      //create a new one and return it back
      $session = $dbsession->createNewSession($user->getId(), $course->getCourseId(), $course->getRole(), $question, $subject, $location, $code, "waiting", $groupOption); //add code here later
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
    $course = $this->userCourseStore->getCourseForUser($user->getComputingId(), $course_id);


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

    //1: Check that the user has permission to access queue
    if (!$this->userCourseStore->userHasPermission($user, $course_id, "ta-queue"))
      throw new \asci\exceptions\ASCIPermissionException("User is not enrolled as a TA in this course");

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

    //1: Check that the user has permission to access queue
    if (!$this->userCourseStore->userHasPermission($user, $course_id, "ta-queue"))
      throw new \asci\exceptions\ASCIPermissionException("User is not enrolled as a TA in this course");

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

  public function getSummaryFromDB($computing_id, $course_id, $session_id){
    //DB objects we will be using
    $dbsession = new \asci\server\database\DBSession($this->db);
    $dbsessusr = new \asci\server\database\DBSessionUser($this->db);

    $result = [];

    $session = $dbsession->getSession($session_id);

    if($session == null){
      return $this->err("Could not find the given session");
    }
    if($session->course_id != $course_id){
      return $this->err("Session is not in the given course!");
    }

    $sessionSummary = $dbsession->getSessionSummary($session->getId());

    if($sessionSummary == null){
      $result["success"] = "false";
      $result["error"] = "ERROR: Session does not have a summary";
      return $result;
    }

    $result["success"] = "true";
    $result["error"] = "false";
    $result["summary"] = $sessionSummary;

    return $result;
  }

  /*
   * Get all the matched students' info and display it for the TA.
   */
  public function getPotentialGroupInfo($computing_id, $course_id){

    //DB objects we will be using
    $dbsession = new \asci\server\database\DBSession($this->db);
    $dbsessusr = new \asci\server\database\DBSessionUser($this->db);
    $dbLogger = new \asci\server\database\DBLogs($this->db);

    /* FIRST, GRAB JUST THE MAIN USER THE TA IS INTERACTING WITH */
    $user = $this->userStore->getUser($computing_id);

    $user_id = $user->getId();

    //1: Check that the user has permission to access queue
    if (!$this->userCourseStore->userHasPermission($user, $course_id, "ta-queue"))
      throw new \asci\exceptions\ASCIPermissionException("User is not enrolled as a TA in this course");

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

        //Logger information
        $usedCosSim = False;

    /*  Grab the course settings */
    /* Database Object we are going to need */
    $dbcrsset = new \asci\server\database\DBCourseSettings($this->db);
    $courseSettings = $dbcrsset->getCourseSettings($course_id);


    /* TWO CASES: We want to group or we just take the top available (else clause) */
    if($courseSettings->smart_grouping && count($group_sessions) > $max_group_options){

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
$usedCosSim = True;
    }
    else{

            /* Trim down to max option size */
            if(count($group_sessions) > $max_group_options)
                $group_sessions = array_slice($group_sessions, 0, $max_group_options);
            $result["group_sessions"] = $group_sessions;
        }
        $type = "potentialGroupInfo";
        $groupInformation = [];
        $studentInfo = ["Student" => $student->getId(), "Subject" => $session->issue_subject, "issue" => $session->issue];
        array_push($groupInformation, $studentInfo);
        foreach($result["group_sessions"] as $group_session){
            $group_session_user = $dbsessusr->getSessionUserByRole($group_session->getId(), 'student');
            if($group_session_user == null){
                $result["success"] = "false";
                $result["error"] = "ERROR: Session does not have any associated students when Logging";
                return $result;
            }
            $studentInfo = ["Student" => $group_session_user->getUserId(), "Subject" => $group_session->issue_subject, "issue" => $group_session->issue];
            array_push($groupInformation, $studentInfo);
        }
        $logAction = json_encode(["Group" => $groupInformation, "cosSim" => $usedCosSim, "ta" => $user_id, "session" => $session->id]);
        #need to get this person and their problem, plus group members and their problems ;
        $dbLogger->log($student->getId(), $type, $logAction);
        


    return $result;
  }

  /*
   * Put the chosen students into a group meeting
   * $ta_computing_id is the comp. id of the TA
   * $course_id is the id of the course
   * $session_id is the session of the main student TA is helping
   * $group_sessions is a list of the other sessions that should be joined with session_id
   */
  public function createGroup($ta_computing_id, $course_id, $session_id, $group_sessions, $location, $code){

        //DB objects we will be using
        $dbsession = new \asci\server\database\DBSession($this->db);
        $dbsessusr = new \asci\server\database\DBSessionUser($this->db);
        $dbgroupmap = new \asci\server\database\DBGroupMapping($this->db);
        $dbLogger = new \asci\server\database\DBLogs($this->db);

        /* Grab the TA */
        $taUser = $this->userStore->getUser($ta_computing_id);

    /* First, set the main session to in_progress (easy part) */
    $mainSession = $dbsession->getSession($session_id);

    if($mainSession == null) return $this->err("No session exists for given sessionId");

    $mainSession->status = "in_progress";
    $result = $dbsession->update($mainSession);
    if(!$result) return $this->err("failure to update session to in_progress state");
    $mainSessUsr = $dbsessusr->getSessionUserByRole($mainSession->id, "student");
    
    #currently if getSessioNUserByRole returns more than one user, throw error
    if($mainSessUsr == null) return $this->err("failure to get main student Ta is working with");

    /* Then, for each group session, check if still waiting */
    /* If so, add a group mapping row to the main session and set to in progress */
    $groupInformation = [];
    $mainStudentInfo = ["Student" => $mainSessUsr->userId, "Subject" => $mainSession->issue_subject, "issue" => $mainSession->issue];      
    array_push($groupInformation, $mainStudentInfo);
    /* if group_sessions has any actual sessions to group in, then remove TA from main session and create a TA session to mash all users into */
    
    if(count($group_sessions) > 0){

      /* Remove the TA from the main session first!! */
      $taMainSessUsr = $dbsessusr->getSessionUser($taUser->id, $mainSession->id);
      if(!($dbsessusr->delete($taMainSessUsr))) return $this->err("Error deleting TA from main session");

      /* Now, create a new session for the TA to run for this group */
      $newTASess = $dbsession->createNewSession($taUser->id, $course_id, "ta", "Group session", "Group session", $location, $code, "in_progress", "true");

      /* Link in the main session manually */
      $gr_map = new \asci\data\GroupMapping();
      $gr_map->from_session = $mainSession->id;
      $gr_map->to_session = $newTASess->id;
      $gr_map->status = "active";
      $result = $dbgroupmap->insert($gr_map);
      if(!$result) return $this->err("Error creating group session map");




      foreach($group_sessions as $gr_sess_id){
        /* gr_sess_id is just the id of the session, pull the session first */
        $gr_sess = $dbsession->getSession($gr_sess_id);
        if($gr_sess == null) return $this->err("Group sess id does not exist");
        $sessUser = $dbsessusr->getSessionUserByRole($gr_sess->id, "student");
        $studentInfo = ["Student" => $sessUser->userId, "Subject" => $gr_sess->issue_subject, "issue" => $gr_sess->issue];
        array_push($groupInformation, $studentInfo);
        

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
    $type = "GroupCreation";
    $logAction = json_encode(["Group" => $groupInformation, "ta" => $ta_computing_id, "session" => $session_id]);

    $dbLogger->log($mainSessUsr->userId, $type, $logAction);
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

    //1: Check that the user has permission to access queue
    if (!$this->userCourseStore->userHasPermission($user, $course_id, "ta-queue"))
      throw new \asci\exceptions\ASCIPermissionException("User is not enrolled as a TA in this course");

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


  public function updateTAStatus($computing_id, $course_id) {
    //0: Grab the user
    $user = $this->userStore->getUser($computing_id);

    $result = [];

    //Get the UserCourse object
    $userCourse = $this->userCourseStore->getCourseForUser($user->getComputingId(), $course_id);

    //1: Check that the user has permission to access queue
    if (!$this->userCourseStore->userHasPermission($user, $course_id, "ta-queue"))
      throw new \asci\exceptions\ASCIPermissionException("User is not enrolled as a TA in this course", $role);

    // Update the status in the database (i.e., that they are working)
      $this->userCourseStore->updateTAStatus($user, $course_id);
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
    $userCourse = $this->userCourseStore->getCourseForUser($user->getComputingId(), $course_id);

    //1: Check that the user has permission to access queue
    if (!$this->userCourseStore->userHasPermission($user, $course_id, "ta-queue"))
      throw new \asci\exceptions\ASCIPermissionException("User is not enrolled as a TA in this course");

    //Ok, looks good. Grab the number of waiting students
    $waitingSessions = $dbsession->getWaitingSessions($course_id);


    $workingTAs = $dbsession->getRecentWorkingTAs($course_id);


    $result["success"] = "true";
    $result["waiting"] = count($waitingSessions);
    $result["sessions"] = $waitingSessions;
    $result["tas"] = $workingTAs;
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

    if($settings == null){
        //TODO: CREATE THEM IF THEY DON"T EXIST!!
        return $this->err("This course id does not have any associated course settings");
    }

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

    //1: Check that the user has permission to access queue
    if (!$this->userCourseStore->userHasPermission($user, $course_id, "ta-queue"))
      throw new \asci\exceptions\ASCIPermissionException("User is not enrolled as a TA in this course");

    $result = [];

    $dbsession->closeAllSessionsForCourse($course_id);

    $result["success"] = "true";
    return $result;


    //-------------------------------------------
    //-------------------------------------------
  }

  public function uploadContentLLM($data) {
    $this->logger->addDebug("Handling LLM create request", $data);
    // Check for the course first
    //$course = $data["course"];
    $course = ["course_id" => $data["courseid"]];
    if($this->courseStore->getCourseById($course["course_id"]) === false)
      throw new \asci\exceptions\ASCIException("Unknown course");

    // Check for the user 
    $computing_id = $data["user"];
    $user = $this->userStore->getUser($computing_id);
    if ($user == null) 
      throw new \asci\exceptions\ASCIException("Unknown user");

    //1: Check that the user has permission to access queue
    if (!$this->userCourseStore->userHasPermission($user, $course["course_id"], "upload-llm"))
      throw new \asci\exceptions\ASCIPermissionException("User does not have permission to upload llm data");

    // similar to $cosSim
    $chat = new \asci\util\LlmChat($course);

    return $chat->uploadContent($course);

  }

  public function uploadPiazzaLLM($data) {
    $this->logger->addDebug("Handling LLM create request", $data);
    // Check for the course first
    //$course = $data["course"];
    $course = ["course_id" => $data["courseid"]];
    if($this->courseStore->getCourseById($course["course_id"]) === false)
      throw new \asci\exceptions\ASCIException("Unknown course");

    // Check for the user 
    $computing_id = $data["user"];
    $user = $this->userStore->getUser($computing_id);
    if ($user == null) 
      throw new \asci\exceptions\ASCIException("Unknown user");

    //1: Check that the user has permission to access queue
    if (!$this->userCourseStore->userHasPermission($user, $course["course_id"], "upload-llm"))
      throw new \asci\exceptions\ASCIPermissionException("User does not have permission to upload llm data");

    // similar to $cosSim
    $chat = new \asci\util\LlmChat($course);

    return $chat->uploadPiazza($course);

  }

  public function uploadPiazza($data) {
    $course = ["course_id" => $data["courseid"]];
    if($this->courseStore->getCourseById($course["course_id"]) === false)
      throw new \asci\exceptions\ASCIException("Unknown course");

    // Check for the user 
    $computing_id = $data["user"];
    $user = $this->userStore->getUser($computing_id);
    if ($user == null) 
      throw new \asci\exceptions\ASCIException("Unknown user");

    //1: Check that the user has permission to access queue
    if (!$this->userCourseStore->userHasPermission($user, $course["course_id"], "upload-llm"))
      throw new \asci\exceptions\ASCIPermissionException("User does not have permission to upload llm data");

    $people = $this->userCourseStore->getParticipantsForCourse($course["course_id"]);

    // similar to $cosSim
    $piazza = new \asci\util\PiazzaHandler();

    $piazzaStats = $piazza->parsePiazzaStats($people);
    $this->userCourseStore->updatePiazzaStatsForCourse($course["course_id"], $piazzaStats);


    $piazzaStream = $piazza->parsePiazzaStream($people);
    $this->userCourseStore->updatePiazzaStreamForCourse($course["course_id"], $piazzaStream);

    $result = [
      "success" => "true"
    ];
    return $result;

  }

  public function scrapeURL($url) {
    if (!isset($url)) {
      die("Missing URL");
    }
    
    if (!filter_var($url, FILTER_VALIDATE_URL)) {
      die("Invalid URL");
    }

    $script = __DIR__ . "/scraper.py";
    $command =  escapeshellcmd("python3 $script " . escapeshellarg($url) . " 2>&1");
    $output = shell_exec($command);

    echo json_encode(["content" => $output]);
    exit();
  }

  public function llmSummary($data) {
    $this->logger->addDebug("Handling LLM request", $data);
    //$arrayString = print_r($data, true);
    //error_log("Request: " . $arrayString);

    // retrieve course from request data and ensure the ID is known
    $course = $data["course"];
    if ($this -> courseStore -> getCourseById($course["course_id"]) === false) throw new \asci\exceptions\ASCIException("Unknown course");

    // retrieve the user's id and ensure their computing ID is known
    $computing_id = $data["user"];
    $user = $this->userStore->getUser($computing_id);
    if ($user == null) throw new \asci\exceptions\ASCIException("Unknown user");

    // check permissions
    if (!$this->userCourseStore->userHasPermission($user, $course["course_id"], "llm-summary")) throw new \asci\exceptions\ASCIPermissionException("User does not have permission to chat with llm");

    // summary object -> get summary
    $summary = new \asci\util\llmChat();
    $llmResponse = $summary->getLlmSummary($data, $course); 
    $this->logger->info("LLM Summary Buffer", array($llmResponse));
    if($llmResponse == null) throw new \asci\exceptions\ASCIException("LLM Summary call failed");

    // WILL: not sure what this section does
    $dbLogger = new \asci\server\database\DBLogs($this->db);
    $type = $data["command"];
    $logString = json_encode(["role" => "user", "content" => $data["question"], "response"=>$llmResponse, "course"=>$data["course"]]);
    $dbLogger->log($user->getId(), $type, $logString);

    $result = [];
    $result["response"] = $llmResponse;



    // New database session and user
    $dbsession = new \asci\server\database\DBSession($this->db);
    $dbsessusr = new \asci\server\database\DBSessionUser($this->db);

    $session = $dbsession->getSession($data["session_id"]);

    //error_log("Session: " . print_r($session));

    if($session == null){
      return $this->err("Could not find the given session");
    }
    if($session->course_id != $course["course_id"]){
      return $this->err("Session is not in the given course!");
    }

    // update the session with our newly generated summary (trimmed)
    //error_log("llm response: " . print_r($llmResponse,true));
    $session->llm_summary = trim(
    preg_replace(
        ['/\\<\\|eot_id\\|\\>/', '/\\\\n/'],
        ['', "\n"],
        $llmResponse['response']
    ));
    $updateStatus = $dbsession->update($session);
    if($updateStatus == false){
      $result["success"] = "false";
      $result["error"] = "ERROR: Session does not have a summary";
      return $result;
    }
    $result["success"] = "true";
    $result["error"] = "false";

    return $result;
  }

  public function llmChat($data) {


    $this->logger->addDebug("Handling LLM request", $data);
    // Check for the course first
    $course = $data["course"];
    if($this->courseStore->getCourseById($course["course_id"]) === false)
      throw new \asci\exceptions\ASCIException("Unknown course");

    // Check for the user 
    $computing_id = $data["user"];
    $user = $this->userStore->getUser($computing_id);
    if ($user == null) 
      throw new \asci\exceptions\ASCIException("Unknown user");
    
    //1: Check that the user has permission to access queue
    if (!$this->userCourseStore->userHasPermission($user, $course["course_id"], "llm-chat"))
      throw new \asci\exceptions\ASCIPermissionException("User does not have permission to chat with llm");

    // similar to $cosSim
    $chat = new \asci\util\LlmChat();

    /* Get the matches among everything */
    $llmResponse = $chat->getLlmResponse($data, $course);

    $this->logger->info("LLM Chat Buffer", array($llmResponse));

    /* If the LLM Chat call failed, report that to frontend */
    if($llmResponse == null || !is_array($llmResponse)) 
      throw new \asci\exceptions\ASCIException("LLM Chat call failed");



    $dbLogger = new \asci\server\database\DBLogs($this->db);
    $type = $data["command"];
    $logString = json_encode(["role" => "user", "content" => $data["studentQuestion"], "response"=>$llmResponse, "course"=>$data["course"]]);

    $dbLogger->log($user->getId(), $type, $logString);

    $result = [];
    $result["response"] = $llmResponse;
    return $result;
  }

  /**
   * Streaming version of llmChat: validates auth then streams SSE from LLM server.
   */
  public function llmChatStreaming($data) {
    $this->logger->addDebug("Handling streaming LLM request", $data);

    $course = $data["course"];
    if($this->courseStore->getCourseById($course["course_id"]) === false)
      throw new \asci\exceptions\ASCIException("Unknown course");

    $computing_id = $data["user"];
    $user = $this->userStore->getUser($computing_id);
    if ($user == null)
      throw new \asci\exceptions\ASCIException("Unknown user");

    if (!$this->userCourseStore->userHasPermission($user, $course["course_id"], "llm-chat"))
      throw new \asci\exceptions\ASCIPermissionException("User does not have permission to chat with llm");

    $chat = new \asci\util\LlmChat();
    $chat->getLlmResponseStreaming($data, $course);
  }

  public function getCourseStats($course_id) {
    //1: Check that the current user has permission to access stats
    if (!$this->userCourseStore->userHasPermission($this->user, $course_id, "course-stats"))
      throw new \asci\exceptions\ASCIPermissionException("User does not have permission to access course stats");

    $dbstat = new database\DBStats($this->db);

    $stats = $dbstat->getTAHelpStatsForCourse($course_id);
    $details = $dbstat->getTAActiveQueueStatsForCourse($course_id);

    $result = [
      "stats" => $stats,
      "details" => $details,
      "success" => "true"
    ];
    return $result;

  }

    public function setCourseSettings($course_id, $settings){
      //1: Check that the current user has permission to access stats
      if (!$this->userCourseStore->userHasPermission($this->user, $course_id, "course-settings"))
        throw new \asci\exceptions\ASCIPermissionException("User does not have permission to access course settings");

        /* Database Object we are going to need */
        $dbcrsset = new \asci\server\database\DBCourseSettings($this->db);
        
        $newSettings = (new \asci\data\CourseSettings())->fromArray($settings);
        

        $result = $dbcrsset->update($newSettings);
        
        if($settings == null) return $this->err("Error: Something went wrong when updating course settings");

        //Done. Fetch the settings again to let the user know what the new values are
        return $this->getCourseSettings($course_id);
    }



    // manually add student/ta to the course
    public function manuallyAddStudentHandler($fname, $lname, $pname, $computing_id, $role, $course_id) {
        //1: Check that the current user has permission to access stats
        if (!$this->userCourseStore->userHasPermission($this->user, $course_id, "course-roster"))
          throw new \asci\exceptions\ASCIPermissionException("User does not have permission to modify course roster");

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
      
        //1: Check that the current user has permission to modify roster
        if (!$this->userCourseStore->userHasPermission($this->user, $course_id, "course-roster"))
          throw new \asci\exceptions\ASCIPermissionException("User does not have permission to modify course roster");

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

    public function getCourseRosterHandler($computing_id, $course_id) {
      
        //1: Check that the current user has permission to modify roster
        if (!$this->userCourseStore->userHasPermission($this->user, $course_id, "course-roster"))
          throw new \asci\exceptions\ASCIPermissionException("User does not have permission to view course roster");

        $roster = $this->userStore->getRosterForCourse($course_id);

        $result = [];
        $result["roster"] = $roster;
        $result["success"] = "true";
        return $result;

    }



    /**
     * Creates a new User in the database
     *
     * Generates password, new User then stores into DB
     *
     * @return bool login success
     */
    public function createUser($computing_id, $fname, $lname, $pname, $password) {
        $success = (new \asci\server\database\DBUser($this->db))->createUser($computing_id, $fname, $lname, $pname, $password);
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

    public function updateCourseInfoHandler($course_id, $mnemonic, $number, $name, $semester) {
        //1: Check that the current user has permission to modify settings
        if (!$this->userCourseStore->userHasPermission($this->user, $course_id, "course-settings"))
          throw new \asci\exceptions\ASCIPermissionException("User does not have permission to modify course info");
        
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

    public function runGradescopeDataDownload($email, $password, $courseNumber, $courseId)
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

        $downloadUniqueNum = rand();
        $downloadPath = \asci\Config::$GRADESCOPE_DOWNLOAD_PATH . DIRECTORY_SEPARATOR . $downloadUniqueNum . DIRECTORY_SEPARATOR;
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
            
            /* Ok, it worked, call the second function directly */
            $result = $this->updateGradescopeDataByCourseHandler($courseId, $downloadUniqueNum, $downloadedFileName);

            /* delete the downloaded file and directory */
            unlink($downloadPath . $downloadedFileName);
            rmdir($downloadPath);

            return $result;

        }
    }

    
    public function updateGradescopeDataByCourseHandler($course_id, $download_unique_id, $download_file_name) {
        $result = [];

        $missingStudents = (new \asci\server\database\DBSynchronization($this->db))->updateGradescopeAssignmentSubmissionByCourseId($course_id, $download_unique_id, $download_file_name);

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

    public function getQuestsByStatusHandler($user_id, $course_id, $status){
        $result = [];

        $quests = (new \asci\server\database\DBUserQuest($this->db))->getQuestsByStatus($user_id, $course_id, $status);
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

    public function updateQuestStatusHandler($quest_id, $user_id, $course_id, $status){
        $user = ((new \asci\server\database\DBUser($this->db))->getUser($user_id)) -> getId();
        $success = (new \asci\server\database\DBUserQuest($this->db))->updateQuestStatus($quest_id, $user, $course_id, $status);
        
        // foreach ($quests as $quest){
        //     // modify the quest status
        //     $status -> changeStatus($quest);
        //     $result["quests"][$quest->getQuestId()] = $quest->toArray();
        // }
      
        $result = [];
        if ($success) {
            $result["success"] = true;
        } else {
            $result["success"] = false;
        }

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

    public function getCourseQuestsHandler($course){
        $result = [];

        $quests = (new \asci\server\database\DBCourseQuest($this->db))->getQuestsForCourse($course);
        $result["quests"] = [];

        foreach ($quests as $quest){
          $result["quests"][$quest->getQuestId()] = $quest->toArray();
        }

        $this->logger->addDebug("Quest result", array("quests" => $quests[0]));

        $result["success"] = "true";

        return $result;
    }

    public function addQuestHandler($mnemonic, $name, $description, $total_points){
        $success = (new \asci\server\database\DBQuest($this->db))->createQuest($mnemonic, $name, $description, $total_points);
        $result = [];
        if ($success) {
            $result["success"] = true;
        } else {
            $result["success"] = false;
        }

        return $result;
    }

    public function deleteQuestHandler($quest){
        $success = (new \asci\server\database\DBQuest($this->db))->deleteQuest($quest);
        $result = [];
        if ($success) {
            $result["success"] = true;
        } else {
            $result["success"] = false;
        }

        return $result;
    }

    public function addQuestForCourseHandler($quest_id, $course_id){
        // add the quest to the course
        $courseQuestSuccess = (new \asci\server\database\DBCourseQuest($this->db))->addQuestToCourse($quest_id, $course_id);
        if ($courseQuestSuccess) {
            // get all users
            $user_courses = $this->userCourseStore->getStudentsForCourse($course_id);
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
            $user_courses = $this->userCourseStore->getStudentsForCourse($course_id);
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

    public function getStudentsFallingBehindHandler($user, $course_id){
        
        if (!$this->userCourseStore->userHasPermission($this->user, $course_id, "course-roster"))
          throw new \asci\exceptions\ASCIPermissionException("User does not have permission to view course roster so cannot get students falling behind");

        $students = (new \asci\server\database\DBStudentTracking($this->db))->getStudentsFallingBehind($course_id);

        $result = [];
        $result["students"] = $students;

        if (!$students) {
            $result["success"] = false;
        }
        else{
          $result["success"] = true;
        }

        return $result;
    }

    public function getCourseContentHandler($user, $course_id){
      //permissions?
      $this->serverURL = \asci\Config::$LLM_SERVER_URL;

      $request = [
          "course" => $course_id,
          "command" => "getCourseContent"
      ];

      $ch = curl_init();
      curl_setopt($ch, CURLOPT_URL, $this->serverURL);
      curl_setopt($ch, CURLOPT_HTTPHEADER, array ('Content-Type: application/json'));
      curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
      curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($request));
      curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
      $response = curl_exec($ch);
      if($errno = curl_errno($ch)) {
        $error_message = curl_strerror($errno);
        $this->logger->addError("cURL error ({$errno}):\n {$error_message}");
      }
      curl_close($ch);
      return json_decode($response, true);
    }

    public function removeCourseContentHandler($user, $course_id, $filename){
      //permissions?
      $this->serverURL = \asci\Config::$LLM_SERVER_URL;

      $request = [
          "course" => $course_id,
          "filename" => $filename,
          "command" => "removeCourseContent"
      ];

      $ch = curl_init();
      curl_setopt($ch, CURLOPT_URL, $this->serverURL);
      curl_setopt($ch, CURLOPT_HTTPHEADER, array ('Content-Type: application/json'));
      curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
      curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($request));
      curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
      $response = curl_exec($ch);
      if($errno = curl_errno($ch)) {
        $error_message = curl_strerror($errno);
        $this->logger->addError("cURL error ({$errno}):\n {$error_message}");
      }
      curl_close($ch);
      return json_decode($response, true);
    }

    /**
     * Fetches the list of text channels for a Discord guild.
     * Requires \asci\Config::$DISCORD_BOT_TOKEN to be set.
     */
    public function getDiscordChannelsHandler($user, $course_id, $guild_id) {
        if (!$this->userCourseStore->userHasPermission($this->user, $course_id, "course-stats"))
            throw new \asci\exceptions\ASCIPermissionException("User does not have permission to access course stats");

        $token = \asci\Config::$DISCORD_BOT_TOKEN;
        if (empty($token))
            return ["success" => "false", "error" => "Discord bot token is not configured on the server."];

        // Sanitize guild_id: must be a snowflake (numeric string)
        if (!preg_match('/^\d{1,20}$/', $guild_id))
            return ["success" => "false", "error" => "Invalid Guild ID format."];

        $api_url = "https://discord.com/api/v10/guilds/" . $guild_id . "/channels";

        $ch = curl_init($api_url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bot " . $token,
            "Content-Type: application/json",
            "User-Agent: ASCI-App (https://github.com/uva-cs3240, 1.0)"
        ]);
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($http_code !== 200)
            return ["success" => "false", "error" => "Discord API returned HTTP $http_code. Check your bot token and server ID."];

        $data = json_decode($response, true);
        if ($data === null)
            return ["success" => "false", "error" => "Invalid response from Discord API."];

        // Filter to text channels only (type 0 = GUILD_TEXT)
        $text_channels = array_values(array_filter($data, fn($c) => isset($c["type"]) && $c["type"] === 0));

        // Sort alphabetically by name
        usort($text_channels, fn($a, $b) => strcmp($a["name"], $b["name"]));

        $channels = array_map(fn($c) => [
            "id"   => $c["id"],
            "name" => $c["name"],
        ], $text_channels);

        return ["success" => "true", "channels" => $channels];
    }

    /**
     * For a given Discord channel, fetches messages and returns every message
     * ending in '?' along with the response time of the first reply from another user.
     */
    public function getDiscordActivityHandler($user, $course_id, $channel_id) {
        if (!$this->userCourseStore->userHasPermission($this->user, $course_id, "course-stats"))
            throw new \asci\exceptions\ASCIPermissionException("User does not have permission to access course stats");

        $token = \asci\Config::$DISCORD_BOT_TOKEN;
        if (empty($token))
            return ["success" => "false", "error" => "Discord bot token is not configured on the server."];

        // Sanitize channel_id: must be a snowflake (numeric string)
        if (!preg_match('/^\d{1,20}$/', $channel_id))
            return ["success" => "false", "error" => "Invalid Channel ID format."];

        // Fetch up to 100 messages (Discord's per-request max)
        $api_url = "https://discord.com/api/v10/channels/" . $channel_id . "/messages?limit=100";

        $ch = curl_init($api_url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bot " . $token,
            "Content-Type: application/json",
            "User-Agent: ASCI-App (https://github.com/uva-cs3240, 1.0)"
        ]);
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($http_code !== 200)
            return ["success" => "false", "error" => "Discord API returned HTTP $http_code for channel. Check bot permissions."];

        $messages = json_decode($response, true);
        if ($messages === null)
            return ["success" => "false", "error" => "Invalid response from Discord API."];

        // Discord returns messages newest-first; reverse to chronological order
        $messages = array_reverse($messages);

        // Build a resolver: lowercase discord_username -> "First Last (discord_name)"
        $mapping = $this->userStore->getDiscordMappingForCourse($course_id);
        $resolveName = function(string $discordName) use ($mapping): string {
            $key = strtolower($discordName);
            if (isset($mapping[$key])) {
                $s = $mapping[$key];
                return trim(($s['pname'] ?? $s['fname'] ?? '') . ' ' . ($s['lname'] ?? '')) . ' (' . $discordName . ')';
            }
            return $discordName;
        };

        $questions = [];

        foreach ($messages as $idx => $msg) {
            $content = trim($msg["content"] ?? "");
            // A question: non-empty message ending with '?'
            if ($content === "" || substr($content, -1) !== "?")
                continue;

            $asker_id = $msg["author"]["id"] ?? null;
            $asker    = $resolveName($msg["author"]["global_name"] ?? ($msg["author"]["username"] ?? "Unknown"));
            $asked_at = $msg["timestamp"] ?? null;
            $t_asked  = $asked_at !== null ? strtotime($asked_at) : null;

            // Collect ALL responses from different users, stopping at the next question
            $responses = [];
            $seen_responders = []; // track by user id to avoid duplicate entries per user
            for ($j = $idx + 1; $j < count($messages); $j++) {
                $reply = $messages[$j];
                $reply_content = trim($reply["content"] ?? "");

                // Stop collecting once we hit the next question from anyone
                if ($reply_content !== "" && substr($reply_content, -1) === "?")
                    break;

                $reply_author_id = $reply["author"]["id"] ?? null;

                // Skip the original asker and skip empty/bot messages
                if ($reply_author_id === null || $reply_author_id === $asker_id)
                    continue;

                // Only record each responder's FIRST reply
                if (isset($seen_responders[$reply_author_id]))
                    continue;

                $seen_responders[$reply_author_id] = true;

                $responder = $resolveName($reply["author"]["global_name"] ?? ($reply["author"]["username"] ?? "Unknown"));
                $response_time_seconds = null;
                if ($t_asked !== null && isset($reply["timestamp"])) {
                    $t_replied = strtotime($reply["timestamp"]);
                    if ($t_replied !== false && $t_replied >= $t_asked)
                        $response_time_seconds = $t_replied - $t_asked;
                }

                $responses[] = [
                    "responder"             => $responder,
                    "response_time_seconds" => $response_time_seconds,
                ];
            }

            $questions[] = [
                "question_text" => $content,
                "asker"         => $asker,
                "asked_at"      => $asked_at,
                "responses"     => $responses,
            ];
        }

        return ["success" => "true", "questions" => $questions];
    }

    /**
     * For every text channel in a guild, computes per-member stats:
     *   - questions_asked : how many messages ending in '?' they sent
     *   - responses_given : how many times they were first to reply to someone else's question
     *   - avg_response_seconds : average time (seconds) to their first reply across all questions they answered
     *
     * Returns:
     *   { success: "true", channels: [ { channel_id, channel_name, members: [ { name, questions_asked, responses_given, avg_response_seconds } ] } ] }
     */
    public function getDiscordServerSummaryHandler($user, $course_id, $guild_id, $max_response_seconds = null) {
        if (!$this->userCourseStore->userHasPermission($this->user, $course_id, "course-stats"))
            throw new \asci\exceptions\ASCIPermissionException("User does not have permission to access course stats");

        $token = \asci\Config::$DISCORD_BOT_TOKEN;
        if (empty($token))
            return ["success" => "false", "error" => "Discord bot token is not configured on the server."];

        if (!preg_match('/^\d{1,20}$/', $guild_id))
            return ["success" => "false", "error" => "Invalid Guild ID format."];

        // --- Step 1: fetch all text channels ---
        $ch = curl_init("https://discord.com/api/v10/guilds/" . $guild_id . "/channels");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                "Authorization: Bot " . $token,
                "Content-Type: application/json",
                "User-Agent: ASCI-App (https://github.com/uva-cs3240, 1.0)"
            ]
        ]);
        $response  = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($http_code !== 200)
            return ["success" => "false", "error" => "Discord API returned HTTP $http_code fetching channels."];

        $all_channels = json_decode($response, true);
        if ($all_channels === null)
            return ["success" => "false", "error" => "Invalid response from Discord API (channels)."];

        // Text channels only (type 0), sorted alphabetically
        $text_channels = array_values(array_filter($all_channels, fn($c) => isset($c["type"]) && $c["type"] === 0));
        usort($text_channels, fn($a, $b) => strcmp($a["name"], $b["name"]));

        // Build a resolver: lowercase discord_username -> "First Last (discord_name)"
        $mapping = $this->userStore->getDiscordMappingForCourse($course_id);
        $resolveName = function(string $discordName) use ($mapping): string {
            $key = strtolower($discordName);
            if (isset($mapping[$key])) {
                $s = $mapping[$key];
                return trim(($s['pname'] ?? $s['fname'] ?? '') . ' ' . ($s['lname'] ?? '')) . ' (' . $discordName . ')';
            }
            return $discordName;
        };

        $result_channels = [];

        // --- Step 2: for each channel fetch messages and compute stats ---
        foreach ($text_channels as $channel) {
            $channel_id = $channel["id"];

            $ch2 = curl_init("https://discord.com/api/v10/channels/" . $channel_id . "/messages?limit=100");
            curl_setopt_array($ch2, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER => [
                    "Authorization: Bot " . $token,
                    "Content-Type: application/json",
                    "User-Agent: ASCI-App (https://github.com/uva-cs3240, 1.0)"
                ]
            ]);
            $msg_response  = curl_exec($ch2);
            $msg_http_code = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
            curl_close($ch2);

            // Skip channels we can't read (no permission, etc.)
            if ($msg_http_code !== 200) continue;

            $messages = json_decode($msg_response, true);
            if ($messages === null || count($messages) === 0) continue;

            // Chronological order
            $messages = array_reverse($messages);

            // Per-user aggregates: [ user_id => [ name, questions_asked, total_response_seconds, responses_given ] ]
            $members = [];

            $ensure = function($uid, $name) use (&$members) {
                if (!isset($members[$uid]))
                    $members[$uid] = ["name" => $name, "questions_asked" => 0, "responses_given" => 0, "total_response_seconds" => 0];
            };

            foreach ($messages as $idx => $msg) {
                $content     = trim($msg["content"] ?? "");
                $author_id   = $msg["author"]["id"] ?? null;
                $author_name = $resolveName($msg["author"]["global_name"] ?? ($msg["author"]["username"] ?? "Unknown"));

                if ($author_id === null) continue;

                $ensure($author_id, $author_name);

                // Count as a question if it ends with '?'
                if ($content === "" || substr($content, -1) !== "?") continue;

                $members[$author_id]["questions_asked"]++;
                $asked_at = $msg["timestamp"] ?? null;
                $t_asked  = $asked_at !== null ? strtotime($asked_at) : null;

                // Find all unique responders before the next question
                $seen = [];
                for ($j = $idx + 1; $j < count($messages); $j++) {
                    $reply         = $messages[$j];
                    $reply_content = trim($reply["content"] ?? "");

                    // Stop at the next question
                    if ($reply_content !== "" && substr($reply_content, -1) === "?") break;

                    $rid   = $reply["author"]["id"] ?? null;
                    $rname = $resolveName($reply["author"]["global_name"] ?? ($reply["author"]["username"] ?? "Unknown"));

                    if ($rid === null || $rid === $author_id || isset($seen[$rid])) continue;
                    $seen[$rid] = true;

                    $ensure($rid, $rname);

                    if ($t_asked !== null && isset($reply["timestamp"])) {
                        $t_replied = strtotime($reply["timestamp"]);
                        if ($t_replied !== false && $t_replied >= $t_asked) {
                            $elapsed = $t_replied - $t_asked;
                            // Skip this response if it exceeds the outlier cutoff
                            if ($max_response_seconds !== null && $elapsed > $max_response_seconds)
                                continue;
                            $members[$rid]["responses_given"]++;
                            $members[$rid]["total_response_seconds"] += $elapsed;
                        }
                    } else {
                        $members[$rid]["responses_given"]++;
                    }
                }
            }

            // Build the output member list (only include users who participated)
            $member_list = [];
            foreach ($members as $uid => $m) {
                $avg = $m["responses_given"] > 0
                    ? round($m["total_response_seconds"] / $m["responses_given"])
                    : null;
                $member_list[] = [
                    "name"                 => $m["name"],
                    "questions_asked"      => $m["questions_asked"],
                    "responses_given"      => $m["responses_given"],
                    "avg_response_seconds" => $avg,
                ];
            }

            // Sort by avg response time ascending (non-responders last)
            usort($member_list, function($a, $b) {
                if ($a["avg_response_seconds"] === null && $b["avg_response_seconds"] === null) return 0;
                if ($a["avg_response_seconds"] === null) return 1;
                if ($b["avg_response_seconds"] === null) return -1;
                return $a["avg_response_seconds"] <=> $b["avg_response_seconds"];
            });

            // Only include channels that had at least one message from a real user
            if (count($member_list) > 0) {
                $result_channels[] = [
                    "channel_id"   => $channel_id,
                    "channel_name" => $channel["name"],
                    "members"      => $member_list,
                ];
            }
        }

        return ["success" => "true", "channels" => $result_channels];
    }

    /**
     * Sets the Discord username for a given computing_id.
     * A student may update their own; instructors/TAs require course-manage permission.
     */
    public function setDiscordUsernameHandler($user, $course_id, $computing_id, $discord_username) {
        if ($this->user->computing_id !== $computing_id) {
            if (!$this->userCourseStore->userHasPermission($this->user, $course_id, "course-manage"))
                throw new \asci\exceptions\ASCIPermissionException("Not authorized to update this user's Discord username");
        }

        $success = $this->userStore->setDiscordUsername($computing_id, $discord_username);
        return ["success" => $success ? "true" : "false"];
    }

    /**
     * Returns the Discord username → student mapping for every enrolled user
     * in the given course who has set a Discord username.
     * Requires course-stats permission.
     */
    public function getDiscordMappingHandler($user, $course_id) {
        if (!$this->userCourseStore->userHasPermission($this->user, $course_id, "course-stats"))
            throw new \asci\exceptions\ASCIPermissionException("User does not have permission to access course stats");

        $mapping = $this->userStore->getDiscordMappingForCourse($course_id);
        return ["success" => "true", "mapping" => $mapping];
    }

    public function validateCanvasLmsAccessTokenHandler($asci_course_id, $canvas_lms_access_token) {
      if (!$this->userCourseStore->userHasPermission($this->user, $asci_course_id, "sync-canvas-lms-course"))
        throw new \asci\exceptions\ASCIPermissionException("User does not have permission to validate Canvas LMS access token");
      
      if ($canvas_lms_access_token === "")
        return $this->err("Access token is empty");

      $canvas = new \asci\server\CanvasLmsClient($canvas_lms_access_token, $this->logger);
      $result = $canvas->get("/api/v1/users/self");
      if (!$result["ok"])
        return $this->err($result["error"]);

      $this->synchronizationStore->addCanvasLmsAccessToken($this->user->id, $canvas_lms_access_token);

      return ["success" => "true"];
    }

    public function checkUserHasCanvasLmsAccessTokenHandler() {
      $result = $this->synchronizationStore->checkUserHasCanvasLmsAccessToken($this->user->id);

      if ($result) {
        return ["success" => "true", "hasToken" => true];
      } else {
        return ["success" => "true", "hasToken" => false];
      }
    }

    public function removeCanvasLmsAccessTokenHandler($asci_course_id) {
      if (!$this->userCourseStore->userHasPermission($this->user, $asci_course_id, "sync-canvas-lms-course"))
        throw new \asci\exceptions\ASCIPermissionException("User does not have permission to remove Canvas LMS access token");

      $result = $this->synchronizationStore->removeCanvasLmsAccessToken($this->user->id);

      if ($result)
        return ["success" => "true"];
      return ["success" => "false"];
    }

    public function getCanvasLmsEnrollmentTermsHandler($asci_course_id) {
      if (!$this->userCourseStore->userHasPermission($this->user, $asci_course_id, "sync-canvas-lms-course"))
        throw new \asci\exceptions\ASCIPermissionException("User does not have permission to get Canvas LMS enrollment terms");
      
      $canvas = $this->canvasLmsClientForCurrentUser();

      $terms = $canvas->getAll("/api/v1/accounts/self/terms", "per_page=100", "enrollment_terms");
      if ($terms === null)
        return $this->err($canvas->getLastError());

      $result = [];

      $canvas_access_token = $this->synchronizationStore->getCanvasLmsAccessToken($this->user->id);

      $canvas_domain = "https://canvas.its.virginia.edu";
      $url = "$canvas_domain/api/v1/accounts/self/terms?per_page=100";
      $results=[];

      foreach ($terms as $term) {
        if (preg_match('/^\d{4} (Fall|Spring|Summer)$/', $term['name'])) {
          $results[$term['id']] = $term['name'];
        }
      }

      return ["success" => "true", "terms" => $results];
    }

    public function getCanvasLmsCoursesHandler($asci_course_id) {
      if (!$this->userCourseStore->userHasPermission($this->user, $asci_course_id, "sync-canvas-lms-course"))
        throw new \asci\exceptions\ASCIPermissionException("User does not have permission to get Canvas LMS courses");

      $canvas = $this->canvasLmsClientForCurrentUser();
      $courses = $canvas->getAll("/api/v1/courses", "enrollment_type=teacher&per_page=100");
      if ($courses === null)
        return $this->err("Failed to fetch Canvas LMS courses");

      $linked_courses = $this->synchronizationStore->getLinkedCanvasLmsCourses();
      $linked_map = [];
      if ($linked_courses) {
        foreach ($linked_courses as $linked_course) {
          $linked_map[(string) $linked_course["canvas_course_id"]] = [
            "mnemonic" => $linked_course["mnemonic"],
            "number" => $linked_course["number"],
            "name" => $linked_course["name"],
            "semester" => $linked_course["semester"],
          ];
        }
      }

      $results = [];
      foreach ($courses as $course) {
        $canvas_course_id = (string) $course["id"];
        $linked = isset($linked_map[$canvas_course_id]);
        $results[] = [
          "id" => $course["id"],
          "name" => $course["name"],
          "course_code" => $course["course_code"],
          "enrollment_term_id" => $course["enrollment_term_id"],
          "linked" => $linked,
          "linked_asci_course" => $linked ? $linked_map[$canvas_course_id] : null,
        ];
      }

      return ["success" => "true", "courses" => $results];
    }

    public function syncCanvasLmsCourseHandler($asci_course_id, $canvas_lms_course) {
      if (!$this->userCourseStore->userHasPermission($this->user, $asci_course_id, "sync-canvas-lms-course"))
        throw new \asci\exceptions\ASCIPermissionException("User does not have permission to sync with a Canvas LMS course");

      $result = $this->synchronizationStore->syncCanvasLmsCourse($asci_course_id, $canvas_lms_course);

      return ["success" => "true", "course" => $result];
    }

    public function getCanvasLmsCourseHandler($asci_course_id) {
      $result = $this->synchronizationStore->getCanvasLmsCourse($asci_course_id);

      if ($result)
        return ["success" => "true", "course" => $result];
      return ["success" => "false"];
    }
    
    public function desyncCanvasLmsCourseHandler($asci_course_id) {
      if (!$this->userCourseStore->userHasPermission($this->user, $asci_course_id, "sync-canvas-lms-course"))
        throw new \asci\exceptions\ASCIPermissionException("User does not have permission to desync from a Canvas LMS course");

      $result = $this->synchronizationStore->desyncCanvasLmsCourse($asci_course_id);

      if ($result)
        return ["success" => "true", "course" => $result];
      return err("No Canvas LMS course assoicated with ASCI course");
    }

  public function syncCanvasLmsRosterHandler($asci_course_id) {
    if (!$this->userCourseStore->userHasPermission($this->user, $asci_course_id, "sync-canvas-lms-course-roster"))
        throw new \asci\exceptions\ASCIPermissionException("User does not have permission to sync the Canvas LMS roster");

    $canvas_course = $this->synchronizationStore->getCanvasLmsCourse($asci_course_id);
    if (!$canvas_course)
      return $this->err("No Canvas LMS course associated with ASCI course");

    $access_token = $this->synchronizationStore->getCanvasLmsAccessToken($this->user->id);
    if (!$access_token)
      return $this->err("No Canvas LMS access token found");

    $canvas = new \asci\server\CanvasLmsClient($access_token, $this->logger);
    $canvas_course_id = $canvas_course["canvas_course_id"];
    $query = "enrollment_type[]=student&enrollment_type[]=ta&enrollment_type[]=teacher&include[]=enrollments&per_page=100";

    $canvas_lms_users = $canvas->getAll("/api/v1/courses/$canvas_course_id/users", $query);
    if ($canvas_lms_users === null)
      return $this->err("Failed to fetch Canvas LMS roster");

    $converted = [];
    $skipped = [];
    foreach ($canvas_lms_users as $canvas_lms_user) {
      $person = $this->synchronizationStore->canvasLmsUserToAsciUser($canvas_lms_user);
      if ($person === null) {
        $skipped[] = $canvas_lms_user;
      } else {
        $converted[] = $person;
      }
    }

    $result = $this->synchronizationStore->syncCanvasLmsRoster($asci_course_id, $converted);

    return [
      "success" => "true",
      "course" => $this->synchronizationStore->getCanvasLmsCourse($asci_course_id),
      "added" => $result["added"],
      "updated" => $result["updated"],
      "removed" => $result["removed"],
      "skipped" => $skipped,
    ];

    return ["success" => "true", "asci_roster" => $coverted];
  }

  private function canvasLmsClientForCurrentUser() {
    $access_token = $this->synchronizationStore->getCanvasLmsAccessToken($this->user->id);
    return new \asci\server\CanvasLmsClient($access_token, $this->logger);
  }
}

