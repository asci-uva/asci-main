<?php

/**
 * Class that connects to the python implementation of LLM-based chatbot
 * The code is based on the code from the CosineSim class
 *
 *
 * License:
 *
 *
 * @author Robert Bao
 * Based on code by Robbie Hott and Mark Floryan (CosineSim.php)
 */
namespace asci\util;

/**
 * LlmChat Class
 *
 * The purpose of this class is to interact with a python implementation of LLM-based chatbot. 
 * Two strings (the question and an optional assignment name) are passed to this program, 
 * and an response from LLM (in the form of a JSON object) is returned.
 *
 * @author Robert Bao
 */

class LlmChat
{

    /**
     * Input parameters from the querier
     *
     * @var array Associative array of the input query
     */
    private $input = null;

    /**
     * @var \Monolog\Logger $logger the logger for this server
     */
    private $logger;

    /**
     * Constructor
     *
     * Takes no input
     *
     * @param array $input Input to the server
     */
    public function __construct()
    {
        global $log;

        // create a log channel
        $this->logger = new \Monolog\Logger('Server');
        $this->logger->pushHandler($log);
    }

    public function testGetLlmResponse(){
        $input_str = "{'command': 'newLlmChat', 'assignmentName': '', 'studentQuestion': 'hi'}";

        return $this->getLlmResponse($input_str);
    }

    
    public function getLlmResponse($input){

        /* Testing opening up pipes and just sending some simple data */
        $descriptorspec = array(
            0 => array("pipe", "r"),  // stdin is a pipe that the child will read from
            1 => array("pipe", "w"),  // stdout is a pipe that the child will write to
            2 => array("pipe", "w")
        );

        /* Hardcoding the call to the python script for now */
        $command = "python3 " . \asci\Config::$LLM_CHAT_SCRIPT;

        // print out the command
        $this->logger->info("Command: " . $command);
        
        $pipes = array();
        $process = proc_open($command, $descriptorspec, $pipes);

        if (is_resource($process)) {
            // $pipes now looks like this:
            // 0 => writeable handle connected to child stdin
            // 1 => readable handle connected to child stdout

            $json_data = json_encode($input);


            fwrite($pipes[0], $json_data . "\n");  
            fwrite($pipes[0], "-1");
            
            fclose($pipes[0]);
            $output = stream_get_contents($pipes[1]);
            fclose($pipes[1]);
            $error = stream_get_contents($pipes[2]);
            fclose($pipes[2]);

            // It is important that you close any pipes before calling
            // proc_close in order to avoid a deadlock
            $return_value = proc_close($process);

            if ($return_value == 1) {
                $this->logger->error("Process ended with an error: " . $error);
                echo "Detailed Error: " . $error . "\n";
            }

            return [$return_value, $output, $error];
        }

        return null;
    }

    
}
