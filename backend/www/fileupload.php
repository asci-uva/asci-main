<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
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
  $input = $_POST;
    if ($input == null) {
        throw new \asci\exceptions\ASCIException("No input given");
    }
    
    // Instantiate and run the server with POST values
    $server = new Server($input);
    $server->run();
    
    // Return the content type and output of the server
    foreach ($server->getResponseHeaders() as $header)
        header($header);
    
    echo $server->getResponse();
} catch (Exception $e) {
    header("Content-Type: application/json");
    if ($e->getCode() > 0)
        http_response_code($e->getCode());
    die($e);
}
