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

        /* Grab the username from netbadge IF the server is in DEBUG mode */
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

        $this->logger->addDebug("Server starting to handle request", array("input" => $this->input));
        $executor = new \asci\server\ServerExecutor();

        if ($this->input == null || empty($this->input)) {
            return;
        }

        /* Grab the username from netbadge IF the server is in DEBUG mode */
        /* Otherwise, use the user provided by request */
        $user = $this->validateUsername($this->input);
        

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

            //given student id, token, courseid. Join the queue
            //if student, token pair is valid and they can
            case "joinQueue":
                
                $courseId = $this->input["courseId"];
                $question = $this->input["question"];
                $subject = $this->input["subject"];
                $location = $this->input["location"];
                $this->setResponse($executor->joinQueueHandler($user, $courseId, $question, $subject, $location));

                
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

            case "getNumberWaiting":

                $courseId = $this->input["courseId"];
                
                $this->setResponse($executor->getNumberWaiting($user, $courseId));
                
                break;

            case "getStudentForTA":

                $courseId = $this->input["courseId"];
                
                $this->setResponse($executor->getStudentForTA($user, $courseId));
                
                break;



            case "getTAMeetingDetails":

                $courseId = $this->input["courseId"];
                
                $this->setResponse($executor->getTAMeetingDetails($user, $courseId));
                
                break;

            case "TAEndMeeting":

                $sessionId = $this->input["sessionId"];
                
                $this->setResponse($executor->endSession($user, $sessionId));
                break;


            /*FRONT END IS NOT YET USING ANYTHING BELOW THIS POINT*/

            case "createUser":
                $result = $executor->createUser($this->input);
                $this->setResponse(["results" => $result]);
                break;
            
            case "createCourse":
                $result = $executor->createCourse($this->input);
                $this->setResponse(["results" => $result]);
                break;

            

            
            case "register":
                $result = $executor->registerUser($this->input);
                $this->setResponse(["results" => $result]);
                break;

            default:
                $this->setResponse(["response" => "Hello world!"]);

        }

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
