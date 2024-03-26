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
     * @var boolean if false, pull next waiting on queue as potential group members
     * if true, use cosine similarity checking to pick potential group members
     */
    public static $SMART_GROUP_MATCHING = false;

    public static $COSINE_SIMILARITY_SCRIPT = '/opt/asci-queue/asci-main/backend/src/asci/util/group_cosine.py';

    // The path of the LLM chat script
    // May need to be set as '/opt/asci-queue/asci-main/backend/src/asci/util/llm_chat.py' in other environments
    public static $LLM_CHAT_SCRIPT = '/opt/src/asci/util/llm_chat.py';

    /**
      * This is the relative location of the temporary locking files for all requests (see util/ExclusiveLock.php for details)
      * You can also enable/disable locking here
      */
    public static $LOCKING_ENABLED = true;
    public static $LOCKING_FILE_DIR = "./tmp/lock/";

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

