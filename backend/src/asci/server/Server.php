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

    /**
     * Run Method
     *
     * Starts the server
     */
    public function run()
    {

        $this->logger->addDebug("Server starting to handle request", array("input" => $this->input));

        if ($this->input == null || empty($this->input)) {
            return;
        }

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
                //$executor = new \asci\server\ServerExecutor();
                //$result = $this->loginHandler();
                
                $this->setResponse([
                    "userid" => "mrf8t",
                    "role" => "ta",
                    "token" => "xkd143fghfldkahde",
                    "success" => "true"
                ]);
                break;

            //given userId and token, see if this user is already logged in
            //send failure notice if not and frontend will kick to login screen
            //state (for students) is "none", "onQueue", or "beingHelped" (Might change)
            //state for students can be none, working, helping (a student)
            case "sessionPing":
                $this->setResponse([
                    "userid" => "mrf8t",
                    "role" => "ta",
                    "token" => "xkd143fghfldkahde",
                    "success" => "true",
                    "state" => "none"
                ]);
                break;

            //given a userId and token, make sure user is logged in and 
            //return list of active course objects that student is enrolled in.
            case "getCourses":

                $this->setResponse(
                [
                    "userid" => "mrf8t",
                    "role" => "ta",
                    "token" => "xkd143fghfldkahde",
                    "success" => "true",
                    "courses" => 
                        [
                            "1" => "CS2130 - Sp23",
                            "2" => "CS3100 - Sp23"
                        ]
                ]
                );
                break;

            //given student id, token, courseid. Join the queue
            //if student, token pair is valid and they can
            case "joinQueue":
                /*$executor = new \asci\server\ServerExecutor();
                $result = $executor->joinQueue($this->input['userid'], $this->input['courseid'], $this->input['issue'], $this->input['issue_subject']);
                $this->setResponse(["results" => $result]);*/
                $this->setResponse(
                [
                    "userid" => "mrf8t",
                    "role" => "student",
                    "token" => "xkd143fghfldkahde",
                    "loggedIn" => "true",
                    "success" => "true"
                ]
                );
                break;

            //Updates student with queue status (still on queue)
            //what position, etc. 
            case "getQueueStatus":
                //random position so we can changes being polled
                $position = rand(1,10);
                $readyToHelp = "false";
                if ($position < 2)
                    $readyToHelp = "true";

                $this->setResponse(
                [
                    "userid" => "mrf8t",
                    "role" => "student",
                    "token" => "xkd143fghfldkahde",
                    "success" => "true",
                    "onQueue" => "true",
                    "courseName" => "CS2130 - Sp23",
                    "queuePosition" => $position,
                    "beingHelped" => $readyToHelp,
                    "loggedIn" => "true"
                ]
                );
                break;

            case "leaveQueue":
                //$executor = new \asci\server\ServerExecutor();
                //$result = $executor->leaveQueue($this->input['userid']);
                //$this->setResponse(["results" => $result]);

                $this->setResponse(
                [
                    "userid" => "mrf8t",
                    "role" => "student",
                    "token" => "xkd143fghfldkahde",
                    "success" => "true"
                ]
                );
                break;

            case "meetingInfo":
                //$executor = new \asci\server\ServerExecutor();
                //$result = $executor->leaveQueue($this->input['userid']);
                //$this->setResponse(["results" => $result]);

                $this->setResponse(
                [
                    "userid" => "mrf8t",
                    "role" => "student",
                    "token" => "xkd143fghfldkahde",
                    "success" => "true",
                    "taId" => "abc3ta",
                    "taName" => "Abby Teachalots"
                ]
                );
                break;

            case "leaveMeeting":

                $this->setResponse(
                [
                    "userid" => "mrf8t",
                    "role" => "student",
                    "token" => "xkd143fghfldkahde",
                    "success" => "true",
                ]
                );
                break;


            /* TA SPECIFIC FUNCTIONS ARE BELOW THIS POINT */

            //given a userId and token, make sure user is logged in and 
            //user is TA and return list of active course objects that TA is teaching.
            case "getTACourses":

                $this->setResponse(
                [
                    "userid" => "mrf8t",
                    "role" => "ta",
                    "token" => "xkd143fghfldkahde",
                    "success" => "true",
                    "courses" => 
                        [
                            "1" => "CS2130 - Sp23",
                            "2" => "CS3100 - Sp23"
                        ]
                ]
                );
                break;

            case "startTAWorking":

                $this->setResponse(
                [
                    "userid" => "mrf8t",
                    "role" => "student",
                    "token" => "xkd143fghfldkahde",
                    "loggedIn" => "true",
                    "success" => "true"
                ]
                );
                break;

            case "getStudentForTA":

                $this->setResponse(
                [
                    "userid" => "mrf8t",
                    "role" => "student",
                    "token" => "xkd143fghfldkahde",
                    "loggedIn" => "true",
                    "success" => "true",
                ]
                );
                break;


            case "getTAMeetingDetails":

                $this->setResponse(
                [
                    "userid" => "mrf8t",
                    "role" => "student",
                    "token" => "xkd143fghfldkahde",
                    "loggedIn" => "true",
                    "success" => "true",
                    "student" => [
                        "userid" => "std1ab",
                        "name" => "Stevie Learns"
                    ]
                ]
                );
                break;
                
            case "TAEndMeeting":

                $this->setResponse(
                [
                    "userid" => "mrf8t",
                    "role" => "student",
                    "token" => "xkd143fghfldkahde",
                    "loggedIn" => "true",
                    "success" => "true",
                ]
                );
                break;


            /*FRONT END IS NOT YET USING ANYTHING BELOW THIS POINT*/

            case "createUser":
                $executor = new \asci\server\ServerExecutor();
                $result = $executor->createUser($this->input);
                $this->setResponse(["results" => $result]);
                break;
            
            case "createCourse":
                $executor = new \asci\server\ServerExecutor();
                $result = $executor->createCourse($this->input);
                $this->setResponse(["results" => $result]);
                break;

            

            
            case "register":
                $user = new User();
                $this->setResponse(
                    $user->register($this->input["userid"],$this->input["password"])
                );
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