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
     * @var string Authentication mode for the system.  It must be one of the following:
     *   - "netbadge" - UVA's specific Shibboleth authentication
     *   - "password" - built-in password authentication (default)
     *   - "oauth"    - OAuth authentication (in development)
     */
    public static $AUTH_MODE = "password"; 

    /**
     * @var boolean if false, pull next waiting on queue as potential group members
     * if true, use cosine similarity checking to pick potential group members
     */
    public static $SMART_GROUP_MATCHING = false;

    /**
     * @var string full path of the cosine similarity script for smart matching
     */
    public static $COSINE_SIMILARITY_SCRIPT = '/opt/src/asci/util/group_cosine.py';

    /**
     * @var string full path of the LLM chat script for connecting with the LLM
     */
    public static $LLM_CHAT_SCRIPT = '/opt/src/asci/util/llm_chat.py';

    /**
     * @var string full URL to the LLM
     */
    public static $LLM_SERVER_URL = "http://chat:80/";

    /**
     * @var boolean whether or not to enable locking when users are acting
     * in the queue to avoid multiple TAs getting the same student.
     */
    public static $LOCKING_ENABLED = true;

    /**
     * @var string full path to a directory for temporary lock files (if enabled)
     */
    public static $LOCKING_FILE_DIR = "/opt/tmp/";

    /*
     * Variables used for Gradescope data sync
     */

    /**
     * @var string full path to the chrome driver application to interact with Gradescope
     * programmatically.
     */
     public static $CHROME_DRIVER_PATH = '/usr/bin/chromedriver';

    /**
     * @var string full path to the chromium web browser
     */
    public static $CHROMIUM_PATH = "/usr/bin/chromium";

    /**
     * @var string full path to the gradescope sync script.
     */
    public static $GRADESCOPE_SYNC_SCRIPT = '/opt/src/asci/util/data_syn/gradescope_download.py';

    /**
     * @var string full path to temporary directory used for unpacking gradescope
     * data
     */
    public static $GRADESCOPE_DOWNLOAD_PATH = '/tmp/asci/gradescope/';



    /**
     * Full database connection information
     *
     * Connection information for the POSTGRES database
     *
     * @var array database connection information
     */
    public static $DATABASE = array (
        "database" => "asci",
        "host" => "db",
        "port" => 5432,
        "user" => "asci",
        "password" => "asci"
    );

    /**
     * @var string directory to write the log files. Must be / terminated.
     */
    public static $LOG_DIR = "/opt/log/";

    /**
     * @var string filename for the Server log
     */
    public static $SERVER_LOGFILE = "server.log";

    /**
     * @var string maximum file upload size for LLM RAG zip files
     */
    public static $MAX_UPLOAD_SIZE = "500000000";
}


