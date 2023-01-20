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



    /**
     * Handle User Login
     *
     * Sets current session for new
     *
     * @return bool login success
     */
    public function loginHandler($computing_id, $password){
        $user = $this->userStore->getUser($computing_id)->toArray();

        if($user["computing_id"] == null){
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
        $session = (new \asci\server\database\DBSession($this->db))->getSessionsForUser($user->getId(), $course->getCourseId());

        $response = [];
        $response["usercourse"] = $course->toArray();
        $response["session"] = ($session === null) ? null : $session->toArray();
        $response["success"] = "true";

        return $response;

    }

    public function joinQueueHandler($computing_id, $course_id, $question){

        //0: Grab the user
        $user = $this->userStore->getUser($computing_id);
 
        //1: Get UserCourse (add function to get just one course)
        $course = (new \asci\server\database\DBUserCourse($this->db))->getCourseForUser($user->getComputingId(), $course_id);


        //2: See if a session already exists for this person / course combo?
        $dbsession = new \asci\server\database\DBSession($this->db);
        $session = $dbsession->getSessionsForUser($user->getId(), $course->getCourseId());

        $result = [];
        $result["usercourse"] = $course->toArray();

        //If no session yet, insert one and send the new one back
        if($session == null){
            //create a new one and return it back
            $session = $dbsession->createNewStudentSession($user->getId(), $course->getCourseId(), $course->getRole(), $question);
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
        $session = $dbsession->getSessionsForUser($user->getId(), $course->getCourseId());

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
