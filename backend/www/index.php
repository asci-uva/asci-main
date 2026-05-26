<?php
// On Heroku set the FRONTEND_URL config var to your frontend app's URL.
// Falls back to localhost:3000 for local development.
$allowedOrigin = getenv('FRONTEND_URL') ?: 'http://localhost:3000';
header("Access-Control-Allow-Origin: $allowedOrigin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Origin, Content-Type, Accept, X-Requested-With, X-CSRF-Token, X-ASCI-Tab-Id");
header("Access-Control-Max-Age: 3600");

// Handle CORS preflight before session/database work.
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit;
}
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
 * Join the session
 */
session_start();

/**
 * If debug is on, turn on error reporting
 */
if (\asci\Config::$DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 0);
}


// Namespace shortcuts
use \asci\server\Server as Server;
use \Monolog\Logger;
use \Monolog\Handler\StreamHandler;

// Set up the global log stream
$loglevel = Logger::WARNING;
if (\asci\Config::$DEBUG_MODE) {
    $loglevel = Logger::DEBUG;
}
$log = new StreamHandler(\asci\Config::$LOG_DIR . \asci\Config::$SERVER_LOGFILE, $loglevel);

try {
    // Get the request body for processing
    $input = file_get_contents("php://input");
    if ($input == null) {
        throw new \asci\exceptions\ASCIException("No input given");
    }
    
    // Parse the JSON input
    $jsonInput = json_decode($input, true);
    if ($jsonInput == null) {
        throw new \asci\exceptions\ASCIException("Could not parse input");
    }

    // Attach a per-tab id (if present) so auth can stay isolated across tabs.
    $tabId = $_SERVER['HTTP_X_ASCI_TAB_ID'] ?? null;
    if ($tabId !== null && preg_match('/^[A-Za-z0-9._:-]{1,128}$/', $tabId)) {
        $jsonInput['_tab_id'] = $tabId;
    }

    // Check if this is a streaming request
    $isStreaming = (isset($jsonInput["command"]) &&
        ($jsonInput["command"] === "newLlmChatStream" || $jsonInput["command"] === "followupLlmChatStream"));

    if ($isStreaming) {
        // Set SSE headers before processing
        header('Content-Type: text/event-stream');
        header('Cache-Control: no-cache');
        header('Connection: keep-alive');
        header('X-Accel-Buffering: no');

        // Disable output buffering for real-time streaming
        while (ob_get_level() > 0) {
            ob_end_flush();
        }
        ob_implicit_flush(true);
    }
    
    // Instantiate and run the server
    $server = new Server($jsonInput);
    $server->run();

    if (!$isStreaming) {
        // Standard JSON response
        foreach ($server->getResponseHeaders() as $header)
            header($header);
        echo $server->getResponse();
    }
} catch (Exception $e) {
    if (!headers_sent()) {
        header("Content-Type: application/json");
    }
    if ($e->getCode() > 0)
        http_response_code($e->getCode());
    die($e);
}
