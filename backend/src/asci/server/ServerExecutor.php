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
    private $db = null;
    public $result = null;

    public $userStore = null; // The user storage 

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
        
        //TODO: Put these back in and get database connection working
        $this->db = new \asci\server\database\DatabaseConnector();
        $this->userStore = new \asci\server\database\DBUser($db);
        // Check $_SERVER["uid"]; // their computing ID  (name and id can come from roster)
    }

    /**
     * Handle User Login
     *
     * Sets current session for new
     *
     * @return bool login success
     */
    public function loginHandler($data){
        return false;
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
        return $this->userStore->register($data["userid"],$data["password"])
    }

    public function joinQueue($userid, $courseid, $issue, $issue_subject) {
        return $this->userStore->joinQueue($userid, $courseid, $issue, $issue_subject);
    }

    public function leaveQueue($userid) {
        return $this->userStore->leaveQueue($userid);
    }
}
