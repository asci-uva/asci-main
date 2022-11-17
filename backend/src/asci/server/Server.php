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
class Server {

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
    private $responseHeaders = array (
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
    public function __construct($input) {
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
    private function setResponse($response) {
        $this->response = array_merge($this->response, $response);
    }

    /**
     * Run Method
     *
     * Starts the server
     */
    public function run() {

        $this->logger->addDebug("Server starting to handle request", array("input" => $this->input));

        if ($this->input == null || empty($this->input)) {
            return; 
        }

        // Decide what to do based on the command given to the server
        switch ($this->input["command"]) {

            case "hello": 
                $this->setResponse([
                    "response"=>"Hi, this works",
                    "second"=>[
                        "more", "json"
                    ]
                ]);
                break;
            case "login":
                $executor = new \asci\server\ServerExecutor();
                $executor->printResult();
                $result = $this->loginHandler();
                $this->setResponse([
                    array("userid"=> "jre3wjh",
                      "login"=> $result,
                      "error"=>"none")
                ]);
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
    public function getResponseHeaders() {

        return $this->responseHeaders;
    }

    /**
     * Handle User Login
     *
     * Sets current session for new
     *
     * @return bool login success
     */
    public function loginHandler(){
        return false;
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
    public function getResponse() {
        $this->response["timing"] =round((microtime(true) - $this->timing) * 1000, 2);
        return json_encode($this->response, JSON_PRETTY_PRINT);
    }
}
