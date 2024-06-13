<?php

/**
 * Server Executor Class File
 *
 * Contains the ServerExector class that performs all the tasks for the main Server
 *
 * @author Robbie Hott
 * @license https://opensource.org/licenses/BSD-3-Clause BSD 3-Clause
 * @copyright 2016 the Rector and Visitors of the University of Virginia, and
 *            the Regents of the University of California
 */
namespace ascillm\server;

class ServerExecutor {
  
    //Logging
    private $logger;


    public function __construct(){
        global $log;
        
        // create a log channel
        $this->logger = new \Monolog\Logger('ServerExecutor');
        $this->logger->pushHandler($log);
    }


    public function llmChat($input) {
        $chat = new LlmChat();

        $response = $chat->getLlmResponse($input["data"]);

        if ($response === false)
          throw new \ascillm\exceptions\ASCILLMException("Could not connect to LLM");

        return $response;
    }

}
