<?php

/**
 * Server Class File
 *
 * Contains the main server class that instantiates the main server
 *
 * License:
 *
 *
 * @author Robbie Hott
 */
namespace asci\server;

error_reporting(E_ALL);
ini_set('display_errors', 0);

use asci\util\ExclusiveLock as ExclusiveLock;

/**
 * Server Class
 *
 * This is the main server class. It should be instantiated, then the run()
 * method called to start the server running.
 *
 * @author Robbie Hott
 */
class Server
{

    /**
     * Input parameters from the querier
     *
     * @var array Associative array of the input query
     */
    private $input = null;

    /**
     * Headers for response
     *
     * @var array Response headers
     */
    private $responseHeaders = array(
        "Content-Type: application/json"
    );

    /**
     * Response Array
     * @var string[] Response
     */
    private $response = array();

    /**
     *
     * @var int Timing information (ms)
     */
    private $timing = 0;

    /**
     * @var \Monolog\Logger $logger the logger for this server
     */
    private $logger;

    /**
     * Constructor
     *
     * Requires the input to the server as an associative array
     *
     * @param array $input Input to the server
     */
    public function __construct($input)
    {
        global $log;

        $this->input = $input;
        $this->timing = $_SERVER["REQUEST_TIME_FLOAT"];
        $this->response = array(
            "request" => $this->input,
        );


        // create a log channel
        $this->logger = new \Monolog\Logger('Server');
        $this->logger->pushHandler($log);
    }

    /**
     * Set Response
     *
     * Sets the server's response
     *
     * @param array $response The response as an assocative array
     */
    private function setResponse($response)
    {
        $this->response = array_merge($this->response, $response);
    }

    /*
     * This function returns the username that should be used for this request
     * if netbadge is in play, checks that provided username matches the one provided
     * by the request JSON. If not, returns an error.
     * If we are in debug mode, we just trust the username that the request provided.
     */
    public function validateUsername($input){

        /* Grab the username from netbadge IF the server is not in DEBUG mode */
        /* Otherwise, use the user provided by request */
        // Login is a special command that doesn't require this validation
        $user = null;
        if(\asci\Config::$DEBUG_MODE){
            $user = $input["user"];
        } else { // netbadge
            $user = $_SERVER["uid"];

            if($user == null || ($input["command"] != "login" && $user != $input["user"])){
                /* Request is invalid because username's don't match */
                $result = ["success" => "false", "error" => "ERROR: Session userId does not match provided user id"];
                $this->setResponse($result);
                return;
            }
        }

        return $user;
    }

