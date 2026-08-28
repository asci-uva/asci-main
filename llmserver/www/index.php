<?php
header("Access-Control-Allow-Origin: http://localhost:8081");
//header("Access-Control-Allow-Credentials ")


header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Origin, Content-Type, Accept");
/**
 * Landing page of internal server api
 *
 * Creates an instance of the Server class and runs it
 *
 * @author Robbie Hott
 * @license https://opensource.org/licenses/BSD-3-Clause BSD 3-Clause
 * @copyright 2015 the Rector and Visitors of the University of Virginia, and
 *            the Regents of the University of California
 */

/**
 * Load dependencies
 */
include ("/opt/src/vendor/autoload.php");

/**
 * If debug is on, turn on error reporting
 */
/*if (\asci\Config::$DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 0);
}*/


// Namespace shortcuts
use \ascillm\server\Server as Server;
use \Monolog\Logger;
use \Monolog\Handler\StreamHandler;

// Set up the global log stream
$loglevel = Logger::WARNING;
if (\ascillm\Config::$DEBUG_MODE) {
    $loglevel = Logger::DEBUG;
}
$log = new StreamHandler(\ascillm\Config::$LOG_DIR . \ascillm\Config::$SERVER_LOGFILE, $loglevel);

try {
    // Get the request body for processing
    $input = file_get_contents("php://input");
    if ($input == null) {
        throw new \ascillm\exceptions\ASCIException("No input given");
    }
    
    // Parse the JSON input
    $jsonInput = json_decode($input, true);
    if ($jsonInput == null) {
        throw new \ascillm\exceptions\ASCIException("Could not parse input");
    }

    // Check for streaming mode
    $isStreaming = isset($jsonInput["stream"]) && $jsonInput["stream"] === true;

    if ($isStreaming) {
        // SSE streaming mode
        header('Content-Type: text/event-stream');
        header('Cache-Control: no-cache');
        header('Connection: keep-alive');
        header('X-Accel-Buffering: no');

        // Disable output buffering
        while (ob_get_level() > 0) {
            ob_end_flush();
        }
        ob_implicit_flush(true);

        $server = new Server($jsonInput);
        $server->runStreaming();
    } else {
        // Standard JSON mode
        $server = new Server($jsonInput);
        $server->run();
        
        foreach ($server->getResponseHeaders() as $header)
            header($header);
        
        echo $server->getResponse();
    }
} catch (Exception $e) {
    header("Content-Type: application/json");
    if ($e->getCode() > 0)
        http_response_code($e->getCode());
    die($e);
}
// Exit
exit();
