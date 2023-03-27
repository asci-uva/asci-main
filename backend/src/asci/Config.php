<?php

/**
 * Configuration File
 *
 * Contains the configuration options for this instance of the server
 *
 * License:
 *
 *
 * @author Robbie Hott
 * @license https://opensource.org/licenses/BSD-3-Clause BSD 3-Clause
 * @copyright 2015 the Rector and Visitors of the University of Virginia, and
 *            the Regents of the University of California
 */
namespace asci;

/**
 * Configuration class
 *
 * This class contains all the configuration variables for the entire system. It makes use of only
 * public static fields that may be read by any other class in the system. We use this to better scope
 * the configuration settings and avoid global variables and constants.
 *
 * @author Robbie Hott
 *
 */
class Config {

    /**
     * @var boolean Whether the system is in DEBUG mode
     */
    public static $DEBUG_MODE = true;


    /**
     * Full database connection information
     *
     * Connection information for the POSTGRES database
     *
     * @var array database connection information
     */
//    public static $DATABASE = array (
//        "database" => "db_name",
//        "host" => "hostname.com",
//        "port" => 5432,
//        "user" => "user_id",
//        "password" => "full_password"
//    );
    public static $DATABASE = array (
        "database" => "asci",
        "host" => "db",
        "port" => 5432,
        "user" => "asci",
        "password" => "asci"
    );

    /**
     *
     * @var string directory to write the log files. Must be / terminated.
     */
    public static $LOG_DIR = "/opt/log/";

    /**
     *
     * @var string filename for the Server log
     */
    public static $SERVER_LOGFILE = "server.log";

}

