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
namespace ascillm;

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
    public static $FAKE_LLM_MODE = false;

    // The path of the LLM chat script
    public static $LLM_CHAT_SCRIPT = '/opt/src/ascillm/python/llm_chat.py';
    public static $LLM_RAG_SCRIPT = '/opt/src/ascillm/python/llm_chat/utils/rag_create.py';

    public static $LLM_DATA_DIR = '/opt/data/';

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

