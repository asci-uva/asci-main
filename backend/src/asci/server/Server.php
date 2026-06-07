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
     * @var bool Whether this request used streaming output
     */
    public $streaming = false;

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
        $command = $input["command"] ?? null;
        $requestedUser = $input["user"] ?? null;
        $tabId = $input["_tab_id"] ?? null;

        if(\asci\Config::$AUTH_MODE == "netbadge"){
            $user = $_SERVER["uid"];

            if($user == null || ($command != "login" && $user != $requestedUser)){
                /* Request is invalid because username's don't match */
                throw new \asci\exceptions\ASCIAuthenticationException("Session userId does not match provided user id", 401);
            }
        } else { // Default to password mode
            // check if user has logged in. If so, use that user
            // from the server-side session.  If not, then there is no user.
            $this->logger->addDebug("SESSION variable in Server", $_SESSION);

            if ($tabId !== null && isset($_SESSION["uid_by_tab"]) && is_array($_SESSION["uid_by_tab"])) {
                if (array_key_exists($tabId, $_SESSION["uid_by_tab"])) {
                    $user = $_SESSION["uid_by_tab"][$tabId];
                }
            } else if (isset($_SESSION["uid"])) {
                $user = $_SESSION["uid"];
            }

            if ($user !== null && $command !== "login" && $command !== "logout" && $requestedUser !== null && $user !== $requestedUser) {
                throw new \asci\exceptions\ASCIAuthenticationException("Session userId does not match provided user id", 401);
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

        if ($this->input == null || empty($this->input)) {
            return;
        }

        /* Grab the username from netbadge IF the server is in DEBUG mode */
        /* Otherwise, use the user provided by request */
        $user = $this->validateUsername($this->input);

        // Stand up the executor 
        $executor = new \asci\server\ServerExecutor($user);


        // Limit user-less commands to "info" and "login"
        if ($user == null && 
          ($this->input["command"] != "info" && $this->input["command"] != "login" && $this->input["command"] != "createUser")) {
          $this->input["command"] = "info";
        } else {
          $executor->loadUser($user);

                    // Strict archive enforcement: block student access to archived courses even for direct API calls.
                    $requested_course_id = $this->input["courseId"] ?? $this->input["course_id"] ?? $this->input["course"] ?? null;
                    if (is_array($requested_course_id)) {
                        $requested_course_id = $requested_course_id["course_id"] ?? null;
                    }
                    $executor->denyArchivedCourseForStudents($user, $requested_course_id, $this->input["command"]);
        }

        /* This section acquires a lock for the given course IF a courseId was provided */
        /* ------------------------------------------------------------------ */
        $course_id = $this->input["courseId"] ?? null;
        $lock = null;
        $attempt_max = 40; //try to get the lock at most 10 times.
        if($course_id != null && \asci\Config::$LOCKING_ENABLED){
            /* acquire the lock */
            $lock_key = "course-" . $course_id;
            $lock = new ExclusiveLock($lock_key);
            $attempt = 0;
            while($lock->lock() == False && $attempt<$attempt_max){
                $attempt = $attempt + 1;
                usleep(250000); // sleep for a quarter of a second

              if($attempt >= $attempt_max){
                  $this->setResponse([
                      "error" => "Could not acquire lock after multiple attempts. Try again later."
                  ]);
                 return;
              }
            }
        }

        /* Lock acquired OR not necessary */

        /* ------------------------------------------------------------------ */

        // Decide what to do based on the command given to the server
        switch ($this->input["command"]) {
            case "login":
                $password = null;
                if (isset($this->input["password"]))
                  $password = $this->input["password"];
                $loginResponse = $executor->loginHandler($this->input["user"], $password);

                $tabId = $this->input["_tab_id"] ?? null;
                if (($loginResponse["success"] ?? "false") === "true" && $tabId !== null) {
                    if (!isset($_SESSION["uid_by_tab"]) || !is_array($_SESSION["uid_by_tab"])) {
                        $_SESSION["uid_by_tab"] = array();
                    }
                    $loggedInUser = $loginResponse["user"]["computing_id"] ?? $this->input["user"];
                    $_SESSION["uid_by_tab"][$tabId] = $loggedInUser;
                }

                $this->setResponse($loginResponse);
                break;

            case "logout":
                $tabId = $this->input["_tab_id"] ?? null;

                if ($tabId !== null && isset($_SESSION["uid_by_tab"]) && is_array($_SESSION["uid_by_tab"])) {
                    unset($_SESSION["uid_by_tab"][$tabId]);

                    if (count($_SESSION["uid_by_tab"]) > 0) {
                        $remainingUser = reset($_SESSION["uid_by_tab"]);
                        $_SESSION["uid"] = $remainingUser;
                    } else {
                        session_destroy();
                        session_start();
                    }
                } else {
                    session_destroy();
                    session_start();
                }

                $this->setResponse(["result" => "success", "success" => "true"]);
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
                $code = $this->input["code"];
                $groupOption = $this->input["groupOption"];
                $this->setResponse($executor->joinQueueHandler($user, $courseId, $question, $subject, $location, $code, $groupOption));

                
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
                $executor->updateTAStatus($user, $courseId); 
                $this->setResponse($executor->getWaitingSessions($user, $courseId));
                
                break;

            case "getStudentForTA":

                $courseId = $this->input["courseId"];
                
                $executor->updateTAStatus($user, $courseId); 
                $this->setResponse($executor->getStudentForTA($user, $courseId));
                
                break;

            case "takeSpecificStudentForTA":

                $courseId = $this->input["courseId"];
                $sessionId = $this->input["sessionId"];
                
                $executor->updateTAStatus($user, $courseId); 
                $this->setResponse($executor->takeSpecificStudentForTA($user, $courseId, $sessionId));
                
                break;

            
            case "getAISummary":

                $courseId = $this->input["courseId"];
                $sessionId = $this->input["sessionId"];
            
                $this->setResponse($executor->getSummaryFromDB($user, $courseId, $sessionId));

                error_log("getAISummary called for course $courseId, session $sessionId");

                break;


            case "getTAMeetingDetails":

                $courseId = $this->input["courseId"];
                
                $executor->updateTAStatus($user, $courseId); 
                $this->setResponse($executor->getTAMeetingDetails($user, $courseId));
                
                break;

            case "TAEndMeeting":

                $sessionId = $this->input["sessionId"];
                $courseId = $this->input["courseId"] ?? null;

                if ($courseId !== null) {
                    $executor->updateTAStatus($user, $courseId);
                }
                $this->setResponse($executor->endSession($user, $sessionId));
                break;

            case "PutStudentBackOnQueue":

                $studId = $this->input["studentId"];
                $sessionId = $this->input["sessionId"];

                $courseId = $this->input["courseId"] ?? null;
                if ($courseId !== null) {
                    $executor->updateTAStatus($user, $courseId);
                }
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
                
                $executor->updateTAStatus($user, $courseId); 
                $this->setResponse($executor->getPotentialGroupInfo($user, $courseId));
                
                break;

            /* Given a TA, main session they are helping, and other sessions */
            /* Create a group so that the TA is helping ALL of the students at once */
            case "createGroup":
                $courseId = $this->input["courseId"];
                $sessionId = $this->input["sessionId"];
                $groupSessions = $this->input["groupSessions"];
                $location = $this->input["location"];
                $code = $this->input["code"];

                $executor->updateTAStatus($user, $courseId); 
                $this->setResponse($executor->createGroup($user, $courseId, $sessionId, $groupSessions, $location, $code));
                
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

            case "getCourseStats":
                $courseId = $this->input["courseId"];

                $this->setResponse($executor->getCourseStats($courseId));
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

            case "llmSummary":
                $result = $executor->llmSummary($this->input);
                $this->setResponse($result);
                break;
            
            case "newLlmChat":
                $result = $executor->llmChat($this->input);
                $this->setResponse($result);
                break;

            case "followupLlmChat":
                $result = $executor->llmChat($this->input);
                $this->setResponse($result);
                break;

            case "newLlmChatStream":
            case "followupLlmChatStream":
                // Streaming mode: output SSE directly, no setResponse needed
                $executor->llmChatStreaming($this->input);
                $this->streaming = true;
                break;

            case "createLlm":
                $result = $executor->uploadContentLLM($this->input);
                $this->setResponse($result);
                break;

            case "createLlmPiazza":
            case "uploadPiazza":
                // todo: clean up the commands
                $result = $executor->uploadPiazza($this->input);
                $result = $executor->uploadPiazzaLLM($this->input);
                $this->setResponse($result);
                break;
            case "scrapeURL":
                $executor->scrapeURL($this->input['URL']);
                return;
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

            case "getCourseRoster":                
                $course_id = $this->input["course_id"];
    
                $this->setResponse($executor->getCourseRosterHandler($user, $course_id));
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

            case "getQuestsByStatus":
                $courseId = $this->input["courseId"];
                $status = $this->input["status"];

                $this->setResponse($executor->getQuestsByStatusHandler($user, $courseId, $status));
                break;

            case "getStudentQuests":
                $student = $this->input["student"];
                $course = $this->input["course"];

                $this->setResponse($executor->getQuestsForUserHandler($student, $course));
                break;
            
            case "getPendingQuests":
                $student = $this->input["student"];
                $course = $this->input["course"];
                $status = "Completed - Pending Approval";

                $this->setResponse($executor->getQuestsByStatusHandler($student, $course, $status));
                break;

            case "updateQuestStatus":
                $student = $this->input["student"];
                $course = $this->input["course"];
                $questId = $this->input["questId"];
                $status = $this->input["status"];

                $this->setResponse($executor->updateQuestStatusHandler($questId, $student, $course, $status));
                break;

            case "getPointsForUser":
                $courseId = $this->input["courseId"];
                
                $this->setResponse($executor->getPointsForUserHandler($user, $courseId));
                break;  
                
            case "getPointsForStudent":
                $student = $this->input["student"];
                $course = $this->input["course"];
                
                $this->setResponse($executor->getPointsForUserHandler($student, $course));
                break;    

            case "getAllQuests":
                $this->setResponse($executor->getAllQuestsHandler());
                break;

            case "addQuest":
                $mnemonic = $this->input["mnemonic"];
                $name = $this->input["name"];
                $description = $this->input["description"];
                $total_points = $this->input["total_points"];
                $this->setResponse($executor->addQuestHandler($mnemonic, $name, $description, $total_points));
                break;
            
            case "deleteQuest":
                $quest = $this->input["questId"];
                $this->setResponse($executor->deleteQuestHandler($quest));
                break;
            
            case "getCourseQuests":
                $course = $this->input["course"];
                $this->setResponse($executor->getCourseQuestsHandler($course));
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
            
            case "getCourseContent":
                $course_id = $this->input["course"];
                $this->setResponse($executor->getCourseContentHandler($user, $course_id));
                break;

            case "removeCourseContent":
                $course_id = $this->input["course"];
                $filename = $this->input["filename"];
                $this->setResponse($executor->removeCourseContentHandler($user, $course_id, $filename));
                break;

            /*FRONT END IS NOT YET USING ANYTHING BELOW THIS POINT*/

            case "createUser":
                $computing_id = $this->input["computing_id"];
                $fname = $this->input["fname"];
                $lname = $this->input["lname"];
                $pname = $this->input["pname"];
                $password = $this->input["password"];

                $this->setResponse($executor->createUser($computing_id, $fname, $lname, $pname, $password));
                break;

            /*FRONT END IS NOT YET USING ANYTHING BELOW THIS POINT*/

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

            case "getStudentsFallingBehind":
                $course_id = $this->input["courseId"];
                $this->setResponse($executor->getStudentsFallingBehindHandler($user, $course_id));
                break;

            case "getDiscordChannels":
                $guild_id = $this->input["guildId"];
                $course_id = $this->input["courseId"];
                $this->setResponse($executor->getDiscordChannelsHandler($user, $course_id, $guild_id));
                break;

            case "getDiscordActivity":
                $channel_id = $this->input["channelId"];
                $course_id = $this->input["courseId"];
                $this->setResponse($executor->getDiscordActivityHandler($user, $course_id, $channel_id));
                break;

            case "getDiscordServerSummary":
                $guild_id = $this->input["guildId"];
                $course_id = $this->input["courseId"];
                $max_response_seconds = isset($this->input["maxResponseSeconds"]) ? (int)$this->input["maxResponseSeconds"] : null;
                $this->setResponse($executor->getDiscordServerSummaryHandler($user, $course_id, $guild_id, $max_response_seconds));
                break;

            case "setDiscordUsername":
                $computing_id = $this->input["computingId"];
                $discord_username = $this->input["discordUsername"] ?? null;
                $course_id = $this->input["courseId"] ?? null;
                $this->setResponse($executor->setDiscordUsernameHandler($user, $course_id, $computing_id, $discord_username));
                break;

            case "getDiscordMapping":
                $course_id = $this->input["courseId"];
                $this->setResponse($executor->getDiscordMappingHandler($user, $course_id));
                break;
            
            case "validateCanvasLmsAccessToken":
                $asciCourseId = $this->input["asciCourseId"];
                $canvasLmsAccessToken = $this->input["canvasLmsAccessToken"];
                $this->setResponse($executor->validateCanvasLmsAccessTokenHandler($asciCourseId, $canvasLmsAccessToken));
                break;
            
            case "removeCanvasLmsAccessToken":
                $asciCourseId = $this->input["asciCourseId"];
                $this->setResponse($executor->removeCanvasLmsAccessTokenHandler($asciCourseId));
                break;
            
            
            case "getCanvasLmsEnrollmentTerms":
                $asciCourseId = $this->input["asciCourseId"];
                $this->setResponse($executor->getCanvasLmsEnrollmentTermsHandler($asciCourseId));
                break;
            
            case "fetchCanvasLmsCourseName":
                $courseId = $this->input["courseId"];
                $canvasCourseId = $this->input["canvasCourseId"];
                $accessToken = $this->input["accessToken"];
                $this->setResponse($executor->fetchCanvasLmsCourseNameHandler($courseId, $canvasCourseId, $accessToken));
                break;
            
            case "setCanvasLmsCourse":
                $courseId = $this->input["courseId"];
                $canvasCourseId = $this->input["canvasCourseId"];
                $canvasCourseName = $this->input["canvasCourseName"];
                $accessToken = $this->input["accessToken"];
                $this->setResponse($executor->setCanvasLmsCourseHandler($courseId, $canvasCourseId, $canvasCourseName, $accessToken));
                break;
            
            case "getCanvasLmsSyncStatus":
                $course_id = $this->input["courseId"];
                $this->setResponse($executor->getCanvasLmsSyncStatusHandler($course_id));
                break;
            
            case "getCanvasLmsCourseUsers":
                $course_id = $this->input["course_id"];
                $this->setResponse($executor->getCanvasLmsCourseUsersHandler($course_id));
                break;

            default:
              throw new \asci\exceptions\ASCIException("Unknown command: {$this->input["command"]}"); 

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