    /**
     * Run Method
     *
     * Starts the server
     */
    public function run()
    {

        //$this->logger->addDebug("Server starting to handle request", array("input" => $this->input));
        $executor = new \asci\server\ServerExecutor();

        if ($this->input == null || empty($this->input)) {
            return;
        }

        /* Grab the username from netbadge IF the server is in DEBUG mode */
        /* Otherwise, use the user provided by request */
        $user = $this->validateUsername($this->input);
        

        // /* This section acquires a lock for the given course IF a courseId was provided */
        // /* ------------------------------------------------------------------ */
        // $course_id = $this->input["courseId"] ?? null;
        // $lock = null;
        // $attempt_max = 40; //try to get the lock at most 10 times.
        // if($course_id != null && \asci\Config::$LOCKING_ENABLED){
        //     /* acquire the lock */
        //     $lock_key = "course-" . $course_id;
        //     $lock = new ExclusiveLock($lock_key);
        //     $attempt = 0;
        //     while($lock->lock() == False && $attempt<$attempt_max){
        //         $attempt = $attempt + 1;
        //         usleep(250000); // sleep for a quarter of a second
        //     }

        //     if($attempt >= $attempt_max){
        //         $this->setResponse([
        //             "error" => "Could not acquire lock after multiple attempts. Try again later."
        //         ]);
        //         //break;
        //     }
        // }

        /* Lock acquired OR not necessary */

        /* ------------------------------------------------------------------ */

        // Decide what to do based on the command given to the server
        switch ($this->input["command"]) {
            case "hello":
                print_r($this->input);
                $this->setResponse([
                    "response" => "Hi, this works",
                    "second" => [
                        "more",
                        "json"
                    ]
                ]);
                break;
            case "login":
                
                $this->setResponse($executor->loginHandler($user));

                break;

            //given userId and courseId, 
            //sends back info about where in the "process" this student / ta
            //is for this particular "course"
            //e.g., currently on queue, being helped, etc.
            case "sessionPing":

                
                $courseId = $this->input["courseId"];

                $this->setResponse($executor->sessionPingHandler($user,$courseId));

                break;

            //given a userId and token, make sure user is logged in and 
            //return list of active course objects that student is enrolled in.
            case "getCourses":

                
                $this->setResponse($executor->getCoursesHandler($user));

                break;

            //given a userId and token, make sure user is logged in and 
            //return list of active course objects that student is enrolled in.
            case "getCoursesByRole":
                $role = $this->input["role"];
                
                $this->setResponse($executor->getCoursesByRoleHandler($user, $role));

                break;

            //given student id, token, courseid. Join the queue
            //if student, token pair is valid and they can
            case "joinQueue":
                
                $courseId = $this->input["courseId"];
                $question = $this->input["question"];
                $subject = $this->input["subject"];
                $location = $this->input["location"];
                $groupOption = $this->input["groupOption"];
                $this->setResponse($executor->joinQueueHandler($user, $courseId, $question, $subject, $location, $groupOption));

                
                break;

            //Updates student with queue status (still on queue)
            //what position, etc. 
            case "getQueueStatus":
                
                $courseId = $this->input["courseId"];
                
                $this->setResponse($executor->getQueueStatus($user, $courseId));
                break;

            case "leaveQueue":

                $courseId = $this->input["courseId"];
                
                $this->setResponse($executor->leaveQueue($user, $courseId));
                
                break;

            case "getMeetingDetails":
                
                $courseId = $this->input["courseId"];
                
                $this->setResponse($executor->getMeetingDetails($user, $courseId));
                
                break;

            case "leaveMeeting":

                
                $sessionId = $this->input["sessionId"];
                
                $this->setResponse($executor->endSession($user, $sessionId));
                
                break;


            /* TA SPECIFIC FUNCTIONS ARE BELOW THIS POINT */

            case "getWaitingSessions":

                $courseId = $this->input["courseId"];
                
                $this->setResponse($executor->getWaitingSessions($user, $courseId));
                
                break;

            case "getStudentForTA":

                $courseId = $this->input["courseId"];
                
                $this->setResponse($executor->getStudentForTA($user, $courseId));
                
                break;

            case "takeSpecificStudentForTA":

                $courseId = $this->input["courseId"];
                $sessionId = $this->input["sessionId"];
                
                $this->setResponse($executor->takeSpecificStudentForTA($user, $courseId, $sessionId));
                
                break;



            case "getTAMeetingDetails":

                $courseId = $this->input["courseId"];
                
                $this->setResponse($executor->getTAMeetingDetails($user, $courseId));
                
                break;

            case "TAEndMeeting":

                $sessionId = $this->input["sessionId"];
                
                $this->setResponse($executor->endSession($user, $sessionId));
                break;

            case "PutStudentBackOnQueue":

                $studId = $this->input["studentId"];
                $sessionId = $this->input["sessionId"];
                
                $this->setResponse($executor->putStudentBackOnQueue($user, $studId, $sessionId));
                break; 


            case "GetSessionForSurvey":

                $sessionId = $this->input["sessionId"];
                $courseId = $this->input["courseId"];

                $this->setResponse($executor->getSessionForSurvey($user, $courseId, $sessionId));

                break;

            case "GetMostRecentSessionWithNoSurvey":

                $courseId = $this->input["courseId"];

                $this->setResponse($executor->getMostRecentSessionWithNoSurvey($user, $courseId));
                break;

            case "SubmitSurvey":
                
                $surveyData = $this->input["surveyData"];
                $session_id = $this->input["sessionId"];

                $this->setResponse($executor->handleSubmitSurvey($user, $session_id, $surveyData));

                break;

            /* Get a list of potential group members to add to the TAs current session */
            case "getPotentialGroupInfo":
                $courseId = $this->input["courseId"];
                
                $this->setResponse($executor->getPotentialGroupInfo($user, $courseId));
                
                break;

            /* Given a TA, main session they are helping, and other sessions */
            /* Create a group so that the TA is helping ALL of the students at once */
            case "createGroup":
                $courseId = $this->input["courseId"];
                $sessionId = $this->input["sessionId"];
                $groupSessions = $this->input["groupSessions"];
                $location = $this->input["location"];

                $this->setResponse($executor->createGroup($user, $courseId, $sessionId, $groupSessions, $location));
                
                break;

            case "getCourseSettings":
                $courseId = $this->input["courseId"];

                $this->setResponse($executor->getCourseSettings($courseId));
                break;

            case "setCourseSettings":
                $courseId = $this->input["courseId"];
                $newSettings = $this->input["settings"];

                $this->setResponse($executor->setCourseSettings($courseId, $newSettings));
                break;

            case "cancelGroup":
                $courseId = $this->input["courseId"];
                $sessionId = $this->input["sessionId"];

                $this->setResponse($executor->cancelGroup($user, $courseId, $sessionId));
                
                break;

            case "clearQueue":
                $courseId = $this->input["courseId"];

                $this->setResponse($executor->clearQueue($user, $courseId));
                
                break;
            
            case "newLlmChat":
                $result = $executor->llmChat($this->input);
                $this->setResponse($result);
                break;

            case "followupLlmChat":
                $result = $executor->llmChat($this->input);
                $this->setResponse($result);
                break;

            case "createLlm":
                $result = $executor->uploadContentLLM($this->input);
                $this->setResponse($result);
                break;

            case "createLlmPiazza":
                $result = $executor->uploadPiazzaLLM($this->input);
                $this->setResponse($result);
                break;

            case "createCourse":
                $mnemonic = $this->input["mnemonic"];
                $number = $this->input["number"];
                $name = $this->input["name"];
                $semester = $this->input["semester"];

                $this->setResponse($executor->createCourse($user, $mnemonic, $number, $name, $semester));
                break;
    
            case "updateCourseInfo":
                $course_id = $this->input["course_id"];
                $mnemonic = $this->input["mnemonic"];
                $number = $this->input["number"];
                $name = $this->input["name"];
                $semester = $this->input["semester"];
    
                $this->setResponse($executor->updateCourseInfoHandler($course_id, $mnemonic, $number, $name, $semester));
                break;

            case "uploadRoster":
                $roster = $this->input["roster"];
                $course_id = $this->input["course_id"];
    
                $this->setResponse($executor->uploadRosterHandler($roster, $course_id));
                break;

            case "manuallyAddStudent":
                $fname = $this->input["fname"];
                $lname = $this->input["lname"];
                $pname = $this->input["pname"];
                $computing_id = $this->input["computingId"];
                $role = $this->input["role"];
                $course_id = $this->input["course_id"];

                $this->setResponse($executor->manuallyAddStudentHandler($fname, $lname, $pname, $computing_id, $role, $course_id));
                break;

            // Points system method 
            case "getQuestsForUser":
                $courseId = $this->input["courseId"];

                $this->setResponse($executor->getQuestsForUserHandler($user, $courseId));
                break;

            case "getPointsForUser":
                $courseId = $this->input["courseId"];
                
                $this->setResponse($executor->getPointsForUserHandler($user, $courseId));
                break;    

            case "getAllQuests":
                    $this->setResponse($executor->getAllQuestsHandler());
                    break;
            
            case "addQuestForCourse":
                $questId = $this->input["questId"];
                $courseId = $this->input["courseId"];

                $this->setResponse($executor->addQuestForCourseHandler($questId, $courseId));
                break;

            case "removeQuestForCourse":
                $questId = $this->input["questId"];
                $courseId = $this->input["courseId"];

                $this->setResponse($executor->removeQuestForCourseHandler($questId, $courseId));
                break;
    

            /*FRONT END IS NOT YET USING ANYTHING BELOW THIS POINT*/

            case "createUser":
                $computing_id = $this->input["computing_id"];
                $fname = $this->input["fname"];
                $lname = $this->input["lname"];
                $pname = $this->input["pname"];

                $this->setResponse($executor->createUser($computing_id, $fname, $lname, $pname));
                break;
            

            case "register":
                $result = $executor->registerUser($this->input);
                $this->setResponse(["results" => $result]);
                break;

            case "getTip":
                $this->setResponse(["result" => "success", "tips" => ["The tip will go here", "second tip"]]);
                break;

            case "getAssignmentByCourse":
                $course_id = $this->input["course_id"];
                $this->setResponse($executor->getAssignmentsHandler($course_id));
                break;

            case "downloadGradescopeData":
                $gradescope_username = $this->input["email"];
                $gradescope_password = $this->input["password"];
                $gradescope_courseNumber = $this->input["courseNumber"];
                $course_id = $this->input["course_id"];
                $this->setResponse($executor->runGradescopeDataDownload($gradescope_username, $gradescope_password, $gradescope_courseNumber, $course_id));
                break;
            

            case "updateGradescopeDataByCourse":
                $course_id = $this->input["course_id"];
                $download_file_name = $this->input["download_file_name"];
                $this->setResponse($executor->updateGradescopeDataByCourseHandler($course_id, $download_file_name));
                break;
                
            default:
                $this->setResponse(["response" => "Hello world!"]);

        }

        // /* Release the lock if we had one... */
        // /* ------------------------------------------------------------------ */
        
        // if($lock != null && \asci\Config::$LOCKING_ENABLED){
        //     $lock->unlock();
        // }

        /* Lock acquired OR not necessary */
        
        /* ------------------------------------------------------------------ */

        return;
    }

    /**
     * Get Response Headers
     *
     * Returns the headers for the server's return value. This will likely
     * usually be the JSON content header.
     *
     * @return array headers for output
     */
    public function getResponseHeaders()
    {
        return $this->responseHeaders;
    }


    /**
     * Get Return Statement
     *
     * This should compile the Server's response statement. Currently, it returns a
     * JSON-encoded string or other content value that can be echoed to generate the
     * appropriate response. This should usually be JSON, but may be the contents of a file
     * to be downloaded by the user, so we leave it flexible rather than returning an
     * associative array.
     *
     * @return string server response appropriately encoded
     */
    public function getResponse()
    {
        $this->response["timing"] = round((microtime(true) - $this->timing) * 1000, 2);
        return json_encode($this->response, JSON_PRETTY_PRINT);
    }
}
