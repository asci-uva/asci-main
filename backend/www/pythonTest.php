<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
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
use \asci\server\Server as Server;
use \asci\util\CosineSim as CosineSim;
use \Monolog\Logger;
use \Monolog\Handler\StreamHandler;

// Set up the global log stream
$loglevel = Logger::WARNING;
if (\asci\Config::$DEBUG_MODE) {
    $loglevel = Logger::DEBUG;
}
$log = new StreamHandler(\asci\Config::$LOG_DIR . \asci\Config::$SERVER_LOGFILE, $loglevel);

echo "This is python test<br>";

$cosSim = new CosineSim();
$buffer = $cosSim->testFindMatches();
echo $buffer[0];
echo "<br>";
echo $buffer[1];
echo "<br>";
echo $buffer[2];
echo "<br>";
echo "Done";

// Exit
exit();
